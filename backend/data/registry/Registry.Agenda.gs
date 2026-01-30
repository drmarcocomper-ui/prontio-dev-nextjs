// backend/data/registry/Registry.Agenda.gs
/**
 * Registry.Agenda.gs
 * Locks dinâmicos por profissional + data:
 *   agenda:{idProfissional}:{YYYY-MM-DD}
 *
 * Ajustes (2026-01):
 * - LockKey fail-fast (sem fallback global).
 * - Payload canônico camelCase.
 * - ✅ Actions canônicas apontam DIRETO para Agenda_Action_* (sem handlers ocultos).
 * - ✅ Adiciona action canônica: Agenda.ListarEventosDiaParaValidacao (payload { idProfissional, data })
 */

function _Registry_agendaThrowValidation_(message, details) {
  try {
    if (typeof _Registry_throw_ === "function") {
      _Registry_throw_("VALIDATION_ERROR", message, details || {});
      return;
    }
  } catch (_) {}

  var e = new Error(message || "Validation error");
  e.code = "VALIDATION_ERROR";
  e.details = details || {};
  throw e;
}

/** @returns {string} YYYY-MM-DD */
function _Registry_agendaFormatYMD_(d) {
  try {
    if (typeof _agendaFormatYYYYMMDD_ === "function") return _agendaFormatYYYYMMDD_(d);
  } catch (_) {}

  var iso = d.toISOString();
  return String(iso).slice(0, 10);
}

function _Registry_agendaExtractProfAndDateFromPayload_(payload) {
  payload = payload || {};

  var idProf = payload.idProfissional ? String(payload.idProfissional) : "";
  var ymd = "";

  if (payload.data) {
    var ds = String(payload.data).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(ds)) ymd = ds;
  }

  if (!ymd && payload.inicio) {
    var dt = null;
    try { dt = new Date(String(payload.inicio)); } catch (_) {}
    if (dt && !isNaN(dt.getTime())) ymd = _Registry_agendaFormatYMD_(dt);
  }

  if (!ymd && payload.inicioEm) {
    var dt2 = null;
    try { dt2 = new Date(String(payload.inicioEm)); } catch (_) {}
    if (dt2 && !isNaN(dt2.getTime())) ymd = _Registry_agendaFormatYMD_(dt2);
  }

  return { idProfissional: idProf, ymd: ymd };
}

function _Registry_agendaExtractFromExistingByIdAgenda_(idAgenda) {
  try {
    if (!idAgenda) return { idProfissional: "", ymd: "" };
    if (typeof Repo_getById_ !== "function") return { idProfissional: "", ymd: "" };

    var row = Repo_getById_(AGENDA_ENTITY, AGENDA_ID_FIELD, String(idAgenda));
    if (!row) return { idProfissional: "", ymd: "" };

    var dto = row;
    try {
      if (typeof _agendaNormalizeRowToDto_ === "function") dto = _agendaNormalizeRowToDto_(row);
    } catch (_) {}

    var idProf = dto && dto.idProfissional ? String(dto.idProfissional) : "";
    var ymd = "";

    if (dto && dto.inicio) {
      var dt = null;
      try { dt = new Date(String(dto.inicio)); } catch (_) {}
      if (dt && !isNaN(dt.getTime())) ymd = _Registry_agendaFormatYMD_(dt);
    }

    return { idProfissional: idProf, ymd: ymd };
  } catch (_) {
    return { idProfissional: "", ymd: "" };
  }
}

function _Registry_agendaLockKey_(ctx, payload) {
  payload = payload || {};

  var ex = _Registry_agendaExtractProfAndDateFromPayload_(payload);
  var idProf = ex.idProfissional;
  var ymd = ex.ymd;

  if ((!idProf || !ymd) && payload.idAgenda) {
    var ex2 = _Registry_agendaExtractFromExistingByIdAgenda_(payload.idAgenda);
    if (!idProf) idProf = ex2.idProfissional;
    if (!ymd) ymd = ex2.ymd;
  }

  if (!idProf || !ymd) {
    _Registry_agendaThrowValidation_(
      'Não foi possível calcular lock da Agenda. Envie "idProfissional" e "data" (YYYY-MM-DD) ou "inicio" (ISO), ou informe "idAgenda" válido.',
      { missing: { idProfissional: !idProf, ymd: !ymd }, payload: payload }
    );
  }

  return "agenda:" + idProf + ":" + ymd;
}

function Registry_RegisterAgenda_(map) {
  map["Agenda.ListarPorPeriodo"] = {
    action: "Agenda.ListarPorPeriodo",
    handler: (typeof Agenda_Action_ListarPorPeriodo_ === "function")
      ? Agenda_Action_ListarPorPeriodo_
      : _Registry_missingHandler_("Agenda_Action_ListarPorPeriodo_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["Agenda.Listar"] = {
    action: "Agenda.Listar",
    handler: _Registry_agendaListarHandler_(),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["Agenda.Criar"] = {
    action: "Agenda.Criar",
    handler: (typeof Agenda_Action_Criar_ === "function")
      ? Agenda_Action_Criar_
      : _Registry_missingHandler_("Agenda_Action_Criar_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: _Registry_agendaLockKey_
  };

  map["Agenda.Atualizar"] = {
    action: "Agenda.Atualizar",
    handler: (typeof Agenda_Action_Atualizar_ === "function")
      ? Agenda_Action_Atualizar_
      : _Registry_missingHandler_("Agenda_Action_Atualizar_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: _Registry_agendaLockKey_
  };

  map["Agenda.Cancelar"] = {
    action: "Agenda.Cancelar",
    handler: (typeof Agenda_Action_Cancelar_ === "function")
      ? Agenda_Action_Cancelar_
      : _Registry_missingHandler_("Agenda_Action_Cancelar_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: _Registry_agendaLockKey_
  };

  // ✅ Agora aponta direto para Actions canônicas
  map["Agenda.BloquearHorario"] = {
    action: "Agenda.BloquearHorario",
    handler: (typeof Agenda_Action_BloquearHorario_ === "function")
      ? Agenda_Action_BloquearHorario_
      : _Registry_missingHandler_("Agenda_Action_BloquearHorario_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: _Registry_agendaLockKey_
  };

  map["Agenda.DesbloquearHorario"] = {
    action: "Agenda.DesbloquearHorario",
    handler: (typeof Agenda_Action_DesbloquearHorario_ === "function")
      ? Agenda_Action_DesbloquearHorario_
      : _Registry_missingHandler_("Agenda_Action_DesbloquearHorario_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: _Registry_agendaLockKey_
  };

  map["Agenda.ListarEventosDiaParaValidacao"] = {
    action: "Agenda.ListarEventosDiaParaValidacao",
    handler: (typeof Agenda_Action_ListarEventosDiaParaValidacao_ === "function")
      ? Agenda_Action_ListarEventosDiaParaValidacao_
      : _Registry_missingHandler_("Agenda_Action_ListarEventosDiaParaValidacao_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  // Aliases legacy — compat temporário
  map["Agenda_Criar"] = {
    action: "Agenda_Criar",
    handler: map["Agenda.Criar"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: _Registry_agendaLockKey_
  };

  map["Agenda_Atualizar"] = {
    action: "Agenda_Atualizar",
    handler: map["Agenda.Atualizar"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: _Registry_agendaLockKey_
  };

  // Mantém por compat (mas recomenda-se migrar para Agenda.ListarEventosDiaParaValidacao)
  map["Agenda_ListarEventosDiaParaValidacao"] = {
    action: "Agenda_ListarEventosDiaParaValidacao",
    handler: (typeof Agenda_Action_ListarEventosDiaParaValidacao_ === "function")
      ? function (ctx, payload) { return Agenda_Action_ListarEventosDiaParaValidacao_(ctx, payload || {}); }
      : _Registry_missingHandler_("Agenda_Action_ListarEventosDiaParaValidacao_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  // AgendaConfig (call-time)
  map["AgendaConfig_Obter"] = {
    action: "AgendaConfig_Obter",
    handler: function (ctx, payload) {
      if (typeof handleAgendaConfigAction !== "function") {
        return _Registry_missingHandler_("handleAgendaConfigAction")(ctx, payload);
      }
      return handleAgendaConfigAction("AgendaConfig_Obter", payload || {});
    },
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["AgendaConfig_Salvar"] = {
    action: "AgendaConfig_Salvar",
    handler: function (ctx, payload) {
      if (typeof handleAgendaConfigAction !== "function") {
        return _Registry_missingHandler_("handleAgendaConfigAction")(ctx, payload);
      }
      return handleAgendaConfigAction("AgendaConfig_Salvar", payload || {});
    },
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "AGENDA_CONFIG"
  };

  map["AgendaConfig.Obter"] = {
    action: "AgendaConfig.Obter",
    handler: map["AgendaConfig_Obter"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["AgendaConfig.Salvar"] = {
    action: "AgendaConfig.Salvar",
    handler: map["AgendaConfig_Salvar"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "AGENDA_CONFIG"
  };

  // ValidarConflito (canônico + alias)
  map["Agenda_ValidarConflito"] = {
    action: "Agenda_ValidarConflito",
    handler: _Registry_agendaValidarConflitoHandler_(),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["Agenda.ValidarConflito"] = {
    action: "Agenda.ValidarConflito",
    handler: map["Agenda_ValidarConflito"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  // Legados / compat
  var agendaLegacyMap = [
    ["Agenda_ListarDia", "Agenda_Legacy_ListarDia_"],
    ["Agenda_ListarSemana", "Agenda_Legacy_ListarSemana_"],
    ["Agenda_MudarStatus", "Agenda_Legacy_MudarStatus_"],
    ["Agenda_RemoverBloqueio", "Agenda_Legacy_RemoverBloqueio_"],
    ["Agenda_BloquearHorario", "Agenda_Legacy_BloquearHorario_"],
    ["Agenda_ListarAFuturo", ""],
    ["Agenda.ListarAFuturo", ""]
  ];

  for (var i = 0; i < agendaLegacyMap.length; i++) {
    var legacyAction = agendaLegacyMap[i][0];
    var modernFn = agendaLegacyMap[i][1];

    map[legacyAction] = {
      action: legacyAction,
      handler: modernFn
        ? _Registry_tryModernElseLegacy_(modernFn, legacyAction)
        : _Registry_legacyHandler_(legacyAction),
      requiresAuth: true,
      roles: [],
      validations: [],
      requiresLock: true,
      lockKey: "AGENDA_LEGACY"
    };
  }
}

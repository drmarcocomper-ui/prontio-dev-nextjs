// backend/data/registry/Registry.Agenda.gs
/**
 * Registry.Agenda.gs
 * Locks dinâmicos por profissional + data:
 *   agenda:{idProfissional}:{YYYY-MM-DD}
 *
 * Ajustes (2026-01):
 * - LockKey fail-fast (sem fallback global).
 * - Payload canônico camelCase.
 * - Actions canônicas apontam DIRETO para Agenda_Action_*.
 * - ✅ Compat com AgendaEventos: aceita idEvento e inicioDateTime.
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

/**
 * Tenta obter { idProfissional, ymd } do payload.
 * Aceita:
 * - data (YYYY-MM-DD)
 * - inicio (ISO) (compat)
 * - inicioDateTime (ISO) (novo)
 * - inicioEm (ISO) (compat)
 */
function _Registry_agendaExtractProfAndDateFromPayload_(payload) {
  payload = payload || {};

  var idProf = payload.idProfissional ? String(payload.idProfissional) : "";
  var ymd = "";

  if (payload.data) {
    var ds = String(payload.data).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(ds)) ymd = ds;
  }

  // inicioDateTime (novo)
  if (!ymd && payload.inicioDateTime) {
    var dt0 = null;
    try { dt0 = new Date(String(payload.inicioDateTime)); } catch (_) {}
    if (dt0 && !isNaN(dt0.getTime())) ymd = _Registry_agendaFormatYMD_(dt0);
  }

  // inicio (compat)
  if (!ymd && payload.inicio) {
    var dt = null;
    try { dt = new Date(String(payload.inicio)); } catch (_) {}
    if (dt && !isNaN(dt.getTime())) ymd = _Registry_agendaFormatYMD_(dt);
  }

  // inicioEm (compat)
  if (!ymd && payload.inicioEm) {
    var dt2 = null;
    try { dt2 = new Date(String(payload.inicioEm)); } catch (_) {}
    if (dt2 && !isNaN(dt2.getTime())) ymd = _Registry_agendaFormatYMD_(dt2);
  }

  return { idProfissional: idProf, ymd: ymd };
}

/**
 * Busca o evento existente para derivar idProfissional + data (por idEvento/idAgenda).
 */
function _Registry_agendaExtractFromExistingByIdEvento_(idEventoOrAgenda) {
  try {
    var id = String(idEventoOrAgenda || "").trim();
    if (!id) return { idProfissional: "", ymd: "" };
    if (typeof Repo_getById_ !== "function") return { idProfissional: "", ymd: "" };

    var row = Repo_getById_(AGENDA_ENTITY, AGENDA_ID_FIELD, id);
    if (!row) return { idProfissional: "", ymd: "" };

    var dto = row;
    try {
      if (typeof _agendaNormalizeRowToDto_ === "function") dto = _agendaNormalizeRowToDto_(row);
    } catch (_) {}

    var idProf = dto && dto.idProfissional ? String(dto.idProfissional) : "";
    var ymd = "";

    var iniIso = (dto && (dto.inicioDateTime || dto.inicio)) ? String(dto.inicioDateTime || dto.inicio) : "";
    if (iniIso) {
      var dt = null;
      try { dt = new Date(iniIso); } catch (_) {}
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

  // Se não veio no payload, tenta por idEvento ou idAgenda
  var idRef =
    (payload.idEvento ? String(payload.idEvento) :
      (payload.idAgenda ? String(payload.idAgenda) : ""));

  if ((!idProf || !ymd) && idRef) {
    var ex2 = _Registry_agendaExtractFromExistingByIdEvento_(idRef);
    if (!idProf) idProf = ex2.idProfissional;
    if (!ymd) ymd = ex2.ymd;
  }

  if (!idProf || !ymd) {
    _Registry_agendaThrowValidation_(
      'Não foi possível calcular lock da Agenda. Envie "idProfissional" e "data" (YYYY-MM-DD) ou "inicioDateTime" (ISO), ou informe "idEvento/idAgenda" válido.',
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

  map["Agenda.ValidarConflito"] = {
    action: "Agenda.ValidarConflito",
    handler: (typeof Agenda_Action_ValidarConflito_ === "function")
      ? Agenda_Action_ValidarConflito_
      : _Registry_missingHandler_("Agenda_Action_ValidarConflito_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

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

  // aliases compat (temporário)
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

  map["Agenda_ValidarConflito"] = {
    action: "Agenda_ValidarConflito",
    handler: map["Agenda.ValidarConflito"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["Agenda_ListarEventosDiaParaValidacao"] = {
    action: "Agenda_ListarEventosDiaParaValidacao",
    handler: map["Agenda.ListarEventosDiaParaValidacao"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  // ===================== AGENDA CONFIG ========================

  function _agendaConfigHandler_(actionName) {
    return function (ctx, payload) {
      if (typeof handleAgendaConfigAction !== "function") {
        var e = new Error("handleAgendaConfigAction não disponível.");
        e.code = "INTERNAL_ERROR";
        e.details = { action: actionName };
        throw e;
      }
      return handleAgendaConfigAction(actionName, payload || {});
    };
  }

  map["AgendaConfig_Obter"] = {
    action: "AgendaConfig_Obter",
    handler: _agendaConfigHandler_("AgendaConfig_Obter"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["AgendaConfig_Salvar"] = {
    action: "AgendaConfig_Salvar",
    handler: _agendaConfigHandler_("AgendaConfig_Salvar"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "AGENDA_CONFIG"
  };

  // aliases canônicos (dot notation)
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
}

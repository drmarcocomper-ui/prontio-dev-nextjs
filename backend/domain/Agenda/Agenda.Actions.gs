// backend/domain/Agenda/Agenda.Actions.gs
// ============================================================
// PRONTIO — Agenda Actions (Back)
// Ajustes (2026-01):
// - Remove acoplamento com Pacientes (sem _agendaAttachNomeCompleto_)
// - Lista/Criar/Atualizar/Cancelar retornam DTO puro (Agenda) + idPaciente
// - Atualizar: permitirEncaixe deriva do estado final (existing + patch)
// - Mantém lock por idProfissional + data (regra canônica)
// - ✅ NOVO: Agenda_Action_ListarEventosDiaParaValidacao_ (payload { idProfissional, data })
// - ✅ NOVO: Agenda_Action_BloquearHorario_ / Agenda_Action_DesbloquearHorario_ (canônicas)
// ============================================================

function Agenda_Action_ListarPorPeriodo_(ctx, payload) {
  payload = payload || {};

  var ini = _agendaParseDateRequired_(payload.inicio, "inicio");
  var fim = _agendaParseDateRequired_(payload.fim, "fim");

  if (fim.getTime() < ini.getTime()) {
    _agendaThrow_("VALIDATION_ERROR", '"fim" não pode ser menor que "inicio".', {});
  }

  var incluirCancelados = payload.incluirCancelados === true;
  var idPaciente = payload.idPaciente ? String(payload.idPaciente) : null;

  var idProfissional = payload.idProfissional ? String(payload.idProfissional) : null;

  var all = Repo_list_(AGENDA_ENTITY);
  var out = [];

  for (var i = 0; i < all.length; i++) {
    var e = _agendaNormalizeRowToDto_(all[i]);

    e.tipo = _agendaNormalizeTipo_(e.tipo);
    e.status = _agendaNormalizeStatus_(e.status);
    e.origem = _agendaNormalizeOrigem_(e.origem);

    if (!incluirCancelados && e.status === AGENDA_STATUS.CANCELADO) continue;
    if (idPaciente && String(e.idPaciente || "") !== idPaciente) continue;
    if (idProfissional && String(e.idProfissional || "") !== idProfissional) continue;

    var evIni = _agendaParseDate_(e.inicio);
    var evFim = _agendaParseDate_(e.fim);
    if (!evIni || !evFim) continue;

    if (evIni.getTime() > fim.getTime() || evFim.getTime() < ini.getTime()) continue;

    out.push(e);
  }

  out.sort(function (a, b) {
    return _agendaParseDate_(a.inicio).getTime() - _agendaParseDate_(b.inicio).getTime();
  });

  return {
    success: true,
    data: { items: out, count: out.length },
    errors: []
  };
}

function Agenda_Action_Criar_(ctx, payload) {
  payload = payload || {};
  var params = Config_getAgendaParams_();

  var idProfissional = payload.idProfissional ? String(payload.idProfissional) : "";
  if (!idProfissional) {
    _agendaThrow_("VALIDATION_ERROR", '"idProfissional" é obrigatório.', { field: "idProfissional" });
  }

  var norm = _agendaNormalizeCreateInput_(payload, params);
  norm.idProfissional = idProfissional;

  if (norm.tipo === AGENDA_TIPO.BLOQUEIO) {
    norm.idPaciente = "";
    norm.status = AGENDA_STATUS.MARCADO;
  }

  var lockKey = "agenda:" + idProfissional + ":" + _agendaFormatYYYYMMDD_(norm.inicio);

  var createdDto = null;

  Locks_withLock_(lockKey, function () {
    _agendaAssertSemConflitos_(ctx, {
      inicio: norm.inicio,
      fim: norm.fim,
      idProfissional: idProfissional,
      permitirEncaixe: norm.permitirEncaixe === true,
      modoBloqueio: norm.tipo === AGENDA_TIPO.BLOQUEIO,
      ignoreIdAgenda: null
    }, params);

    var idAgenda = Ids_nextId_("AGENDA");
    var now = new Date().toISOString();

    var dto = {
      idAgenda: idAgenda,
      idProfissional: idProfissional,
      idPaciente: norm.idPaciente || "",
      inicio: norm.inicio.toISOString(),
      fim: norm.fim.toISOString(),
      titulo: norm.titulo || "",
      notas: norm.notas || "",
      tipo: norm.tipo,
      status: norm.status,
      origem: norm.origem,
      criadoEm: now,
      atualizadoEm: now,
      canceladoEm: "",
      canceladoMotivo: ""
    };

    Repo_insert_(AGENDA_ENTITY, dto);
    createdDto = dto;
  });

  return {
    success: true,
    data: { item: _agendaNormalizeRowToDto_(createdDto) },
    errors: []
  };
}

function Agenda_Action_Atualizar_(ctx, payload) {
  payload = payload || {};
  var idAgenda = String(payload.idAgenda || "");
  if (!idAgenda) _agendaThrow_("VALIDATION_ERROR", '"idAgenda" é obrigatório.', { field: "idAgenda" });

  var params = Config_getAgendaParams_();

  var existing = Repo_getById_(AGENDA_ENTITY, AGENDA_ID_FIELD, idAgenda);
  if (!existing) _agendaThrow_("NOT_FOUND", "Agendamento não encontrado.", { idAgenda: idAgenda });

  existing = _agendaNormalizeRowToDto_(existing);

  var idProfissional = String(existing.idProfissional || "");
  if (!idProfissional) {
    idProfissional = payload.idProfissional ? String(payload.idProfissional) : "";
  }
  if (!idProfissional) {
    _agendaThrow_("VALIDATION_ERROR", '"idProfissional" é obrigatório.', { field: "idProfissional" });
  }

  var patchIn = (payload.patch && typeof payload.patch === "object") ? payload.patch : {};
  var mergedPatch = _agendaBuildUpdatePatch_(existing, patchIn, payload, params);

  var newInicio = (mergedPatch.inicio !== undefined)
    ? _agendaParseDate_(mergedPatch.inicio)
    : _agendaParseDate_(existing.inicio);

  var newFim = (mergedPatch.fim !== undefined)
    ? _agendaParseDate_(mergedPatch.fim)
    : _agendaParseDate_(existing.fim);

  if (!newInicio || !newFim) _agendaThrow_("VALIDATION_ERROR", "Datas inválidas em atualização.", { idAgenda: idAgenda });
  if (newFim.getTime() < newInicio.getTime()) _agendaThrow_("VALIDATION_ERROR", '"fim" não pode ser menor que "inicio".', {});

  var finalPermitirEncaixe = false;
  if (mergedPatch.permitirEncaixe !== undefined) {
    finalPermitirEncaixe = (mergedPatch.permitirEncaixe === true);
  } else if (existing.permitirEncaixe !== undefined) {
    finalPermitirEncaixe = (existing.permitirEncaixe === true);
  } else {
    finalPermitirEncaixe = false;
  }

  var lockKey = "agenda:" + idProfissional + ":" + _agendaFormatYYYYMMDD_(newInicio);

  Locks_withLock_(lockKey, function () {
    _agendaAssertSemConflitos_(ctx, {
      inicio: newInicio,
      fim: newFim,
      idProfissional: idProfissional,
      permitirEncaixe: finalPermitirEncaixe,
      modoBloqueio: mergedPatch.tipo === AGENDA_TIPO.BLOQUEIO,
      ignoreIdAgenda: idAgenda
    }, params);

    mergedPatch.atualizadoEm = new Date().toISOString();

    if (!existing.idProfissional && mergedPatch.idProfissional === undefined) {
      mergedPatch.idProfissional = idProfissional;
    }

    var ok = Repo_update_(AGENDA_ENTITY, AGENDA_ID_FIELD, idAgenda, mergedPatch);
    if (!ok) _agendaThrow_("NOT_FOUND", "Agendamento não encontrado para atualizar.", { idAgenda: idAgenda });
  });

  var after = Repo_getById_(AGENDA_ENTITY, AGENDA_ID_FIELD, idAgenda);

  return {
    success: true,
    data: { item: _agendaNormalizeRowToDto_(after) },
    errors: []
  };
}

function Agenda_Action_Cancelar_(ctx, payload) {
  payload = payload || {};
  var idAgenda = String(payload.idAgenda || "");
  if (!idAgenda) _agendaThrow_("VALIDATION_ERROR", '"idAgenda" é obrigatório.', { field: "idAgenda" });

  var existing = Repo_getById_(AGENDA_ENTITY, AGENDA_ID_FIELD, idAgenda);
  if (!existing) _agendaThrow_("NOT_FOUND", "Agendamento não encontrado.", { idAgenda: idAgenda });

  existing = _agendaNormalizeRowToDto_(existing);

  var idProfissional = String(existing.idProfissional || "");
  if (!idProfissional) {
    idProfissional = payload.idProfissional ? String(payload.idProfissional) : "";
  }
  if (!idProfissional) {
    _agendaThrow_("VALIDATION_ERROR", '"idProfissional" é obrigatório.', { field: "idProfissional" });
  }

  var dtIni = _agendaParseDate_(existing.inicio);
  if (!dtIni) _agendaThrow_("VALIDATION_ERROR", "Agendamento com início inválido.", { idAgenda: idAgenda });

  var lockKey = "agenda:" + idProfissional + ":" + _agendaFormatYYYYMMDD_(dtIni);

  Locks_withLock_(lockKey, function () {
    var nowIso = new Date().toISOString();
    var ok = Repo_update_(AGENDA_ENTITY, AGENDA_ID_FIELD, idAgenda, {
      status: AGENDA_STATUS.CANCELADO,
      canceladoEm: nowIso,
      canceladoMotivo: payload.motivo ? String(payload.motivo).slice(0, 500) : "",
      atualizadoEm: nowIso
    });
    if (!ok) _agendaThrow_("NOT_FOUND", "Agendamento não encontrado para cancelar.", { idAgenda: idAgenda });
  });

  var after = Repo_getById_(AGENDA_ENTITY, AGENDA_ID_FIELD, idAgenda);

  return {
    success: true,
    data: { item: _agendaNormalizeRowToDto_(after) },
    errors: []
  };
}

function Agenda_Action_ValidarConflito_(ctx, payload) {
  payload = payload || {};

  var idProfissional = payload.idProfissional ? String(payload.idProfissional) : "";
  if (!idProfissional) {
    _agendaThrow_("VALIDATION_ERROR", '"idProfissional" é obrigatório.', { field: "idProfissional" });
  }

  var ini = _agendaBuildDateTime_(payload.data, payload.horaInicio);
  var dur = Number(payload.duracaoMin || 0);
  if (!dur || isNaN(dur) || dur <= 0) {
    _agendaThrow_("VALIDATION_ERROR", '"duracaoMin" inválida.', { field: "duracaoMin" });
  }

  var fim = new Date(ini.getTime() + dur * 60000);

  try {
    _agendaAssertSemConflitos_(ctx, {
      inicio: ini,
      fim: fim,
      idProfissional: idProfissional,
      permitirEncaixe: payload.permitirEncaixe === true,
      modoBloqueio: false,
      ignoreIdAgenda: payload.ignoreIdAgenda || null
    }, Config_getAgendaParams_());

    return {
      success: true,
      data: {
        ok: true,
        conflitos: [],
        intervalo: {
          idProfissional: idProfissional,
          data: payload.data,
          horaInicio: payload.horaInicio,
          duracaoMin: dur
        }
      },
      errors: []
    };

  } catch (err) {
    return {
      success: false,
      data: {
        ok: false,
        intervalo: {
          idProfissional: idProfissional,
          data: payload.data,
          horaInicio: payload.horaInicio,
          duracaoMin: dur
        }
      },
      errors: [{
        code: err.code || "CONFLICT",
        message: err.message || "Conflito de horário",
        details: err.details || {}
      }]
    };
  }
}

function Agenda_Action_ListarEventosDiaParaValidacao_(ctx, payload) {
  payload = payload || {};

  var idProfissional = payload.idProfissional ? String(payload.idProfissional) : "";
  if (!idProfissional) {
    _agendaThrow_("VALIDATION_ERROR", '"idProfissional" é obrigatório.', { field: "idProfissional" });
  }

  var dataStr = payload.data ? String(payload.data).trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
    _agendaThrow_("VALIDATION_ERROR", '"data" inválida (YYYY-MM-DD).', { field: "data", value: dataStr });
  }

  var ini = new Date(Number(dataStr.slice(0, 4)), Number(dataStr.slice(5, 7)) - 1, Number(dataStr.slice(8, 10)), 0, 0, 0, 0);
  var fim = new Date(Number(dataStr.slice(0, 4)), Number(dataStr.slice(5, 7)) - 1, Number(dataStr.slice(8, 10)), 23, 59, 59, 999);

  var res = Agenda_Action_ListarPorPeriodo_(ctx, {
    inicio: ini,
    fim: fim,
    incluirCancelados: false,
    idProfissional: idProfissional
  });

  var items = (res && res.data && res.data.items) ? res.data.items : [];

  var out = [];
  for (var i = 0; i < items.length; i++) {
    var dto = _agendaNormalizeRowToDto_(items[i]);

    var st = _agendaNormalizeStatus_(dto.status);
    if (st === AGENDA_STATUS.CANCELADO) continue;

    var dtIni = _agendaParseDate_(dto.inicio);
    var dtFim = _agendaParseDate_(dto.fim);
    if (!dtIni || !dtFim) continue;

    if (_agendaFormatDate_(dtIni) !== dataStr) continue;

    var durMin = Math.max(1, Math.round((dtFim.getTime() - dtIni.getTime()) / 60000));
    var tipo = _agendaNormalizeTipo_(dto.tipo);

    out.push({
      idAgenda: String(dto.idAgenda || ""),
      idProfissional: idProfissional,
      data: dataStr,
      inicio: dto.inicio,
      fim: dto.fim,
      horaInicio: _agendaFormatHHMM_(dtIni),
      horaFim: _agendaFormatHHMM_(dtFim),
      duracaoMin: durMin,
      tipo: String(tipo || ""),
      bloqueio: (tipo === AGENDA_TIPO.BLOQUEIO)
    });
  }

  return {
    success: true,
    data: { items: out, count: out.length },
    errors: []
  };
}

/**
 * ============================================================
 * ✅ NOVO: Agenda.BloquearHorario (canônico)
 * ------------------------------------------------------------
 * Payload:
 * - idProfissional (obrigatório)
 * - data (YYYY-MM-DD) (obrigatório)
 * - horaInicio (HH:MM) (obrigatório)
 * - duracaoMin (number) (obrigatório)
 *
 * Implementação:
 * - Delegar para Agenda_Action_Criar_ com tipo=BLOQUEIO
 * ============================================================
 */
function Agenda_Action_BloquearHorario_(ctx, payload) {
  payload = payload || {};

  var idProfissional = payload.idProfissional ? String(payload.idProfissional) : "";
  if (!idProfissional) {
    _agendaThrow_("VALIDATION_ERROR", '"idProfissional" é obrigatório.', { field: "idProfissional" });
  }

  var dataStr = payload.data ? String(payload.data).trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
    _agendaThrow_("VALIDATION_ERROR", '"data" inválida (YYYY-MM-DD).', { field: "data", value: dataStr });
  }

  var horaInicio = payload.horaInicio ? String(payload.horaInicio).trim() : "";
  if (!/^\d{2}:\d{2}$/.test(horaInicio)) {
    _agendaThrow_("VALIDATION_ERROR", '"horaInicio" inválida (HH:MM).', { field: "horaInicio", value: horaInicio });
  }

  var dur = Number(payload.duracaoMin || 0);
  if (!dur || isNaN(dur) || dur <= 0) {
    _agendaThrow_("VALIDATION_ERROR", '"duracaoMin" inválida.', { field: "duracaoMin", value: payload.duracaoMin });
  }

  // Delegação canônica para criação (lock + conflito já tratados lá)
  return Agenda_Action_Criar_(ctx, {
    idProfissional: idProfissional,
    data: dataStr,
    horaInicio: horaInicio,
    duracaoMin: dur,
    tipo: AGENDA_TIPO.BLOQUEIO,
    titulo: "BLOQUEIO",
    origem: AGENDA_ORIGEM.SISTEMA,
    notas: payload.notas ? String(payload.notas) : ""
  });
}

/**
 * ============================================================
 * ✅ NOVO: Agenda.DesbloquearHorario (canônico)
 * ------------------------------------------------------------
 * Payload:
 * - idAgenda (obrigatório)
 * - idProfissional (opcional; será derivado do registro quando possível)
 * - motivo (opcional)
 *
 * Implementação:
 * - Delegar para Agenda_Action_Cancelar_ (cancelar != apagar)
 * ============================================================
 */
function Agenda_Action_DesbloquearHorario_(ctx, payload) {
  payload = payload || {};

  var idAgenda = payload.idAgenda ? String(payload.idAgenda).trim() : "";
  if (!idAgenda) {
    _agendaThrow_("VALIDATION_ERROR", '"idAgenda" é obrigatório.', { field: "idAgenda" });
  }

  // Cancelar canônico (lockKey será calculado pelo registro existente se idProfissional faltar)
  return Agenda_Action_Cancelar_(ctx, {
    idAgenda: idAgenda,
    idProfissional: payload.idProfissional ? String(payload.idProfissional) : "",
    motivo: payload.motivo ? String(payload.motivo).slice(0, 500) : "Remover bloqueio"
  });
}

// backend/domain/Agenda/Agenda.Actions.gs
// ============================================================
// PRONTIO — Agenda Actions (Back)
// ============================================================
// ✅ Padrão ideal (AgendaEventos):
// - Entidade canônica: AgendaEventos (idEvento)
// - Datas canônicas: inicioDateTime / fimDateTime (ISO)
// - Soft delete: ativo=false (cancelamento) + status=CANCELADO (não apaga)
// - Locks: agenda:{idProfissional}:{YYYY-MM-DD}
// - Sem join com Pacientes
//
// ✅ Compat temporário (para o front atual não quebrar):
// - Aceita payload.idAgenda como alias de idEvento
// - Respostas incluem idAgenda + inicio + fim como aliases
//
// ✅ Ajuste crítico (Locks):
// - Locks_withLock_ assinatura é (ctx, key, fn)
// ============================================================

function _agendaResolveIdEvento_(payload) {
  payload = payload || {};
  // canônico
  if (payload.idEvento) return String(payload.idEvento).trim();
  // compat front atual
  if (payload.idAgenda) return String(payload.idAgenda).trim();
  if (payload.ID_Agenda) return String(payload.ID_Agenda).trim();
  return "";
}

function _agendaAttachLegacyAliases_(dto) {
  // Para compatibilidade com front/formatters atuais
  if (!dto || typeof dto !== "object") return dto;
  if (!dto.idAgenda) dto.idAgenda = dto.idEvento || "";
  if (!dto.inicio) dto.inicio = dto.inicioDateTime || "";
  if (!dto.fim) dto.fim = dto.fimDateTime || "";
  return dto;
}

function _agendaGetInicioDate_(dto) {
  // retorna Date a partir do DTO normalizado
  var s = (dto && (dto.inicioDateTime || dto.inicio)) ? String(dto.inicioDateTime || dto.inicio) : "";
  return _agendaParseDate_(s);
}

// ============================================================
// LISTAR POR PERÍODO
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

    // aliases p/ compat temporária
    _agendaAttachLegacyAliases_(e);

    e.tipo = _agendaNormalizeTipo_(e.tipo);
    e.status = _agendaNormalizeStatus_(e.status);
    e.origem = _agendaNormalizeOrigem_(e.origem);

    // ativo (AgendaEventos)
    var ativo = (e.ativo === undefined || e.ativo === null) ? true : (e.ativo === true);

    if (!incluirCancelados) {
      if (e.status === AGENDA_STATUS.CANCELADO) continue;
      if (!ativo) continue;
    }

    if (idPaciente && String(e.idPaciente || "") !== idPaciente) continue;
    if (idProfissional && String(e.idProfissional || "") !== idProfissional) continue;

    var evIni = _agendaParseDate_(e.inicioDateTime || e.inicio);
    var evFim = _agendaParseDate_(e.fimDateTime || e.fim);
    if (!evIni || !evFim) continue;

    if (evIni.getTime() > fim.getTime() || evFim.getTime() < ini.getTime()) continue;

    out.push(_agendaAttachLegacyAliases_(e));
  }

  out.sort(function (a, b) {
    return _agendaParseDate_(a.inicioDateTime || a.inicio).getTime() - _agendaParseDate_(b.inicioDateTime || b.inicio).getTime();
  });

  return {
    success: true,
    data: { items: out, count: out.length },
    errors: []
  };
}

// ============================================================
// CRIAR (AgendaEventos)
// ============================================================
function Agenda_Action_Criar_(ctx, payload) {
  payload = payload || {};
  var params = Config_getAgendaParams_();

  var idProfissional = payload.idProfissional ? String(payload.idProfissional) : "";
  if (!idProfissional) {
    _agendaThrow_("VALIDATION_ERROR", '"idProfissional" é obrigatório.', { field: "idProfissional" });
  }

  // ✅ agora o normalize retorna inicioDateTime/fimDateTime como Date
  var norm = _agendaNormalizeCreateInput_(payload, params);
  norm.idProfissional = idProfissional;

  if (norm.tipo === AGENDA_TIPO.BLOQUEIO) {
    norm.idPaciente = "";
    norm.status = AGENDA_STATUS.MARCADO;
  }

  var lockKey = "agenda:" + idProfissional + ":" + _agendaFormatYYYYMMDD_(norm.inicioDateTime);

  var createdDto = null;

  // ✅ Locks_withLock_(ctx, key, fn)
  Locks_withLock_(ctx, lockKey, function () {
    _agendaAssertSemConflitos_(ctx, {
      inicio: norm.inicioDateTime,
      fim: norm.fimDateTime,
      idProfissional: idProfissional,
      permitirEncaixe: norm.permiteEncaixe === true,
      modoBloqueio: norm.tipo === AGENDA_TIPO.BLOQUEIO,
      ignoreIdAgenda: null
    }, params);

    var idEvento = Ids_nextId_("AGENDA_EVENTO");
    var now = new Date().toISOString();

    var dto = {
      idEvento: idEvento,
      idClinica: payload.idClinica ? String(payload.idClinica) : "",
      idProfissional: idProfissional,
      idPaciente: norm.idPaciente || "",

      inicioDateTime: norm.inicioDateTime.toISOString(),
      fimDateTime: norm.fimDateTime.toISOString(),

      titulo: norm.titulo || "",
      notas: norm.notas || "",

      tipo: norm.tipo,
      status: norm.status,
      origem: norm.origem,

      permiteEncaixe: (norm.permiteEncaixe === true),

      canceladoEm: "",
      canceladoMotivo: "",

      criadoEm: now,
      atualizadoEm: now,
      ativo: true
    };

    Repo_insert_(AGENDA_ENTITY, dto);
    createdDto = dto;
  });

  return {
    success: true,
    data: { item: _agendaAttachLegacyAliases_(_agendaNormalizeRowToDto_(createdDto)) },
    errors: []
  };
}

// ============================================================
// ATUALIZAR (AgendaEventos)
// ============================================================
function Agenda_Action_Atualizar_(ctx, payload) {
  payload = payload || {};

  var idEvento = _agendaResolveIdEvento_(payload);
  if (!idEvento) _agendaThrow_("VALIDATION_ERROR", '"idEvento" (ou "idAgenda") é obrigatório.', { field: "idEvento" });

  var params = Config_getAgendaParams_();

  var existing = Repo_getById_(AGENDA_ENTITY, AGENDA_ID_FIELD, idEvento);
  if (!existing) _agendaThrow_("NOT_FOUND", "Agendamento não encontrado.", { idEvento: idEvento });

  existing = _agendaNormalizeRowToDto_(existing);
  _agendaAttachLegacyAliases_(existing);

  var idProfissional = String(existing.idProfissional || "");
  if (!idProfissional) {
    idProfissional = payload.idProfissional ? String(payload.idProfissional) : "";
  }
  if (!idProfissional) {
    _agendaThrow_("VALIDATION_ERROR", '"idProfissional" é obrigatório.', { field: "idProfissional" });
  }

  var patchIn = (payload.patch && typeof payload.patch === "object") ? payload.patch : {};
  var mergedPatch = _agendaBuildUpdatePatch_(existing, patchIn, payload, params);

  // Datas finais (Date)
  var newInicio = (mergedPatch.inicioDateTime !== undefined)
    ? _agendaParseDate_(mergedPatch.inicioDateTime)
    : _agendaParseDate_(existing.inicioDateTime || existing.inicio);

  var newFim = (mergedPatch.fimDateTime !== undefined)
    ? _agendaParseDate_(mergedPatch.fimDateTime)
    : _agendaParseDate_(existing.fimDateTime || existing.fim);

  if (!newInicio || !newFim) _agendaThrow_("VALIDATION_ERROR", "Datas inválidas em atualização.", { idEvento: idEvento });
  if (newFim.getTime() < newInicio.getTime()) _agendaThrow_("VALIDATION_ERROR", '"fim" não pode ser menor que "inicio".', {});

  var finalPermiteEncaixe = false;
  if (mergedPatch.permiteEncaixe !== undefined) finalPermiteEncaixe = (mergedPatch.permiteEncaixe === true);
  else finalPermiteEncaixe = (existing.permiteEncaixe === true);

  var lockKey = "agenda:" + idProfissional + ":" + _agendaFormatYYYYMMDD_(newInicio);

  // ✅ Locks_withLock_(ctx, key, fn)
  Locks_withLock_(ctx, lockKey, function () {
    _agendaAssertSemConflitos_(ctx, {
      inicio: newInicio,
      fim: newFim,
      idProfissional: idProfissional,
      permitirEncaixe: finalPermiteEncaixe,
      modoBloqueio: (mergedPatch.tipo === AGENDA_TIPO.BLOQUEIO) || (existing.tipo === AGENDA_TIPO.BLOQUEIO),
      ignoreIdAgenda: idEvento
    }, params);

    mergedPatch.atualizadoEm = new Date().toISOString();

    // garante idProfissional
    if (!existing.idProfissional && mergedPatch.idProfissional === undefined) {
      mergedPatch.idProfissional = idProfissional;
    }

    // grava no modelo novo
    if (mergedPatch.inicioDateTime !== undefined && mergedPatch.inicioDateTime instanceof Date) {
      mergedPatch.inicioDateTime = mergedPatch.inicioDateTime.toISOString();
    }
    if (mergedPatch.fimDateTime !== undefined && mergedPatch.fimDateTime instanceof Date) {
      mergedPatch.fimDateTime = mergedPatch.fimDateTime.toISOString();
    }

    var ok = Repo_update_(AGENDA_ENTITY, AGENDA_ID_FIELD, idEvento, mergedPatch);
    if (!ok) _agendaThrow_("NOT_FOUND", "Agendamento não encontrado para atualizar.", { idEvento: idEvento });
  });

  var after = Repo_getById_(AGENDA_ENTITY, AGENDA_ID_FIELD, idEvento);

  return {
    success: true,
    data: { item: _agendaAttachLegacyAliases_(_agendaNormalizeRowToDto_(after)) },
    errors: []
  };
}

// ============================================================
// CANCELAR (AgendaEventos)
// ============================================================
function Agenda_Action_Cancelar_(ctx, payload) {
  payload = payload || {};

  var idEvento = _agendaResolveIdEvento_(payload);
  if (!idEvento) _agendaThrow_("VALIDATION_ERROR", '"idEvento" (ou "idAgenda") é obrigatório.', { field: "idEvento" });

  var existing = Repo_getById_(AGENDA_ENTITY, AGENDA_ID_FIELD, idEvento);
  if (!existing) _agendaThrow_("NOT_FOUND", "Agendamento não encontrado.", { idEvento: idEvento });

  existing = _agendaNormalizeRowToDto_(existing);
  _agendaAttachLegacyAliases_(existing);

  var idProfissional = String(existing.idProfissional || "");
  if (!idProfissional) idProfissional = payload.idProfissional ? String(payload.idProfissional) : "";
  if (!idProfissional) _agendaThrow_("VALIDATION_ERROR", '"idProfissional" é obrigatório.', { field: "idProfissional" });

  var dtIni = _agendaParseDate_(existing.inicioDateTime || existing.inicio);
  if (!dtIni) _agendaThrow_("VALIDATION_ERROR", "Agendamento com início inválido.", { idEvento: idEvento });

  var lockKey = "agenda:" + idProfissional + ":" + _agendaFormatYYYYMMDD_(dtIni);

  // ✅ Locks_withLock_(ctx, key, fn)
  Locks_withLock_(ctx, lockKey, function () {
    var nowIso = new Date().toISOString();
    var ok = Repo_update_(AGENDA_ENTITY, AGENDA_ID_FIELD, idEvento, {
      status: AGENDA_STATUS.CANCELADO,
      ativo: false,
      canceladoEm: nowIso,
      canceladoMotivo: payload.motivo ? String(payload.motivo).slice(0, 500) : "",
      atualizadoEm: nowIso
    });
    if (!ok) _agendaThrow_("NOT_FOUND", "Agendamento não encontrado para cancelar.", { idEvento: idEvento });
  });

  var after = Repo_getById_(AGENDA_ENTITY, AGENDA_ID_FIELD, idEvento);

  return {
    success: true,
    data: { item: _agendaAttachLegacyAliases_(_agendaNormalizeRowToDto_(after)) },
    errors: []
  };
}

// ============================================================
// VALIDAR CONFLITO (já canônico)
// ============================================================
function Agenda_Action_ValidarConflito_(ctx, payload) {
  payload = payload || {};

  var idProfissional = payload.idProfissional ? String(payload.idProfissional) : "";
  if (!idProfissional) _agendaThrow_("VALIDATION_ERROR", '"idProfissional" é obrigatório.', { field: "idProfissional" });

  var ini = _agendaBuildDateTime_(payload.data, payload.horaInicio);
  var dur = Number(payload.duracaoMin || 0);
  if (!dur || isNaN(dur) || dur <= 0) _agendaThrow_("VALIDATION_ERROR", '"duracaoMin" inválida.', { field: "duracaoMin" });

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

    return { success: true, data: { ok: true, conflitos: [] }, errors: [] };
  } catch (err) {
    return {
      success: false,
      data: { ok: false },
      errors: [{
        code: err.code || "CONFLICT",
        message: err.message || "Conflito de horário",
        details: err.details || {}
      }]
    };
  }
}

// ============================================================
// LISTAR EVENTOS DO DIA PARA VALIDAÇÃO (canônico)
// ============================================================
function Agenda_Action_ListarEventosDiaParaValidacao_(ctx, payload) {
  payload = payload || {};

  var idProfissional = payload.idProfissional ? String(payload.idProfissional) : "";
  if (!idProfissional) _agendaThrow_("VALIDATION_ERROR", '"idProfissional" é obrigatório.', { field: "idProfissional" });

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
    _agendaAttachLegacyAliases_(dto);

    var st = _agendaNormalizeStatus_(dto.status);
    if (st === AGENDA_STATUS.CANCELADO) continue;

    var dtIni = _agendaParseDate_(dto.inicioDateTime || dto.inicio);
    var dtFim = _agendaParseDate_(dto.fimDateTime || dto.fim);
    if (!dtIni || !dtFim) continue;

    if (_agendaFormatDate_(dtIni) !== dataStr) continue;

    var durMin = Math.max(1, Math.round((dtFim.getTime() - dtIni.getTime()) / 60000));
    var tipo = _agendaNormalizeTipo_(dto.tipo);

    out.push({
      idEvento: String(dto.idEvento || ""),
      // aliases p/ compat
      idAgenda: String(dto.idEvento || ""),

      idProfissional: idProfissional,
      data: dataStr,

      inicioDateTime: dto.inicioDateTime || dto.inicio,
      fimDateTime: dto.fimDateTime || dto.fim,

      horaInicio: _agendaFormatHHMM_(dtIni),
      horaFim: _agendaFormatHHMM_(dtFim),
      duracaoMin: durMin,

      tipo: String(tipo || ""),
      bloqueio: (tipo === AGENDA_TIPO.BLOQUEIO)
    });
  }

  return { success: true, data: { items: out, count: out.length }, errors: [] };
}

// ============================================================
// BLOQUEAR / DESBLOQUEAR (canônico)
// ============================================================
function Agenda_Action_BloquearHorario_(ctx, payload) {
  payload = payload || {};

  var idProfissional = payload.idProfissional ? String(payload.idProfissional) : "";
  if (!idProfissional) _agendaThrow_("VALIDATION_ERROR", '"idProfissional" é obrigatório.', { field: "idProfissional" });

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

  return Agenda_Action_Criar_(ctx, {
    idProfissional: idProfissional,
    idClinica: payload.idClinica ? String(payload.idClinica) : "",
    data: dataStr,
    horaInicio: horaInicio,
    duracaoMin: dur,
    tipo: AGENDA_TIPO.BLOQUEIO,
    titulo: "BLOQUEIO",
    origem: AGENDA_ORIGEM.SISTEMA,
    notas: payload.notas ? String(payload.notas) : "",
    permiteEncaixe: false
  });
}

function Agenda_Action_DesbloquearHorario_(ctx, payload) {
  payload = payload || {};

  var idEvento = _agendaResolveIdEvento_(payload);
  if (!idEvento) _agendaThrow_("VALIDATION_ERROR", '"idEvento" (ou "idAgenda") é obrigatório.', { field: "idEvento" });

  return Agenda_Action_Cancelar_(ctx, {
    idEvento: idEvento,
    idProfissional: payload.idProfissional ? String(payload.idProfissional) : "",
    motivo: payload.motivo ? String(payload.motivo).slice(0, 500) : "Remover bloqueio"
  });
}

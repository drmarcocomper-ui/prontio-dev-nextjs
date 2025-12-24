/**
 * ============================================================
 * PRONTIO - Atendimento.gs (MÓDULO NOVO)
 * ============================================================
 * Domínio: Atendimento = fluxo operacional do dia (fila, chegada, chamado, início, conclusão).
 * NÃO substitui Agenda.gs (calendário/compromissos).
 *
 * IMPORTANTE:
 * - NÃO usa SpreadsheetApp (Sheets só via Repository).
 * - IDs: Ids_nextId_("ATENDIMENTO")
 * - Locks: aplicados no Api.gs via entry.requiresLock (este módulo NÃO trava aqui).
 *
 * Entidade (backend-only):
 * - sheet/entity: "Atendimento"
 * - idField: "idAtendimento"
 *
 * Actions:
 * - Atendimento.ListarFilaHoje
 * - Atendimento.MarcarChegada
 * - Atendimento.ChamarProximo
 * - Atendimento.Iniciar
 * - Atendimento.Concluir
 * - Atendimento.Cancelar
 */

var ATENDIMENTO_ENTITY = "Atendimento";
var ATENDIMENTO_ID_FIELD = "idAtendimento";

var ATENDIMENTO_STATUS = {
  AGUARDANDO: "AGUARDANDO",
  CHEGOU: "CHEGOU",
  CHAMADO: "CHAMADO",
  EM_ATENDIMENTO: "EM_ATENDIMENTO",
  CONCLUIDO: "CONCLUIDO",
  CANCELADO: "CANCELADO"
};

/**
 * Atendimento.ListarFilaHoje
 * payload: { dataRef?: "YYYY-MM-DD", incluirConcluidos?: boolean, incluirCancelados?: boolean }
 */
function Atendimento_Action_ListarFilaHoje_(ctx, payload) {
  payload = payload || {};

  var dataRef = _atdNormalizeDateRef_(payload.dataRef);
  var incluirConcluidos = payload.incluirConcluidos === true;
  var incluirCancelados = payload.incluirCancelados === true;

  var all = Repo_list_(ATENDIMENTO_ENTITY) || [];
  var out = [];

  for (var i = 0; i < all.length; i++) {
    var a = _atdNormalizeRowToDto_(all[i]);
    if (!a.ativo) continue;
    if (String(a.dataRef || "") !== dataRef) continue;

    var st = _atdNormalizeStatus_(a.status);
    a.status = st;

    if (!incluirCancelados && st === ATENDIMENTO_STATUS.CANCELADO) continue;
    if (!incluirConcluidos && st === ATENDIMENTO_STATUS.CONCLUIDO) continue;

    out.push(a);
  }

  out.sort(_atdCompareFila_);
  return { items: out, count: out.length, dataRef: dataRef };
}

/**
 * Atendimento.MarcarChegada
 * payload: { idAgenda: string, idPaciente?: string, dataRef?: "YYYY-MM-DD", sala?: string, observacoes?: string, ordem?: number }
 */
function Atendimento_Action_MarcarChegada_(ctx, payload) {
  payload = payload || {};
  var idAgenda = payload.idAgenda ? String(payload.idAgenda) : "";
  if (!idAgenda) _atdThrow_("VALIDATION_ERROR", '"idAgenda" é obrigatório.', { field: "idAgenda" });

  var dataRef = _atdNormalizeDateRef_(payload.dataRef);
  var nowIso = new Date().toISOString();

  var existing = _atdFindByAgendaAndDate_(idAgenda, dataRef);
  if (!existing) {
    var dto = _atdBuildNew_(payload, {
      idAgenda: idAgenda,
      dataRef: dataRef,
      status: ATENDIMENTO_STATUS.CHEGOU,
      chegadaEm: nowIso
    });
    Repo_insert_(ATENDIMENTO_ENTITY, dto);
    return { item: dto };
  }

  var st = _atdNormalizeStatus_(existing.status);
  var patch = {
    status: (st === ATENDIMENTO_STATUS.AGUARDANDO) ? ATENDIMENTO_STATUS.CHEGOU : st,
    atualizadoEm: nowIso
  };

  if (!existing.chegadaEm) patch.chegadaEm = nowIso;
  if (payload.sala !== undefined) patch.sala = String(payload.sala || "");
  if (payload.observacoes !== undefined) patch.observacoes = String(payload.observacoes || "");
  if (payload.ordem !== undefined) patch.ordem = _atdNormalizeNumberOrBlank_(payload.ordem);

  Repo_update_(ATENDIMENTO_ENTITY, ATENDIMENTO_ID_FIELD, existing.idAtendimento, patch);
  var after = Repo_getById_(ATENDIMENTO_ENTITY, ATENDIMENTO_ID_FIELD, existing.idAtendimento);
  return { item: _atdNormalizeRowToDto_(after) };
}

/**
 * Atendimento.ChamarProximo
 * payload: { dataRef?: "YYYY-MM-DD" }
 */
function Atendimento_Action_ChamarProximo_(ctx, payload) {
  payload = payload || {};
  var dataRef = _atdNormalizeDateRef_(payload.dataRef);
  var nowIso = new Date().toISOString();

  var all = Repo_list_(ATENDIMENTO_ENTITY) || [];
  var candidates = [];

  for (var i = 0; i < all.length; i++) {
    var a = _atdNormalizeRowToDto_(all[i]);
    if (!a.ativo) continue;
    if (String(a.dataRef || "") !== dataRef) continue;

    a.status = _atdNormalizeStatus_(a.status);

    if (a.status === ATENDIMENTO_STATUS.CONCLUIDO) continue;
    if (a.status === ATENDIMENTO_STATUS.CANCELADO) continue;
    if (a.status === ATENDIMENTO_STATUS.EM_ATENDIMENTO) continue;
    if (a.status === ATENDIMENTO_STATUS.CHAMADO) continue;

    if (a.status === ATENDIMENTO_STATUS.CHEGOU || a.status === ATENDIMENTO_STATUS.AGUARDANDO) {
      candidates.push(a);
    }
  }

  candidates.sort(_atdCompareFila_);

  if (!candidates.length) {
    return { item: null, dataRef: dataRef, message: "Fila vazia." };
  }

  // Prefer CHEGOU antes de AGUARDANDO
  candidates.sort(function (x, y) {
    var px = (x.status === ATENDIMENTO_STATUS.CHEGOU) ? 0 : 1;
    var py = (y.status === ATENDIMENTO_STATUS.CHEGOU) ? 0 : 1;
    if (px !== py) return px - py;
    return _atdCompareFila_(x, y);
  });

  var next = candidates[0];
  var patch = {
    status: ATENDIMENTO_STATUS.CHAMADO,
    chamadoEm: next.chamadoEm || nowIso,
    atualizadoEm: nowIso
  };

  Repo_update_(ATENDIMENTO_ENTITY, ATENDIMENTO_ID_FIELD, next.idAtendimento, patch);
  var after = Repo_getById_(ATENDIMENTO_ENTITY, ATENDIMENTO_ID_FIELD, next.idAtendimento);
  return { item: _atdNormalizeRowToDto_(after), dataRef: dataRef };
}

/**
 * Atendimento.Iniciar
 * payload: { idAtendimento?: string, idAgenda?: string, dataRef?: "YYYY-MM-DD" }
 */
function Atendimento_Action_Iniciar_(ctx, payload) {
  payload = payload || {};
  var nowIso = new Date().toISOString();

  var a = _atdResolveTarget_(payload);
  if (!a) _atdThrow_("NOT_FOUND", "Atendimento não encontrado.", { payload: payload });

  var st = _atdNormalizeStatus_(a.status);

  if (st === ATENDIMENTO_STATUS.CANCELADO) {
    _atdThrow_("VALIDATION_ERROR", "Atendimento cancelado não pode iniciar.", { idAtendimento: a.idAtendimento });
  }
  if (st === ATENDIMENTO_STATUS.CONCLUIDO) return { item: a };

  var patch = {
    status: ATENDIMENTO_STATUS.EM_ATENDIMENTO,
    inicioAtendimentoEm: a.inicioAtendimentoEm || nowIso,
    atualizadoEm: nowIso
  };

  Repo_update_(ATENDIMENTO_ENTITY, ATENDIMENTO_ID_FIELD, a.idAtendimento, patch);
  var after = Repo_getById_(ATENDIMENTO_ENTITY, ATENDIMENTO_ID_FIELD, a.idAtendimento);
  return { item: _atdNormalizeRowToDto_(after) };
}

/**
 * Atendimento.Concluir
 * payload: { idAtendimento?: string, idAgenda?: string, dataRef?: "YYYY-MM-DD", observacoes?: string }
 */
function Atendimento_Action_Concluir_(ctx, payload) {
  payload = payload || {};
  var nowIso = new Date().toISOString();

  var a = _atdResolveTarget_(payload);
  if (!a) _atdThrow_("NOT_FOUND", "Atendimento não encontrado.", { payload: payload });

  var st = _atdNormalizeStatus_(a.status);
  if (st === ATENDIMENTO_STATUS.CANCELADO) {
    _atdThrow_("VALIDATION_ERROR", "Atendimento cancelado não pode concluir.", { idAtendimento: a.idAtendimento });
  }

  var patch = {
    status: ATENDIMENTO_STATUS.CONCLUIDO,
    concluidoEm: a.concluidoEm || nowIso,
    atualizadoEm: nowIso
  };

  if (payload.observacoes !== undefined) patch.observacoes = String(payload.observacoes || "");

  Repo_update_(ATENDIMENTO_ENTITY, ATENDIMENTO_ID_FIELD, a.idAtendimento, patch);
  var after = Repo_getById_(ATENDIMENTO_ENTITY, ATENDIMENTO_ID_FIELD, a.idAtendimento);
  return { item: _atdNormalizeRowToDto_(after) };
}

/**
 * Atendimento.Cancelar
 * payload: { idAtendimento?: string, idAgenda?: string, dataRef?: "YYYY-MM-DD", motivo?: string }
 */
function Atendimento_Action_Cancelar_(ctx, payload) {
  payload = payload || {};
  var nowIso = new Date().toISOString();

  var a = _atdResolveTarget_(payload);
  if (!a) _atdThrow_("NOT_FOUND", "Atendimento não encontrado.", { payload: payload });

  var patch = {
    status: ATENDIMENTO_STATUS.CANCELADO,
    atualizadoEm: nowIso
  };

  if (payload.motivo !== undefined) patch.observacoes = String(payload.motivo || "");

  Repo_update_(ATENDIMENTO_ENTITY, ATENDIMENTO_ID_FIELD, a.idAtendimento, patch);
  var after = Repo_getById_(ATENDIMENTO_ENTITY, ATENDIMENTO_ID_FIELD, a.idAtendimento);
  return { item: _atdNormalizeRowToDto_(after) };
}

/* ============================================================
 * Helpers
 * ============================================================ */

function _atdResolveTarget_(payload) {
  payload = payload || {};

  var idAtendimento = payload.idAtendimento ? String(payload.idAtendimento) : "";
  if (idAtendimento) {
    var a1 = Repo_getById_(ATENDIMENTO_ENTITY, ATENDIMENTO_ID_FIELD, idAtendimento);
    return a1 ? _atdNormalizeRowToDto_(a1) : null;
  }

  var idAgenda = payload.idAgenda ? String(payload.idAgenda) : "";
  if (!idAgenda) return null;

  var dataRef = _atdNormalizeDateRef_(payload.dataRef);
  return _atdFindByAgendaAndDate_(idAgenda, dataRef);
}

function _atdFindByAgendaAndDate_(idAgenda, dataRef) {
  var all = Repo_list_(ATENDIMENTO_ENTITY) || [];
  for (var i = 0; i < all.length; i++) {
    var a = _atdNormalizeRowToDto_(all[i]);
    if (!a.ativo) continue;
    if (String(a.idAgenda || "") !== String(idAgenda || "")) continue;
    if (String(a.dataRef || "") !== String(dataRef || "")) continue;
    return a;
  }
  return null;
}

function _atdBuildNew_(payload, overrides) {
  payload = payload || {};
  overrides = overrides || {};

  var nowIso = new Date().toISOString();
  var idAtendimento = Ids_nextId_("ATENDIMENTO");

  var dto = {
    idAtendimento: idAtendimento,
    idAgenda: overrides.idAgenda || (payload.idAgenda ? String(payload.idAgenda) : ""),
    idPaciente: overrides.idPaciente || (payload.idPaciente ? String(payload.idPaciente) : ""),
    dataRef: overrides.dataRef || _atdNormalizeDateRef_(payload.dataRef),
    status: overrides.status || ATENDIMENTO_STATUS.AGUARDANDO,
    ordem: (overrides.ordem !== undefined) ? _atdNormalizeNumberOrBlank_(overrides.ordem) : _atdNormalizeNumberOrBlank_(payload.ordem),

    chegadaEm: overrides.chegadaEm || "",
    chamadoEm: overrides.chamadoEm || "",
    inicioAtendimentoEm: overrides.inicioAtendimentoEm || "",
    concluidoEm: overrides.concluidoEm || "",

    sala: (overrides.sala !== undefined) ? String(overrides.sala || "") : (payload.sala ? String(payload.sala) : ""),
    observacoes: (overrides.observacoes !== undefined) ? String(overrides.observacoes || "") : (payload.observacoes ? String(payload.observacoes) : ""),

    criadoEm: nowIso,
    atualizadoEm: nowIso,
    ativo: true
  };

  dto.status = _atdNormalizeStatus_(dto.status);
  return dto;
}

function _atdNormalizeRowToDto_(rowObj) {
  rowObj = rowObj || {};

  return {
    idAtendimento: rowObj.idAtendimento || rowObj.ID_Atendimento || "",
    idAgenda: rowObj.idAgenda || rowObj.ID_Agenda || "",
    idPaciente: rowObj.idPaciente || rowObj.ID_Paciente || "",
    dataRef: String(rowObj.dataRef || ""),
    status: rowObj.status || ATENDIMENTO_STATUS.AGUARDANDO,
    ordem: _atdParseNumber_(rowObj.ordem),

    chegadaEm: rowObj.chegadaEm || "",
    chamadoEm: rowObj.chamadoEm || "",
    inicioAtendimentoEm: rowObj.inicioAtendimentoEm || "",
    concluidoEm: rowObj.concluidoEm || "",

    sala: rowObj.sala || "",
    observacoes: rowObj.observacoes || "",

    criadoEm: rowObj.criadoEm || "",
    atualizadoEm: rowObj.atualizadoEm || "",
    ativo: (rowObj.ativo === undefined ? true : rowObj.ativo === true || String(rowObj.ativo).toUpperCase() === "TRUE")
  };
}

function _atdNormalizeStatus_(status) {
  var s = String(status || "").trim().toUpperCase();
  if (!s) return ATENDIMENTO_STATUS.AGUARDANDO;

  if (s === "EM ATENDIMENTO" || s === "EM-ATENDIMENTO") s = "EM_ATENDIMENTO";

  if (s.indexOf("CONCLU") >= 0) return ATENDIMENTO_STATUS.CONCLUIDO;
  if (s.indexOf("CANCEL") >= 0) return ATENDIMENTO_STATUS.CANCELADO;
  if (s.indexOf("ATEND") >= 0 && s.indexOf("EM") >= 0) return ATENDIMENTO_STATUS.EM_ATENDIMENTO;
  if (s.indexOf("CHAM") >= 0) return ATENDIMENTO_STATUS.CHAMADO;
  if (s.indexOf("CHEG") >= 0) return ATENDIMENTO_STATUS.CHEGOU;
  if (s.indexOf("AGUAR") >= 0) return ATENDIMENTO_STATUS.AGUARDANDO;

  if (s === ATENDIMENTO_STATUS.AGUARDANDO) return s;
  if (s === ATENDIMENTO_STATUS.CHEGOU) return s;
  if (s === ATENDIMENTO_STATUS.CHAMADO) return s;
  if (s === ATENDIMENTO_STATUS.EM_ATENDIMENTO) return s;
  if (s === ATENDIMENTO_STATUS.CONCLUIDO) return s;
  if (s === ATENDIMENTO_STATUS.CANCELADO) return s;

  return ATENDIMENTO_STATUS.AGUARDANDO;
}

function _atdNormalizeDateRef_(dateRef) {
  var d = null;

  if (dateRef instanceof Date) d = dateRef;
  else if (typeof dateRef === "number") d = new Date(dateRef);
  else if (typeof dateRef === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateRef)) {
    var parts = dateRef.split("-");
    d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0);
  } else {
    d = new Date();
  }

  if (isNaN(d.getTime())) d = new Date();

  var y = d.getFullYear();
  var m = ("0" + (d.getMonth() + 1)).slice(-2);
  var dd = ("0" + d.getDate()).slice(-2);
  return y + "-" + m + "-" + dd;
}

function _atdCompareFila_(x, y) {
  var ox = (typeof x.ordem === "number") ? x.ordem : 999999;
  var oy = (typeof y.ordem === "number") ? y.ordem : 999999;
  if (ox !== oy) return ox - oy;

  var tx = _atdSortTime_(x.chegadaEm) || _atdSortTime_(x.criadoEm) || 0;
  var ty = _atdSortTime_(y.chegadaEm) || _atdSortTime_(y.criadoEm) || 0;
  return tx - ty;
}

function _atdSortTime_(iso) {
  if (!iso) return 0;
  try {
    var d = new Date(String(iso));
    return isNaN(d.getTime()) ? 0 : d.getTime();
  } catch (_) {
    return 0;
  }
}

function _atdParseNumber_(v) {
  if (v === undefined || v === null || v === "") return null;
  var n = Number(v);
  return isNaN(n) ? null : n;
}

function _atdNormalizeNumberOrBlank_(v) {
  if (v === undefined || v === null || v === "") return "";
  var n = Number(v);
  return isNaN(n) ? "" : n;
}

function _atdThrow_(code, message, details) {
  var err = new Error(String(message || "Erro."));
  err.code = String(code || "INTERNAL_ERROR");
  err.details = (details === undefined ? null : details);
  throw err;
}

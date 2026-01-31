// backend/domain/Agenda/Agenda.Normalize.gs
// ============================================================
// PRONTIO — Agenda Normalize (Back)
// ============================================================
// ✅ Padrão ideal (2026-01):
// - Entidade canônica: AgendaEventos
// - DTO camelCase
// - Agenda NÃO faz join com Pacientes (sem nomeCompleto)
// - CreateInput aceita:
//   - inicioDateTime/fimDateTime (ISO/Date) OU
//   - data (YYYY-MM-DD) + horaInicio (HH:MM) + duracaoMin (number)
// - UpdatePatch aceita patch camelCase e (compat) top-level legado,
//   mas converte para core (inicioDateTime/fimDateTime ISO)
// ============================================================

function _agendaNormalizeStatus_(status) {
  var s = String(status || "").trim().toUpperCase();
  if (!s) return AGENDA_STATUS.MARCADO;

  // legados
  if (s === "AGENDADO") return AGENDA_STATUS.MARCADO;
  if (s === "CHEGOU") return AGENDA_STATUS.AGUARDANDO;
  if (s === "CHAMADO") return AGENDA_STATUS.AGUARDANDO;
  if (s === "CONCLUIDO") return AGENDA_STATUS.ATENDIDO;

  if (s === "EM ATENDIMENTO" || s === "EM-ATENDIMENTO") s = "EM_ATENDIMENTO";

  if (s.indexOf("REMARC") >= 0) return AGENDA_STATUS.REMARCADO;
  if (s.indexOf("CANCEL") >= 0) return AGENDA_STATUS.CANCELADO;
  if (s.indexOf("FALT") >= 0) return AGENDA_STATUS.FALTOU;

  if (s.indexOf("ATENDID") >= 0) return AGENDA_STATUS.ATENDIDO;
  if (s.indexOf("EM_ATEND") >= 0) return AGENDA_STATUS.EM_ATENDIMENTO;

  if (s.indexOf("AGUARD") >= 0) return AGENDA_STATUS.AGUARDANDO;
  if (s.indexOf("CONFIRM") >= 0) return AGENDA_STATUS.CONFIRMADO;
  if (s.indexOf("MARC") >= 0) return AGENDA_STATUS.MARCADO;

  return AGENDA_STATUS.MARCADO;
}

function _agendaNormalizeTipo_(tipo) {
  var t = String(tipo || "").trim().toUpperCase();
  if (!t) return AGENDA_TIPO.CONSULTA;

  if (t.indexOf("BLOQ") >= 0) return AGENDA_TIPO.BLOQUEIO;
  if (t.indexOf("RET") >= 0) return AGENDA_TIPO.RETORNO;
  if (t.indexOf("PROC") >= 0) return AGENDA_TIPO.PROCEDIMENTO;
  if (t.indexOf("CONS") >= 0) return AGENDA_TIPO.CONSULTA;

  if (
    t === AGENDA_TIPO.CONSULTA ||
    t === AGENDA_TIPO.RETORNO ||
    t === AGENDA_TIPO.PROCEDIMENTO ||
    t === AGENDA_TIPO.BLOQUEIO ||
    t === AGENDA_TIPO.OUTRO
  ) return t;

  return AGENDA_TIPO.OUTRO;
}

function _agendaNormalizeOrigem_(origem) {
  var o = String(origem || "").trim().toUpperCase();
  if (!o) return AGENDA_ORIGEM.RECEPCAO;
  if (o.indexOf("RECEP") >= 0) return AGENDA_ORIGEM.RECEPCAO;
  if (o.indexOf("MED") >= 0) return AGENDA_ORIGEM.MEDICO;
  if (o.indexOf("SIS") >= 0) return AGENDA_ORIGEM.SISTEMA;
  if (o === AGENDA_ORIGEM.RECEPCAO || o === AGENDA_ORIGEM.MEDICO || o === AGENDA_ORIGEM.SISTEMA) return o;
  return AGENDA_ORIGEM.RECEPCAO;
}

/**
 * Normaliza row (Repo) -> DTO canônico (AgendaEventos).
 * ✅ Lê campos novos e (compat) campos legados.
 */
function _agendaNormalizeRowToDto_(rowObj) {
  rowObj = rowObj || {};

  // IDs
  var idEvento = rowObj.idEvento || rowObj.ID_Evento || rowObj.ID_EVENTO || "";
  // compat legado
  if (!idEvento) idEvento = rowObj.idAgenda || rowObj.ID_Agenda || "";

  // Datas: novo
  var ini = rowObj.inicioDateTime || rowObj.inicio_datetime || "";
  var fim = rowObj.fimDateTime || rowObj.fim_datetime || "";

  // compat legado
  if (!ini) ini = rowObj.inicio || "";
  if (!fim) fim = rowObj.fim || "";

  return {
    idEvento: idEvento,

    idProfissional: rowObj.idProfissional || rowObj.ID_Profissional || rowObj.ID_PROFISSIONAL || "",
    idClinica: rowObj.idClinica || rowObj.ID_Clinica || rowObj.ID_CLINICA || "",
    idPaciente: rowObj.idPaciente || rowObj.ID_Paciente || "",

    inicioDateTime: ini,
    fimDateTime: fim,

    titulo: rowObj.titulo || "",
    notas: rowObj.notas || "",

    tipo: rowObj.tipo || AGENDA_TIPO.CONSULTA,
    status: rowObj.status || AGENDA_STATUS.MARCADO,
    origem: rowObj.origem || AGENDA_ORIGEM.RECEPCAO,

    permiteEncaixe: (rowObj.permiteEncaixe === true) || (rowObj.permite_encaixe === true) || (rowObj.permitirEncaixe === true),

    canceladoEm: rowObj.canceladoEm || "",
    canceladoMotivo: rowObj.canceladoMotivo || "",

    criadoEm: rowObj.criadoEm || "",
    atualizadoEm: rowObj.atualizadoEm || "",

    // novo modelo tem ativo
    ativo: (rowObj.ativo === undefined || rowObj.ativo === null) ? true : (rowObj.ativo === true)
  };
}

/**
 * NormalizeCreateInput (payload front) -> { inicioDateTime:Date, fimDateTime:Date, ... }
 * ✅ aceita:
 * - inicioDateTime/fimDateTime (ISO/Date)
 * - ou data + horaInicio + duracaoMin
 */
function _agendaNormalizeCreateInput_(payload, params) {
  params = params || {};
  payload = payload || {};

  var idPaciente = payload.idPaciente ? String(payload.idPaciente) : (payload.ID_Paciente ? String(payload.ID_Paciente) : "");

  var titulo = payload.titulo || payload.motivo || "";
  var notas = payload.notas || "";
  var tipo = payload.tipo ? String(payload.tipo) : (payload.Bloqueio === true ? AGENDA_TIPO.BLOQUEIO : AGENDA_TIPO.CONSULTA);
  var origem = payload.origem ? String(payload.origem) : AGENDA_ORIGEM.RECEPCAO;

  var status = payload.status ? String(payload.status) : AGENDA_STATUS.MARCADO;
  status = _agendaNormalizeStatus_(status);

  var permiteEncaixe = payload.permiteEncaixe === true || payload.permitirEncaixe === true || payload.permite_encaixe === true;

  // 1) Forma canônica: inicioDateTime/fimDateTime
  var pIni = payload.inicioDateTime || payload.inicio;
  var pFim = payload.fimDateTime || payload.fim;

  if (pIni && pFim) {
    var ini = _agendaParseDateRequired_(pIni, "inicioDateTime");
    var fim = _agendaParseDateRequired_(pFim, "fimDateTime");
    return {
      idPaciente: idPaciente,
      inicioDateTime: ini,
      fimDateTime: fim,
      titulo: String(titulo || ""),
      notas: String(notas || ""),
      tipo: _agendaNormalizeTipo_(tipo),
      status: status,
      origem: _agendaNormalizeOrigem_(origem),
      permiteEncaixe: (permiteEncaixe === true)
    };
  }

  // 2) Forma recomendada no front: data + horaInicio + duracaoMin
  var dataStr = payload.data ? String(payload.data) : null;

  var horaInicio =
    (payload.horaInicio !== undefined) ? String(payload.horaInicio) :
    (payload.hora_inicio !== undefined ? String(payload.hora_inicio) : null);

  if (!dataStr) _agendaThrow_("VALIDATION_ERROR", 'Campo "data" é obrigatório.', { field: "data" });
  if (!horaInicio) _agendaThrow_("VALIDATION_ERROR", 'Campo "horaInicio" é obrigatório.', { field: "horaInicio" });

  var duracao;
  if (payload.duracaoMin !== undefined) duracao = Number(payload.duracaoMin);
  else if (payload.duracao_minutos !== undefined) duracao = Number(payload.duracao_minutos);
  else duracao = Number(params.duracaoPadraoMin || 30);

  if (isNaN(duracao) || duracao <= 0) duracao = Number(params.duracaoPadraoMin || 30);

  var ini2 = _agendaBuildDateTime_(dataStr, horaInicio);
  var fim2 = new Date(ini2.getTime() + duracao * 60000);

  return {
    idPaciente: idPaciente,
    inicioDateTime: ini2,
    fimDateTime: fim2,
    titulo: String(titulo || ""),
    notas: String(notas || ""),
    tipo: _agendaNormalizeTipo_(tipo),
    status: status,
    origem: _agendaNormalizeOrigem_(origem),
    permiteEncaixe: (permiteEncaixe === true)
  };
}

/**
 * BuildUpdatePatch:
 * - out usa campos de AgendaEventos (inicioDateTime/fimDateTime)
 * - aceita patch camelCase e compat top-level (data/horaInicio/duracaoMin)
 */
function _agendaBuildUpdatePatch_(existing, patch, topCompat, params) {
  patch = patch || {};
  topCompat = topCompat || {};
  params = params || {};

  // existing pode vir legado; normalize
  existing = _agendaNormalizeRowToDto_(existing || {});

  var out = {};

  // campos permitidos (patch)
  var fields = ["idPaciente", "titulo", "notas", "tipo", "status", "origem", "canceladoMotivo", "permiteEncaixe", "ativo"];
  for (var i = 0; i < fields.length; i++) {
    var f = fields[i];
    if (patch[f] !== undefined) out[f] = patch[f];
  }

  // compat: ID_Paciente top-level
  if (topCompat.ID_Paciente !== undefined) out.idPaciente = topCompat.ID_Paciente;

  if (out.tipo !== undefined) out.tipo = _agendaNormalizeTipo_(out.tipo);
  if (out.status !== undefined) out.status = _agendaNormalizeStatus_(out.status);
  if (out.origem !== undefined) out.origem = _agendaNormalizeOrigem_(out.origem);

  if (out.permiteEncaixe !== undefined) out.permiteEncaixe = (out.permiteEncaixe === true);

  // 1) Update por datas diretas (canônico)
  var hasNewDates =
    (patch.inicioDateTime !== undefined) || (patch.fimDateTime !== undefined) ||
    (patch.inicio !== undefined) || (patch.fim !== undefined);

  if (hasNewDates) {
    var pIni = (patch.inicioDateTime !== undefined) ? patch.inicioDateTime : patch.inicio;
    var pFim = (patch.fimDateTime !== undefined) ? patch.fimDateTime : patch.fim;

    if (pIni !== undefined) out.inicioDateTime = _agendaParseDateRequired_(pIni, "inicioDateTime").toISOString();
    if (pFim !== undefined) out.fimDateTime = _agendaParseDateRequired_(pFim, "fimDateTime").toISOString();
    return out;
  }

  // 2) Compat/top-level: data + horaInicio + duracaoMin
  var dataStr = (topCompat.data !== undefined) ? String(topCompat.data) : null;

  var horaInicio =
    (topCompat.horaInicio !== undefined) ? String(topCompat.horaInicio) :
    ((topCompat.hora_inicio !== undefined) ? String(topCompat.hora_inicio) : null);

  var duracao =
    (topCompat.duracaoMin !== undefined) ? Number(topCompat.duracaoMin) :
    ((topCompat.duracao_minutos !== undefined) ? Number(topCompat.duracao_minutos) : null);

  // também aceita no patch (por segurança)
  if (dataStr === null && patch.data !== undefined) dataStr = String(patch.data);
  if (horaInicio === null && patch.horaInicio !== undefined) horaInicio = String(patch.horaInicio);
  if (duracao === null && patch.duracaoMin !== undefined) duracao = Number(patch.duracaoMin);

  if (dataStr || horaInicio || duracao !== null) {
    var exIni = _agendaParseDate_(existing.inicioDateTime);
    var exFim = _agendaParseDate_(existing.fimDateTime);

    var baseData = dataStr || (exIni ? _agendaFormatDate_(exIni) : null);
    var baseHora = horaInicio || (exIni ? _agendaFormatHHMM_(exIni) : null);

    if (!baseData || !baseHora) _agendaThrow_("VALIDATION_ERROR", "Não foi possível determinar data/hora para atualização.", {});

    var durMin;
    if (duracao !== null && !isNaN(duracao) && duracao > 0) durMin = duracao;
    else {
      if (exIni && exFim) durMin = Math.max(1, Math.round((exFim.getTime() - exIni.getTime()) / 60000));
      else durMin = Number(params.duracaoPadraoMin || 30);
    }

    var ini = _agendaBuildDateTime_(baseData, baseHora);
    var fim = new Date(ini.getTime() + durMin * 60000);

    out.inicioDateTime = ini.toISOString();
    out.fimDateTime = fim.toISOString();
  }

  return out;
}

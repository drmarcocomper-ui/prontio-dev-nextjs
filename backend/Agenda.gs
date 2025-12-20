/**
 * ============================================================
 * PRONTIO - Agenda.gs (MÓDULO NOVO - compatível com arquitetura API-first)
 * ============================================================
 * IMPORTANTE:
 * - NÃO usa SpreadsheetApp diretamente (Sheets só via Repository).
 * - NÃO usa colunas/abas no front.
 * - NÃO lança "throw { }" (causa logs [object Object] e pode travar o editor).
 * - IDs são gerados no backend via Ids.gs
 * - Locks: aplicados no Api.gs via Registry.requiresLock (este módulo NÃO trava aqui)
 *
 * Actions (para registrar no Registry.gs):
 * - Agenda.ListarPorPeriodo
 * - Agenda.Criar
 * - Agenda.Atualizar
 * - Agenda.Cancelar
 *
 * DTO interno (alinhado ao Schema.gs + Migrations.gs v1):
 * Agenda:
 *  idAgenda, idPaciente?, inicio, fim, titulo?, notas?, tipo?, status, origem?, criadoEm, atualizadoEm,
 *  canceladoEm?, canceladoMotivo?
 */

// Nome interno da entidade/aba (backend-only)
var AGENDA_ENTITY = "Agenda";
var AGENDA_ID_FIELD = "idAgenda";

// Status permitidos (alinhado ao Schema)
var AGENDA_STATUS = {
  AGENDADO: "AGENDADO",
  CANCELADO: "CANCELADO",
  CONCLUIDO: "CONCLUIDO",
  FALTOU: "FALTOU"
};

var AGENDA_TIPO = {
  CONSULTA: "CONSULTA",
  RETORNO: "RETORNO",
  PROCEDIMENTO: "PROCEDIMENTO",
  BLOQUEIO: "BLOQUEIO",
  OUTRO: "OUTRO"
};

var AGENDA_ORIGEM = {
  RECEPCAO: "RECEPCAO",
  MEDICO: "MEDICO",
  SISTEMA: "SISTEMA"
};

/**
 * ============================================================
 * Handlers (para Registry)
 * ============================================================
 */

/**
 * Agenda.ListarPorPeriodo
 * payload:
 * {
 *   inicio: "2025-12-01T00:00:00-03:00" | Date | number,
 *   fim:    "2025-12-31T23:59:59-03:00" | Date | number,
 *   incluirCancelados?: boolean,
 *   idPaciente?: string
 * }
 */
function Agenda_Action_ListarPorPeriodo_(ctx, payload) {
  payload = payload || {};

  var ini = _agendaParseDateRequired_(payload.inicio, "inicio");
  var fim = _agendaParseDateRequired_(payload.fim, "fim");

  if (fim.getTime() < ini.getTime()) {
    _agendaThrow_("VALIDATION_ERROR", '"fim" não pode ser menor que "inicio".', { inicio: ini, fim: fim });
  }

  var incluirCancelados = payload.incluirCancelados === true;
  var idPaciente = payload.idPaciente ? String(payload.idPaciente) : null;

  // Lê tudo e filtra (otimização futura: índices/cache)
  var all = Repo_list_(AGENDA_ENTITY);

  var out = [];
  for (var i = 0; i < all.length; i++) {
    var e = _agendaNormalizeRowToDto_(all[i]);

    e.tipo = _agendaNormalizeTipo_(e.tipo);
    e.status = _agendaNormalizeStatus_(e.status);
    e.origem = _agendaNormalizeOrigem_(e.origem);

    if (!incluirCancelados && e.status === AGENDA_STATUS.CANCELADO) continue;
    if (idPaciente && String(e.idPaciente || "") !== idPaciente) continue;

    var evIni = _agendaParseDate_(e.inicio);
    var evFim = _agendaParseDate_(e.fim);
    if (!evIni || !evFim) continue;

    // overlap com [ini, fim]
    var overlaps = (evIni.getTime() <= fim.getTime()) && (evFim.getTime() >= ini.getTime());
    if (!overlaps) continue;

    out.push(e);
  }

  // Ordena por início
  out.sort(function (a, b) {
    var da = _agendaParseDate_(a.inicio);
    var db = _agendaParseDate_(b.inicio);
    var ta = da ? da.getTime() : 0;
    var tb = db ? db.getTime() : 0;
    return ta - tb;
  });

  return {
    items: out,
    count: out.length
  };
}

/**
 * Agenda.Criar
 * payload suportado:
 * A) padrão novo:
 * { idPaciente?, inicio, fim, titulo?, notas?, tipo?, status?, origem?, permitirEncaixe? }
 * B) compatível com legado:
 * { idPaciente?, data:"YYYY-MM-DD", hora_inicio:"HH:MM", duracao_minutos:number, ... }
 */
function Agenda_Action_Criar_(ctx, payload) {
  payload = payload || {};

  var params = (typeof Config_getAgendaParams_ === "function") ? Config_getAgendaParams_() : {
    duracaoPadraoMin: 30,
    slotMin: 10,
    permiteSobreposicao: false
  };

  // Normaliza entrada (novo ou legado)
  var norm = _agendaNormalizeCreateInput_(payload, params);

  // Regras adicionais: BLOQUEIO não deve amarrar paciente
  if (norm.tipo === AGENDA_TIPO.BLOQUEIO) {
    norm.idPaciente = "";
    norm.status = AGENDA_STATUS.AGENDADO; // Bloqueio é um "evento" marcado
  }

  // Valida conflitos conforme política
  _agendaAssertSemConflitos_(ctx, {
    inicio: norm.inicio,
    fim: norm.fim,
    permitirEncaixe: norm.permitirEncaixe === true,
    modoBloqueio: norm.tipo === AGENDA_TIPO.BLOQUEIO,
    ignoreIdAgenda: null
  }, params);

  // Gera ID estável
  var idAgenda = Ids_nextId_("AGENDA");
  var now = new Date();

  var dto = {
    idAgenda: idAgenda,
    idPaciente: norm.idPaciente || "",
    inicio: norm.inicio.toISOString(),
    fim: norm.fim.toISOString(),
    titulo: norm.titulo || "",
    notas: norm.notas || "",
    tipo: norm.tipo || AGENDA_TIPO.CONSULTA,
    status: norm.status || AGENDA_STATUS.AGENDADO,
    origem: norm.origem || AGENDA_ORIGEM.RECEPCAO,
    criadoEm: now.toISOString(),
    atualizadoEm: now.toISOString(),
    canceladoEm: "",
    canceladoMotivo: ""
  };

  // IMPORTANTE: lock já é aplicado no Api.gs via Registry.requiresLock
  Repo_insert_(AGENDA_ENTITY, dto);
  return { item: dto };
}

/**
 * Agenda.Atualizar
 * payload:
 * {
 *   idAgenda: string (obrigatório)
 *   patch: { ...campos permitidos... }
 *   // compatibilidade: também aceita campos no topo (data/hora_inicio/duracao_minutos etc.)
 *   permitirEncaixe?: boolean
 * }
 */
function Agenda_Action_Atualizar_(ctx, payload) {
  payload = payload || {};

  var idAgenda = payload.idAgenda ? String(payload.idAgenda) : "";
  if (!idAgenda) _agendaThrow_("VALIDATION_ERROR", '"idAgenda" é obrigatório.', { field: "idAgenda" });

  var existing = Repo_getById_(AGENDA_ENTITY, AGENDA_ID_FIELD, idAgenda);
  if (!existing) _agendaThrow_("NOT_FOUND", "Agendamento não encontrado.", { idAgenda: idAgenda });

  // Normaliza existing para reduzir inconsistências vindas do repositório
  existing = _agendaNormalizeRowToDto_(existing);
  existing.tipo = _agendaNormalizeTipo_(existing.tipo);
  existing.status = _agendaNormalizeStatus_(existing.status);
  existing.origem = _agendaNormalizeOrigem_(existing.origem);

  var params = (typeof Config_getAgendaParams_ === "function") ? Config_getAgendaParams_() : {
    duracaoPadraoMin: 30,
    slotMin: 10,
    permiteSobreposicao: false
  };

  // Patch pode vir em payload.patch ou no topo (compat)
  var patchIn = (payload.patch && typeof payload.patch === "object") ? payload.patch : {};
  var topCompat = payload;

  var mergedPatch = _agendaBuildUpdatePatch_(existing, patchIn, topCompat, params);

  // Regra: cancelar deve ser via Agenda.Cancelar (evita status CANCELADO sem canceladoEm/motivo)
  if (mergedPatch.status !== undefined) {
    var s = _agendaNormalizeStatus_(mergedPatch.status);
    if (s === AGENDA_STATUS.CANCELADO) {
      _agendaThrow_("VALIDATION_ERROR", 'Use "Agenda.Cancelar" para cancelar um agendamento.', { idAgenda: idAgenda });
    }
    mergedPatch.status = s;
  }

  // Se já está cancelado, restringe atualizações (mantém histórico)
  var isCancelado = (String(existing.status || "") === AGENDA_STATUS.CANCELADO);
  if (isCancelado) {
    // Permite apenas ajustes de anotação/motivo — sem mexer em datas/status/tipo/paciente
    var blocked = ["inicio", "fim", "tipo", "status", "idPaciente"];
    for (var k = 0; k < blocked.length; k++) {
      if (mergedPatch[blocked[k]] !== undefined) {
        _agendaThrow_("VALIDATION_ERROR", "Agendamento cancelado não pode ter data/tipo/status/paciente alterados.", {
          idAgenda: idAgenda,
          field: blocked[k]
        });
      }
    }
  }

  // Se atualizar datas, validar conflitos
  var newInicio = mergedPatch.inicio ? _agendaParseDate_(mergedPatch.inicio) : _agendaParseDate_(existing.inicio);
  var newFim = mergedPatch.fim ? _agendaParseDate_(mergedPatch.fim) : _agendaParseDate_(existing.fim);

  if (!newInicio || !newFim) _agendaThrow_("VALIDATION_ERROR", "Datas inválidas em atualização.", { idAgenda: idAgenda });
  if (newFim.getTime() < newInicio.getTime()) _agendaThrow_("VALIDATION_ERROR", '"fim" não pode ser menor que "inicio".', {});

  var tipoFinal = mergedPatch.tipo ? String(_agendaNormalizeTipo_(mergedPatch.tipo)) : String(existing.tipo || AGENDA_TIPO.CONSULTA);
  mergedPatch.tipo = (mergedPatch.tipo !== undefined) ? _agendaNormalizeTipo_(mergedPatch.tipo) : undefined;

  // Regra adicional: se for BLOQUEIO, sempre zera paciente
  if (tipoFinal === AGENDA_TIPO.BLOQUEIO) {
    mergedPatch.idPaciente = "";
  }

  var permitirEncaixe = (typeof payload.permitirEncaixe !== "undefined") ? (payload.permitirEncaixe === true) : false;

  _agendaAssertSemConflitos_(ctx, {
    inicio: newInicio,
    fim: newFim,
    permitirEncaixe: permitirEncaixe,
    modoBloqueio: (tipoFinal === AGENDA_TIPO.BLOQUEIO),
    ignoreIdAgenda: idAgenda
  }, params);

  // Atualiza timestamps
  mergedPatch.atualizadoEm = new Date().toISOString();

  // IMPORTANTE: lock já é aplicado no Api.gs via Registry.requiresLock
  var ok = Repo_update_(AGENDA_ENTITY, AGENDA_ID_FIELD, idAgenda, mergedPatch);
  if (!ok) _agendaThrow_("NOT_FOUND", "Agendamento não encontrado para atualizar.", { idAgenda: idAgenda });

  var after = Repo_getById_(AGENDA_ENTITY, AGENDA_ID_FIELD, idAgenda);
  return { item: _agendaNormalizeRowToDto_(after) };
}

/**
 * Agenda.Cancelar
 * payload:
 * { idAgenda: string (obrigatório), motivo?: string }
 */
function Agenda_Action_Cancelar_(ctx, payload) {
  payload = payload || {};
  var idAgenda = payload.idAgenda ? String(payload.idAgenda) : "";
  if (!idAgenda) _agendaThrow_("VALIDATION_ERROR", '"idAgenda" é obrigatório.', { field: "idAgenda" });

  var existing = Repo_getById_(AGENDA_ENTITY, AGENDA_ID_FIELD, idAgenda);
  if (!existing) _agendaThrow_("NOT_FOUND", "Agendamento não encontrado.", { idAgenda: idAgenda });

  // Se já está cancelado, idempotência simples
  existing = _agendaNormalizeRowToDto_(existing);
  existing.status = _agendaNormalizeStatus_(existing.status);
  if (existing.status === AGENDA_STATUS.CANCELADO) {
    return { item: existing };
  }

  var nowIso = new Date().toISOString();
  var patch = {
    status: AGENDA_STATUS.CANCELADO,
    canceladoEm: nowIso,
    canceladoMotivo: payload.motivo ? String(payload.motivo).slice(0, 500) : "",
    atualizadoEm: nowIso
  };

  // IMPORTANTE: lock já é aplicado no Api.gs via Registry.requiresLock
  var ok = Repo_update_(AGENDA_ENTITY, AGENDA_ID_FIELD, idAgenda, patch);
  if (!ok) _agendaThrow_("NOT_FOUND", "Agendamento não encontrado para cancelar.", { idAgenda: idAgenda });

  var after = Repo_getById_(AGENDA_ENTITY, AGENDA_ID_FIELD, idAgenda);
  return { item: _agendaNormalizeRowToDto_(after) };
}

/**
 * ============================================================
 * Regras de negócio: conflito / normalização
 * ============================================================
 */

/**
 * Política de conflitos:
 * - Se permiteSobreposicao (Config) for true, aceita sobreposição (exceto bloqueio).
 * - Bloqueio (tipo=BLOQUEIO) nunca pode sobrepor ninguém.
 * - Se permitirEncaixe (payload) for true, permite sobrepor consultas (mas nunca bloqueio).
 * - Eventos CANCELADO não contam para conflito de consulta.
 */
function _agendaAssertSemConflitos_(ctx, args, params) {
  params = params || {};
  args = args || {};

  var inicio = args.inicio;
  var fim = args.fim;

  if (!(inicio instanceof Date) || isNaN(inicio.getTime())) _agendaThrow_("VALIDATION_ERROR", "inicio inválido.", {});
  if (!(fim instanceof Date) || isNaN(fim.getTime())) _agendaThrow_("VALIDATION_ERROR", "fim inválido.", {});

  var ignoreId = args.ignoreIdAgenda ? String(args.ignoreIdAgenda) : null;

  // Se for bloqueio, sempre valida (nunca permite sobreposição)
  var isBloqueioNovo = args.modoBloqueio === true;

  // Se config permite sobreposição, ainda assim não permite sobrepor bloqueio, e bloqueio não sobrepõe nada
  var cfgPermiteSobreposicao = params.permiteSobreposicao === true;
  var permitirEncaixe = args.permitirEncaixe === true;

  var all = Repo_list_(AGENDA_ENTITY);

  for (var i = 0; i < all.length; i++) {
    var e = _agendaNormalizeRowToDto_(all[i]);

    if (ignoreId && String(e.idAgenda || "") === ignoreId) continue;

    var evIni = _agendaParseDate_(e.inicio);
    var evFim = _agendaParseDate_(e.fim);
    if (!evIni || !evFim) continue;

    // overlap?
    var overlaps = (inicio.getTime() < evFim.getTime()) && (fim.getTime() > evIni.getTime());
    if (!overlaps) continue;

    var evTipo = _agendaNormalizeTipo_(e.tipo || AGENDA_TIPO.CONSULTA);
    var evStatus = _agendaNormalizeStatus_(e.status || AGENDA_STATUS.AGENDADO);

    var evIsBloqueio = (evTipo === AGENDA_TIPO.BLOQUEIO);

    // 1) Se existe bloqueio existente no intervalo, sempre bloqueia
    if (evIsBloqueio) {
      _agendaThrow_("CONFLICT", "Horário bloqueado no intervalo.", {
        conflito: { idAgenda: e.idAgenda, inicio: e.inicio, fim: e.fim, tipo: e.tipo, status: e.status }
      });
    }

    // 2) Se o novo é bloqueio, ele não pode sobrepor nada
    if (isBloqueioNovo) {
      _agendaThrow_("CONFLICT", "Não é possível bloquear: existe agendamento no intervalo.", {
        conflito: { idAgenda: e.idAgenda, inicio: e.inicio, fim: e.fim, tipo: e.tipo, status: e.status }
      });
    }

    // 3) Se evento existente está cancelado, ignora (para conflito de consulta)
    if (evStatus === AGENDA_STATUS.CANCELADO) continue;

    // 4) Se config permite sobreposição, não bloqueia consultas
    if (cfgPermiteSobreposicao) continue;

    // 5) Se permitir encaixe, não bloqueia consultas
    if (permitirEncaixe) continue;

    // Caso padrão: conflito
    _agendaThrow_("CONFLICT", "Já existe agendamento no intervalo.", {
      conflito: { idAgenda: e.idAgenda, inicio: e.inicio, fim: e.fim, tipo: e.tipo, status: e.status }
    });
  }

  return true;
}

/**
 * Normaliza o payload de criação (novo ou legado) para:
 * { idPaciente, inicio:Date, fim:Date, titulo, notas, tipo, status, origem, permitirEncaixe }
 */
function _agendaNormalizeCreateInput_(payload, params) {
  params = params || {};
  payload = payload || {};

  var idPaciente = payload.idPaciente ? String(payload.idPaciente) : (payload.ID_Paciente ? String(payload.ID_Paciente) : "");
  var titulo = payload.titulo || payload.motivo || "";
  var notas = payload.notas || "";
  var tipo = payload.tipo ? String(payload.tipo) : (payload.Bloqueio === true ? AGENDA_TIPO.BLOQUEIO : AGENDA_TIPO.CONSULTA);
  var origem = payload.origem ? String(payload.origem) : AGENDA_ORIGEM.RECEPCAO;

  var status = payload.status ? String(payload.status) : AGENDA_STATUS.AGENDADO;
  status = _agendaNormalizeStatus_(status);

  var permitirEncaixe = payload.permitirEncaixe === true || payload.permite_encaixe === true;

  // Novo formato: inicio/fim
  if (payload.inicio && payload.fim) {
    var ini = _agendaParseDateRequired_(payload.inicio, "inicio");
    var fim = _agendaParseDateRequired_(payload.fim, "fim");
    return {
      idPaciente: idPaciente,
      inicio: ini,
      fim: fim,
      titulo: String(titulo || ""),
      notas: String(notas || ""),
      tipo: _agendaNormalizeTipo_(tipo),
      status: status,
      origem: _agendaNormalizeOrigem_(origem),
      permitirEncaixe: permitirEncaixe
    };
  }

  // Legado: data + hora_inicio + duracao_minutos
  var dataStr = payload.data ? String(payload.data) : null;
  var horaInicio = payload.hora_inicio ? String(payload.hora_inicio) : null;
  if (!dataStr) _agendaThrow_("VALIDATION_ERROR", 'Campo "data" é obrigatório (legado).', { field: "data" });
  if (!horaInicio) _agendaThrow_("VALIDATION_ERROR", 'Campo "hora_inicio" é obrigatório (legado).', { field: "hora_inicio" });

  var duracao = payload.duracao_minutos ? Number(payload.duracao_minutos) : Number(params.duracaoPadraoMin || 30);
  if (isNaN(duracao) || duracao <= 0) duracao = Number(params.duracaoPadraoMin || 30);

  var ini2 = _agendaBuildDateTime_(dataStr, horaInicio);
  var fim2 = new Date(ini2.getTime() + duracao * 60000);

  return {
    idPaciente: idPaciente,
    inicio: ini2,
    fim: fim2,
    titulo: String(titulo || ""),
    notas: String(notas || ""),
    tipo: _agendaNormalizeTipo_(tipo),
    status: status,
    origem: _agendaNormalizeOrigem_(origem),
    permitirEncaixe: permitirEncaixe
  };
}

function _agendaBuildUpdatePatch_(existing, patch, topCompat, params) {
  patch = patch || {};
  topCompat = topCompat || {};

  var out = {};

  // Campos simples permitidos
  var fields = ["idPaciente", "titulo", "notas", "tipo", "status", "origem", "canceladoMotivo"];
  for (var i = 0; i < fields.length; i++) {
    var f = fields[i];
    if (patch[f] !== undefined) out[f] = patch[f];
  }

  // Compat: ID_Paciente
  if (topCompat.ID_Paciente !== undefined) out.idPaciente = topCompat.ID_Paciente;

  // Normalizações
  if (out.tipo !== undefined) out.tipo = _agendaNormalizeTipo_(out.tipo);
  if (out.status !== undefined) out.status = _agendaNormalizeStatus_(out.status);
  if (out.origem !== undefined) out.origem = _agendaNormalizeOrigem_(out.origem);

  // Datas: aceita patch.inicio/fim OU legado (data/hora_inicio/duracao)
  var hasNewDates = (patch.inicio !== undefined) || (patch.fim !== undefined);
  if (hasNewDates) {
    if (patch.inicio !== undefined) out.inicio = _agendaParseDateRequired_(patch.inicio, "inicio").toISOString();
    if (patch.fim !== undefined) out.fim = _agendaParseDateRequired_(patch.fim, "fim").toISOString();
  } else {
    // Legado/topo
    var dataStr = topCompat.data !== undefined ? String(topCompat.data) : null;
    var horaInicio = topCompat.hora_inicio !== undefined ? String(topCompat.hora_inicio) : null;
    var duracao = topCompat.duracao_minutos !== undefined ? Number(topCompat.duracao_minutos) : null;

    if (dataStr || horaInicio || duracao !== null) {
      var exIni = _agendaParseDate_(existing.inicio);
      var exFim = _agendaParseDate_(existing.fim);

      // reconstrói usando valores existentes como default
      var baseData = dataStr || (exIni ? _agendaFormatDate_(exIni) : null);
      var baseHora = horaInicio || (exIni ? _agendaFormatHHMM_(exIni) : null);

      if (!baseData || !baseHora) _agendaThrow_("VALIDATION_ERROR", "Não foi possível determinar data/hora para atualização legado.", {});

      var durMin;
      if (duracao !== null && !isNaN(duracao) && duracao > 0) durMin = duracao;
      else {
        // tenta inferir do existente
        if (exIni && exFim) durMin = Math.max(1, Math.round((exFim.getTime() - exIni.getTime()) / 60000));
        else durMin = Number(params.duracaoPadraoMin || 30);
      }

      var ini = _agendaBuildDateTime_(baseData, baseHora);
      var fim = new Date(ini.getTime() + durMin * 60000);

      out.inicio = ini.toISOString();
      out.fim = fim.toISOString();
    }
  }

  return out;
}

/**
 * ============================================================
 * Utils internos
 * ============================================================
 */

function _agendaNormalizeRowToDto_(rowObj) {
  rowObj = rowObj || {};
  return {
    idAgenda: rowObj.idAgenda || rowObj.ID_Agenda || "",
    idPaciente: rowObj.idPaciente || rowObj.ID_Paciente || "",
    inicio: rowObj.inicio || "",
    fim: rowObj.fim || "",
    titulo: rowObj.titulo || "",
    notas: rowObj.notas || "",
    tipo: rowObj.tipo || AGENDA_TIPO.CONSULTA,
    status: rowObj.status || AGENDA_STATUS.AGENDADO,
    origem: rowObj.origem || AGENDA_ORIGEM.RECEPCAO,
    criadoEm: rowObj.criadoEm || "",
    atualizadoEm: rowObj.atualizadoEm || "",
    canceladoEm: rowObj.canceladoEm || "",
    canceladoMotivo: rowObj.canceladoMotivo || ""
  };
}

function _agendaNormalizeStatus_(status) {
  var s = String(status || "").trim().toUpperCase();
  if (!s) return AGENDA_STATUS.AGENDADO;

  if (s.indexOf("CANCEL") >= 0) return AGENDA_STATUS.CANCELADO;
  if (s.indexOf("CONCLU") >= 0) return AGENDA_STATUS.CONCLUIDO;
  if (s.indexOf("FAL") >= 0) return AGENDA_STATUS.FALTOU;
  if (s.indexOf("AGEND") >= 0) return AGENDA_STATUS.AGENDADO;

  if (s === AGENDA_STATUS.AGENDADO || s === AGENDA_STATUS.CANCELADO || s === AGENDA_STATUS.CONCLUIDO || s === AGENDA_STATUS.FALTOU) return s;

  return AGENDA_STATUS.AGENDADO;
}

function _agendaNormalizeTipo_(tipo) {
  var t = String(tipo || "").trim().toUpperCase();
  if (!t) return AGENDA_TIPO.CONSULTA;

  if (t.indexOf("BLOQ") >= 0) return AGENDA_TIPO.BLOQUEIO;
  if (t.indexOf("RET") >= 0) return AGENDA_TIPO.RETORNO;
  if (t.indexOf("PROC") >= 0) return AGENDA_TIPO.PROCEDIMENTO;
  if (t.indexOf("CONS") >= 0) return AGENDA_TIPO.CONSULTA;

  if (t === AGENDA_TIPO.CONSULTA || t === AGENDA_TIPO.RETORNO || t === AGENDA_TIPO.PROCEDIMENTO || t === AGENDA_TIPO.BLOQUEIO || t === AGENDA_TIPO.OUTRO) return t;

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

function _agendaParseDateRequired_(v, fieldName) {
  var d = _agendaParseDate_(v);
  if (!d) _agendaThrow_("VALIDATION_ERROR", "Data inválida: " + String(fieldName || ""), { field: fieldName, value: v });
  return d;
}

function _agendaParseDate_(v) {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    var dNum = new Date(v);
    return isNaN(dNum.getTime()) ? null : dNum;
  }
  if (typeof v === "string") {
    var dStr = new Date(v);
    if (!isNaN(dStr.getTime())) return dStr;

    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      var parts = v.split("-");
      var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0);
      return isNaN(d.getTime()) ? null : d;
    }

    return null;
  }
  return null;
}

function _agendaBuildDateTime_(dateStr, hhmm) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr || ""))) {
    _agendaThrow_("VALIDATION_ERROR", "data inválida (esperado YYYY-MM-DD).", { value: dateStr });
  }
  if (!/^\d{2}:\d{2}$/.test(String(hhmm || ""))) {
    _agendaThrow_("VALIDATION_ERROR", "hora_inicio inválida (esperado HH:MM).", { value: hhmm });
  }

  var p = String(dateStr).split("-");
  var y = Number(p[0]);
  var m = Number(p[1]) - 1;
  var d = Number(p[2]);

  var t = String(hhmm).split(":");
  var H = Number(t[0]);
  var M = Number(t[1]);

  var dt = new Date(y, m, d, H, M, 0, 0);
  if (isNaN(dt.getTime())) _agendaThrow_("VALIDATION_ERROR", "data/hora inválida.", { dateStr: dateStr, hhmm: hhmm });
  return dt;
}

function _agendaFormatDate_(d) {
  var y = d.getFullYear();
  var m = ("0" + (d.getMonth() + 1)).slice(-2);
  var dd = ("0" + d.getDate()).slice(-2);
  return y + "-" + m + "-" + dd;
}

function _agendaFormatHHMM_(d) {
  var h = ("0" + d.getHours()).slice(-2);
  var m = ("0" + d.getMinutes()).slice(-2);
  return h + ":" + m;
}

/**
 * Lança erro SEM "throw { }"
 */
function _agendaThrow_(code, message, details) {
  var err = new Error(String(message || "Erro."));
  err.code = String(code || "INTERNAL_ERROR");
  err.details = (details === undefined ? null : details);
  throw err;
}

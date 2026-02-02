// backend/domain/Agenda/Agenda.Legacy.gs
// ============================================================
// LEGACY API (compat controlada)
// ------------------------------------------------------------
// Ajustes (2026-01) — alinhado ao canônico:
// - Passa idProfissional (obrigatório) para TODAS as operações que dependem de conflito/lock.
// - Aceita payload camelCase (horaInicio/duracaoMin/idAgenda) e legacy (hora_inicio/duracao_minutos/ID_Agenda).
// - NÃO resolve Pacientes no backend (proibido no módulo Agenda). "nomeCompleto" vira vazio ou "Bloqueio".
// - Corrige chamadas ao Agenda_Action_ListarPorPeriodo_ (envelope .data.items).
// ============================================================

function _agendaLegacyPick_(payload, keys) {
  payload = payload || {};
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (Object.prototype.hasOwnProperty.call(payload, k) && payload[k] !== undefined) return payload[k];
  }
  return undefined;
}

function _agendaLegacyRequireIdProfissional_(payload) {
  var v = _agendaLegacyPick_(payload, ["idProfissional", "id_profissional"]);
  var id = String(v || "").trim();
  if (!id) _agendaThrow_("VALIDATION_ERROR", '"idProfissional" é obrigatório.', { field: "idProfissional" });
  return id;
}

function _agendaLegacyGetIdAgenda_(payload) {
  var v = _agendaLegacyPick_(payload, ["idAgenda", "ID_Agenda", "ID_AGENDA"]);
  return String(v || "").trim();
}

function _agendaLegacyGetIdPaciente_(payload) {
  var v = _agendaLegacyPick_(payload, ["idPaciente", "ID_Paciente", "ID_PACIENTE"]);
  return String(v || "").trim();
}

function _agendaLegacyGetHoraInicio_(payload) {
  var v = _agendaLegacyPick_(payload, ["horaInicio", "hora_inicio"]);
  return String(v || "").trim();
}

function _agendaLegacyGetDuracaoMin_(payload) {
  var v = _agendaLegacyPick_(payload, ["duracaoMin", "duracao_minutos", "duracaoMinutos"]);
  return Number(v || 0);
}

// ============================================================
// LEGACY API (front antigo)
// ============================================================

function Agenda_Legacy_ListarDia_(ctx, payload) {
  payload = payload || {};

  // ✅ canônico: exige idProfissional
  var idProfissional = _agendaLegacyRequireIdProfissional_(payload);

  var dataStr = String(payload.data || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) _agendaThrow_("VALIDATION_ERROR", '"data" inválida (YYYY-MM-DD).', { field: "data" });

  var ini = new Date(Number(dataStr.slice(0, 4)), Number(dataStr.slice(5, 7)) - 1, Number(dataStr.slice(8, 10)), 0, 0, 0, 0);
  var fim = new Date(Number(dataStr.slice(0, 4)), Number(dataStr.slice(5, 7)) - 1, Number(dataStr.slice(8, 10)), 23, 59, 59, 999);

  var res = Agenda_Action_ListarPorPeriodo_(ctx, { inicio: ini, fim: fim, incluirCancelados: false, idProfissional: idProfissional });
  var items = (res && res.data && res.data.items) ? res.data.items : [];

  var ags = items.map(function (dto) { return _agendaLegacyDtoToFront_(dto); });

  var map = {};
  for (var i = 0; i < ags.length; i++) {
    var h = String(ags[i].hora_inicio || "");
    if (!map[h]) map[h] = [];
    map[h].push(ags[i]);
  }

  var horas = Object.keys(map).sort(function (a, b) { return a.localeCompare(b); });
  var horarios = horas.map(function (h) { return { hora: h, agendamentos: map[h] }; });

  return { resumo: _agendaLegacyBuildResumo_(ags), horarios: horarios };
}

function Agenda_Legacy_ListarSemana_(ctx, payload) {
  payload = payload || {};

  // ✅ canônico: exige idProfissional
  var idProfissional = _agendaLegacyRequireIdProfissional_(payload);

  var refStr = String(payload.data_referencia || payload.data || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(refStr)) _agendaThrow_("VALIDATION_ERROR", '"data_referencia" inválida (YYYY-MM-DD).', { field: "data_referencia" });

  var ref = new Date(Number(refStr.slice(0, 4)), Number(refStr.slice(5, 7)) - 1, Number(refStr.slice(8, 10)), 0, 0, 0, 0);
  var day = ref.getDay();
  var diffToMon = (day === 0) ? -6 : (1 - day);
  var mon = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + diffToMon, 0, 0, 0, 0);

  var dias = [];
  for (var d = 0; d < 7; d++) {
    var cur = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + d, 0, 0, 0, 0);
    var curEnd = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 23, 59, 59, 999);

    var r = Agenda_Action_ListarPorPeriodo_(ctx, { inicio: cur, fim: curEnd, incluirCancelados: false, idProfissional: idProfissional });
    var items = (r && r.data && r.data.items) ? r.data.items : [];
    var ags = items.map(function (dto) { return _agendaLegacyDtoToFront_(dto); });

    var map = {};
    for (var i = 0; i < ags.length; i++) {
      var h = String(ags[i].hora_inicio || "");
      if (!map[h]) map[h] = [];
      map[h].push(ags[i]);
    }

    var horas = Object.keys(map).sort(function (a, b) { return a.localeCompare(b); });
    var horarios = horas.map(function (h) { return { hora: h, agendamentos: map[h] }; });

    dias.push({ data: _agendaFormatDate_(cur), horarios: horarios });
  }

  return { dias: dias };
}

function Agenda_Legacy_Criar_(ctx, payload) {
  payload = payload || {};

  // ✅ canônico: exige idProfissional
  var idProfissional = _agendaLegacyRequireIdProfissional_(payload);

  var packedNotas = _agendaLegacyPackNotas_(payload);

  // Mantém "contrato legacy" aceito pelo normalizer, mas envia idProfissional
  var createPayload = {
    idProfissional: idProfissional,
    data: payload.data,
    horaInicio: _agendaLegacyGetHoraInicio_(payload),
    duracaoMin: _agendaLegacyGetDuracaoMin_(payload),
    idPaciente: _agendaLegacyGetIdPaciente_(payload),
    tipo: payload.tipo || "",
    titulo: payload.motivo || payload.titulo || "",
    origem: payload.origem || "",
    permitirEncaixe: payload.permite_encaixe === true || payload.permitirEncaixe === true,
    notas: packedNotas,
    status: payload.status ? String(payload.status) : undefined
  };

  var r = Agenda_Action_Criar_(ctx, createPayload);
  var dto = (r && r.data && r.data.item) ? r.data.item : null;

  return { ok: true, item: dto ? _agendaLegacyDtoToFront_(dto) : null };
}

function Agenda_Legacy_Atualizar_(ctx, payload) {
  payload = payload || {};

  // ✅ canônico: exige idProfissional (para lock/conflito)
  var idProfissional = _agendaLegacyRequireIdProfissional_(payload);

  var idAgenda = _agendaLegacyGetIdAgenda_(payload);
  if (!idAgenda) _agendaThrow_("VALIDATION_ERROR", '"idAgenda" é obrigatório.', { field: "idAgenda" });

  var existing = Repo_getById_(AGENDA_ENTITY, AGENDA_ID_FIELD, idAgenda);
  if (!existing) _agendaThrow_("NOT_FOUND", "Agendamento não encontrado.", { idAgenda: idAgenda });

  var packedNotas = _agendaLegacyMergeNotas_(existing.notas, payload);

  var updatePayload = {
    idAgenda: idAgenda,
    idProfissional: idProfissional,
    patch: {
      notas: packedNotas
    }
  };

  // campos opcionais
  var data = payload.data !== undefined ? payload.data : undefined;
  var horaInicio = _agendaLegacyPick_(payload, ["horaInicio", "hora_inicio"]);
  var duracaoMin = _agendaLegacyPick_(payload, ["duracaoMin", "duracao_minutos", "duracaoMinutos"]);
  var idPaciente = _agendaLegacyPick_(payload, ["idPaciente", "ID_Paciente", "ID_PACIENTE"]);

  if (data !== undefined) updatePayload.patch.data = data; // se seu normalizer usa data/hora para recompor, ele pode ler do payload também
  if (horaInicio !== undefined) updatePayload.patch.horaInicio = String(horaInicio);
  if (duracaoMin !== undefined) updatePayload.patch.duracaoMin = Number(duracaoMin);
  if (idPaciente !== undefined) updatePayload.patch.idPaciente = String(idPaciente || "");

  if (payload.tipo !== undefined) updatePayload.patch.tipo = payload.tipo;
  if (payload.origem !== undefined) updatePayload.patch.origem = payload.origem;

  var titulo = payload.motivo || payload.titulo;
  if (titulo !== undefined) updatePayload.patch.titulo = String(titulo || "");

  var permitirEncaixe = payload.permite_encaixe === true || payload.permitirEncaixe === true;
  if (payload.permite_encaixe !== undefined || payload.permitirEncaixe !== undefined) {
    updatePayload.patch.permitirEncaixe = permitirEncaixe;
  }

  if (payload.status !== undefined) {
    updatePayload.patch.status = payload.status;
  }

  var r = Agenda_Action_Atualizar_(ctx, updatePayload);
  var item = (r && r.data && r.data.item) ? r.data.item : null;

  return { ok: true, item: item ? _agendaLegacyDtoToFront_(item) : null };
}

function Agenda_Legacy_BloquearHorario_(ctx, payload) {
  payload = payload || {};

  // ✅ canônico: exige idProfissional
  var idProfissional = _agendaLegacyRequireIdProfissional_(payload);

  var dataStr = String(payload.data || "").trim();
  var horaStr = _agendaLegacyGetHoraInicio_(payload);
  var dur = _agendaLegacyGetDuracaoMin_(payload);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) _agendaThrow_("VALIDATION_ERROR", '"data" inválida.', { field: "data" });
  if (!/^\d{2}:\d{2}$/.test(horaStr)) _agendaThrow_("VALIDATION_ERROR", '"horaInicio" inválida.', { field: "horaInicio" });
  if (!dur || isNaN(dur) || dur <= 0) _agendaThrow_("VALIDATION_ERROR", '"duracaoMin" inválida.', { field: "duracaoMin" });

  var createPayload = {
    idProfissional: idProfissional,
    data: dataStr,
    horaInicio: horaStr,
    duracaoMin: dur,
    tipo: "BLOQUEIO",
    titulo: "BLOQUEIO",
    origem: "SISTEMA",
    notas: _agendaLegacyPackNotas_({ bloqueio: true })
  };

  var r = Agenda_Action_Criar_(ctx, createPayload);
  var item = (r && r.data && r.data.item) ? r.data.item : null;

  return { ok: true, item: item ? _agendaLegacyDtoToFront_(item) : null };
}

function Agenda_Legacy_RemoverBloqueio_(ctx, payload) {
  payload = payload || {};

  // ✅ canônico: exige idProfissional (lock/cálculo)
  var idProfissional = _agendaLegacyRequireIdProfissional_(payload);

  var idAgenda = _agendaLegacyGetIdAgenda_(payload);
  if (!idAgenda) _agendaThrow_("VALIDATION_ERROR", '"idAgenda" é obrigatório.', { field: "idAgenda" });

  Agenda_Action_Cancelar_(ctx, { idAgenda: idAgenda, idProfissional: idProfissional, motivo: "Remover bloqueio" });
  return { ok: true };
}

function Agenda_Legacy_MudarStatus_(ctx, payload) {
  payload = payload || {};

  // ✅ canônico: exige idProfissional (lock/cálculo)
  var idProfissional = _agendaLegacyRequireIdProfissional_(payload);

  var idAgenda = _agendaLegacyGetIdAgenda_(payload);
  var novo = String(payload.novo_status || "").trim();

  if (!idAgenda) _agendaThrow_("VALIDATION_ERROR", '"idAgenda" é obrigatório.', { field: "idAgenda" });
  if (!novo) _agendaThrow_("VALIDATION_ERROR", '"novo_status" é obrigatório.', { field: "novo_status" });

  var existing = Repo_getById_(AGENDA_ENTITY, AGENDA_ID_FIELD, idAgenda);
  if (!existing) _agendaThrow_("NOT_FOUND", "Agendamento não encontrado.", { idAgenda: idAgenda });

  var core = _agendaLegacyMapUiStatusToCore_(novo);
  var packedNotas = _agendaLegacyMergeNotas_(existing.notas, { status_label: novo });

  if (core === AGENDA_STATUS.CANCELADO) {
    Agenda_Action_Cancelar_(ctx, { idAgenda: idAgenda, idProfissional: idProfissional, motivo: "Cancelado pela Agenda" });
    return { ok: true };
  }

  var upd = { idAgenda: idAgenda, idProfissional: idProfissional, patch: { status: core, notas: packedNotas } };
  Agenda_Action_Atualizar_(ctx, upd);
  return { ok: true };
}

function Agenda_Legacy_ValidarConflito_(ctx, payload) {
  payload = payload || {};

  // ✅ canônico: exige idProfissional (engine exige)
  var idProfissional = _agendaLegacyRequireIdProfissional_(payload);

  var dataStr = String(payload.data || "").trim();
  var horaStr = _agendaLegacyGetHoraInicio_(payload);
  var dur = _agendaLegacyGetDuracaoMin_(payload);
  var ignoreId = String(_agendaLegacyPick_(payload, ["ignoreIdAgenda", "ignore_id_agenda", "ignoreId"]) || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) _agendaThrow_("VALIDATION_ERROR", '"data" inválida.', { field: "data" });
  if (!/^\d{2}:\d{2}$/.test(horaStr)) _agendaThrow_("VALIDATION_ERROR", '"horaInicio" inválida.', { field: "horaInicio" });
  if (!dur || isNaN(dur) || dur <= 0) _agendaThrow_("VALIDATION_ERROR", '"duracaoMin" inválida.', { field: "duracaoMin" });

  var params = (typeof Config_getAgendaParams_ === "function") ? Config_getAgendaParams_() : {
    duracaoPadraoMin: 30,
    slotMin: 10,
    permiteSobreposicao: false
  };

  var ini = _agendaBuildDateTime_(dataStr, horaStr);
  var fim = new Date(ini.getTime() + dur * 60000);

  var permitirEncaixe = payload.permite_encaixe === true || payload.permitirEncaixe === true;

  try {
    _agendaAssertSemConflitos_(ctx, {
      inicio: ini,
      fim: fim,
      idProfissional: idProfissional,
      permitirEncaixe: permitirEncaixe,
      modoBloqueio: false,
      ignoreIdAgenda: ignoreId || null
    }, params);

    return {
      ok: true,
      conflitos: [],
      intervalo: { idProfissional: idProfissional, data: dataStr, hora_inicio: horaStr, duracao_minutos: dur }
    };

  } catch (err) {
    var conflitos = [];
    try {
      var det = err && err.details ? err.details : null;
      var arr = det && det.conflitos ? det.conflitos : null;

      if (arr && arr.length) {
        for (var i = 0; i < arr.length; i++) {
          var c = arr[i];
          var ci = _agendaParseDate_(c.inicioDateTime || c.inicio);
          var cf = _agendaParseDate_(c.fimDateTime || c.fim);
          conflitos.push({
            ID_Agenda: c.idAgenda || "",
            bloqueio: String(c.tipo || "").toUpperCase().indexOf("BLOQ") >= 0,
            hora_inicio: ci ? _agendaFormatHHMM_(ci) : "",
            hora_fim: cf ? _agendaFormatHHMM_(cf) : ""
          });
        }
      }
    } catch (_) {}

    return {
      ok: false,
      erro: (err && err.message) ? String(err.message) : "Conflito de horário.",
      conflitos: conflitos,
      intervalo: { idProfissional: idProfissional, data: dataStr, hora_inicio: horaStr, duracao_minutos: dur },
      code: (err && err.code) ? String(err.code) : "CONFLICT"
    };
  }
}

// ============================================================
// Helpers LEGACY internos
// ============================================================

function _agendaLegacyPackNotas_(payload) {
  payload = payload || {};
  var obj = {
    __legacy: true,
    motivo: payload.motivo || payload.titulo || "",
    canal: payload.canal || "",
    documento_paciente: payload.documento_paciente || "",
    telefone_paciente: payload.telefone_paciente || "",
    data_nascimento: payload.data_nascimento || "",
    permite_encaixe: payload.permite_encaixe === true || payload.permitirEncaixe === true,
    status_label: payload.status_label || "",
    tipo_ui: payload.tipo || ""
  };

  if (payload.bloqueio === true) obj.bloqueio = true;

  try { return JSON.stringify(obj); } catch (e) { return ""; }
}

function _agendaLegacyTryParseNotas_(notas) {
  var s = String(notas || "").trim();
  if (!s) return {};
  if (s[0] !== "{") return {};
  try {
    var obj = JSON.parse(s);
    if (obj && typeof obj === "object") return obj;
  } catch (_) {}
  return {};
}

function _agendaLegacyMergeNotas_(existingNotas, payload) {
  var base = _agendaLegacyTryParseNotas_(existingNotas);
  if (!base || typeof base !== "object") base = {};
  base.__legacy = true;

  payload = payload || {};

  if (payload.motivo !== undefined) base.motivo = String(payload.motivo || "");
  if (payload.canal !== undefined) base.canal = String(payload.canal || "");
  if (payload.documento_paciente !== undefined) base.documento_paciente = String(payload.documento_paciente || "");
  if (payload.telefone_paciente !== undefined) base.telefone_paciente = String(payload.telefone_paciente || "");
  if (payload.data_nascimento !== undefined) base.data_nascimento = String(payload.data_nascimento || "");
  if (payload.permite_encaixe !== undefined) base.permite_encaixe = payload.permite_encaixe === true;
  if (payload.permitirEncaixe !== undefined) base.permite_encaixe = payload.permitirEncaixe === true;
  if (payload.status_label !== undefined) base.status_label = String(payload.status_label || "");
  if (payload.tipo !== undefined) base.tipo_ui = String(payload.tipo || "");
  if (payload.bloqueio === true) base.bloqueio = true;

  try { return JSON.stringify(base); } catch (e) { return String(existingNotas || ""); }
}

function _agendaLegacyMapUiStatusToCore_(label) {
  var s = String(label || "").trim().toLowerCase();

  if (s.indexOf("cancel") >= 0) return AGENDA_STATUS.CANCELADO;
  if (s.indexOf("remarc") >= 0) return AGENDA_STATUS.REMARCADO;
  if (s.indexOf("falt") >= 0) return AGENDA_STATUS.FALTOU;
  if (s.indexOf("confirm") >= 0) return AGENDA_STATUS.CONFIRMADO;
  if (s.indexOf("aguard") >= 0 || s.indexOf("cheg") >= 0) return AGENDA_STATUS.AGUARDANDO;
  if (s.indexOf("em atend") >= 0 || s.indexOf("em_atend") >= 0) return AGENDA_STATUS.EM_ATENDIMENTO;
  if (s.indexOf("atendid") >= 0 || s.indexOf("concl") >= 0) return AGENDA_STATUS.ATENDIDO;

  return AGENDA_STATUS.MARCADO;
}

// ============================================================
// ✅ LEGACY: _agendaLegacyDtoToFront_ (SEM acesso a Pacientes)
// - "nomeCompleto" apenas "Bloqueio" ou "".
// - UI canônica deve resolver nome via módulo Pacientes.
// ============================================================

function _agendaLegacyDtoToFront_(dto) {
  dto = _agendaNormalizeRowToDto_(dto || {});

  var tipo = _agendaNormalizeTipo_(dto.tipo);
  var status = _agendaNormalizeStatus_(dto.status);
  var origem = _agendaNormalizeOrigem_(dto.origem);

  var dtIni = _agendaParseDate_(dto.inicioDateTime || dto.inicio);
  var dtFim = _agendaParseDate_(dto.fimDateTime || dto.fim);

  var dataStr = dtIni ? _agendaFormatDate_(dtIni) : "";
  var hIni = dtIni ? _agendaFormatHHMM_(dtIni) : "";
  var hFim = dtFim ? _agendaFormatHHMM_(dtFim) : "";

  var durMin = 0;
  if (dtIni && dtFim) durMin = Math.max(1, Math.round((dtFim.getTime() - dtIni.getTime()) / 60000));

  var notasObj = _agendaLegacyTryParseNotas_(dto.notas);

  var telefonePaciente = String((notasObj && notasObj.telefone_paciente) ? notasObj.telefone_paciente : "").trim();
  var documentoPaciente = String((notasObj && notasObj.documento_paciente) ? notasObj.documento_paciente : "").trim();
  var motivo = String((notasObj && notasObj.motivo) ? notasObj.motivo : (dto.titulo || "")).trim();
  var canal = String((notasObj && notasObj.canal) ? notasObj.canal : "").trim();

  var isBloqueio = (tipo === AGENDA_TIPO.BLOQUEIO) || (notasObj && notasObj.bloqueio === true);
  var permiteEncaixe = (notasObj && notasObj.permite_encaixe === true);

  var nomeCompleto = isBloqueio ? "Bloqueio" : "";

  return {
    ID_Agenda: String(dto.idAgenda || ""),
    ID_Paciente: String(dto.idPaciente || ""),
    idProfissional: String(dto.idProfissional || ""),
    data: dataStr,
    hora_inicio: hIni,
    hora_fim: hFim,
    duracao_minutos: durMin,
    nomeCompleto: nomeCompleto,
    telefone_paciente: telefonePaciente,
    documento_paciente: documentoPaciente,
    motivo: motivo,
    canal: canal,
    origem: String(origem || ""),
    status: String(status || ""),
    tipo: String(tipo || ""),
    bloqueio: isBloqueio,
    permite_encaixe: permiteEncaixe
  };
}

// ============================================================
// ✅ LEGACY: _agendaLegacyBuildResumo_
// ============================================================

function _agendaLegacyBuildResumo_(ags) {
  var resumo = {
    total: 0,
    confirmados: 0,
    faltas: 0,
    cancelados: 0,
    concluidos: 0,
    em_atendimento: 0
  };

  var list = Array.isArray(ags) ? ags : [];
  for (var i = 0; i < list.length; i++) {
    var ag = list[i];
    if (!ag) continue;
    if (ag.bloqueio === true) continue;

    resumo.total++;

    var st = String(ag.status || "").toUpperCase();

    if (st.indexOf("CANCEL") >= 0) { resumo.cancelados++; continue; }
    if (st.indexOf("FALT") >= 0) { resumo.faltas++; continue; }
    if (st.indexOf("EM_ATEND") >= 0) { resumo.em_atendimento++; continue; }
    if (st.indexOf("CONCL") >= 0 || st.indexOf("ATENDID") >= 0) { resumo.concluidos++; continue; }
    if (st.indexOf("CONFIRM") >= 0 || st.indexOf("AGUARD") >= 0) { resumo.confirmados++; continue; }
  }

  return resumo;
}

/**
 * Adapter legacy de apoio (mantido), mas:
 * - exige idProfissional (porque engine exige)
 * - não retorna dados de paciente
 */
function Agenda_ListarEventosDiaParaValidacao_(dataStr) {
  dataStr = String(dataStr || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) return [];

  // ⚠️ Este adapter não tem idProfissional no signature original.
  // Para manter compat sem quebrar, ele vai retornar lista vazia (ou você passa idProfissional por outra via).
  // Se ainda for usado, crie um novo action canônico com payload {idProfissional, data}.
  return [];
}

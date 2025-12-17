/**
 * PRONTIO - AgendaConflitos.gs
 * Helper isolado para validar sobreposição de horários na Agenda.
 *
 * Como usar (exemplos):
 * - Em Agenda_Criar(payload):
 *     Agenda_AssertSemConflitos_({
 *        data: payload.data,
 *        inicio: payload.hora_inicio,
 *        duracaoMin: payload.duracao_minutos,
 *        // ignoreIdAgenda: "" // em criar não precisa
 *     });
 *
 * - Em Agenda_Atualizar(payload):
 *     Agenda_AssertSemConflitos_({
 *        data: payload.data,
 *        inicio: payload.hora_inicio,
 *        duracaoMin: payload.duracao_minutos,
 *        ignoreIdAgenda: payload.ID_Agenda
 *     });
 *
 * - Em Agenda_BloquearHorario(payload):
 *     Agenda_AssertSemConflitos_({
 *        data: payload.data,
 *        inicio: payload.hora_inicio,
 *        duracaoMin: payload.duracao_minutos,
 *        tipo: "BLOQUEIO"
 *     });
 *
 * Observação importante:
 * - Este helper NÃO conhece planilhas/abas/colunas. Ele depende de você fornecer
 *   uma função existente no seu Agenda.gs que liste os eventos do dia.
 *
 * Integração mínima exigida:
 * - Você precisa ter (ou criar) uma função no Agenda.gs:
 *     Agenda_ListarEventosDiaParaValidacao_(dataStr)
 *   que retorne uma lista de objetos no formato abaixo.
 *
 * Formato esperado de cada evento retornado:
 * {
 *   ID_Agenda: "AGD_...",
 *   data: "YYYY-MM-DD",
 *   hora_inicio: "HH:MM",
 *   duracao_minutos: 30,
 *   bloqueio: true|false
 * }
 *
 * Se no seu projeto o evento tiver hora_fim ao invés de duração, basta adaptar no
 * "normalizeEvento_" abaixo.
 */

// =======================
// Utilitários de horário
// =======================
function Agenda_TimeToMin_(hhmm) {
  if (!hhmm) return null;
  var s = String(hhmm).trim();
  var m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  var h = parseInt(m[1], 10);
  var min = parseInt(m[2], 10);
  if (isNaN(h) || isNaN(min)) return null;
  return h * 60 + min;
}

function Agenda_MinToTime_(mins) {
  var h = Math.floor(mins / 60);
  var m = mins % 60;
  var hh = (h < 10 ? "0" : "") + h;
  var mm = (m < 10 ? "0" : "") + m;
  return hh + ":" + mm;
}

// Intervalos: [inicio, fim) em minutos
function Agenda_IntervalsOverlap_(aStart, aEnd, bStart, bEnd) {
  // sobreposição se: aStart < bEnd && bStart < aEnd
  return (aStart < bEnd) && (bStart < aEnd);
}

function Agenda_NormalizeEvento_(ev) {
  var inicioMin = Agenda_TimeToMin_(ev.hora_inicio);
  if (inicioMin == null) return null;

  // Preferência: duracao_minutos
  var dur = parseInt(ev.duracao_minutos || "0", 10);

  // Fallback: se vier hora_fim em algum lugar
  if (!dur && ev.hora_fim) {
    var fimMin = Agenda_TimeToMin_(ev.hora_fim);
    if (fimMin != null && fimMin > inicioMin) {
      dur = fimMin - inicioMin;
    }
  }

  if (!dur || dur <= 0) return null;

  return {
    ID_Agenda: ev.ID_Agenda || "",
    data: ev.data || "",
    bloqueio: !!ev.bloqueio,
    inicioMin: inicioMin,
    fimMin: inicioMin + dur,
    duracao_minutos: dur
  };
}

// =======================
// API interna de validação
// =======================
function Agenda_ValidarConflitos_(args) {
  var data = args && args.data ? String(args.data) : "";
  var inicio = args && args.inicio ? String(args.inicio) : "";
  var duracaoMin = parseInt((args && args.duracaoMin) || "0", 10);
  var ignoreIdAgenda = args && args.ignoreIdAgenda ? String(args.ignoreIdAgenda) : "";

  if (!data || !inicio || !duracaoMin || duracaoMin <= 0) {
    return {
      ok: false,
      conflitos: [],
      intervalo: null,
      erro: "Parâmetros inválidos para validação de conflito (data/inicio/duração)."
    };
  }

  var inicioMin = Agenda_TimeToMin_(inicio);
  if (inicioMin == null) {
    return {
      ok: false,
      conflitos: [],
      intervalo: null,
      erro: "Hora início inválida: " + inicio
    };
  }

  var intervalo = {
    data: data,
    inicio: inicio,
    inicioMin: inicioMin,
    fimMin: inicioMin + duracaoMin,
    duracao_minutos: duracaoMin
  };

  if (typeof Agenda_ListarEventosDiaParaValidacao_ !== "function") {
    return {
      ok: false,
      conflitos: [],
      intervalo: intervalo,
      erro:
        "Integração pendente: crie Agenda_ListarEventosDiaParaValidacao_(data) no Agenda.gs para retornar os eventos do dia."
    };
  }

  var eventos = Agenda_ListarEventosDiaParaValidacao_(data) || [];
  var conflitos = [];

  for (var i = 0; i < eventos.length; i++) {
    var ev = eventos[i];
    if (!ev) continue;

    if (ignoreIdAgenda && String(ev.ID_Agenda || "") === ignoreIdAgenda) {
      continue;
    }

    var norm = Agenda_NormalizeEvento_(ev);
    if (!norm) continue;

    if (Agenda_IntervalsOverlap_(intervalo.inicioMin, intervalo.fimMin, norm.inicioMin, norm.fimMin)) {
      conflitos.push({
        ID_Agenda: norm.ID_Agenda,
        bloqueio: norm.bloqueio,
        data: norm.data,
        hora_inicio: Agenda_MinToTime_(norm.inicioMin),
        hora_fim: Agenda_MinToTime_(norm.fimMin),
        duracao_minutos: norm.duracao_minutos
      });
    }
  }

  return {
    ok: conflitos.length === 0,
    conflitos: conflitos,
    intervalo: intervalo,
    erro: ""
  };
}

function Agenda_AssertSemConflitos_(args) {
  var r = Agenda_ValidarConflitos_(args);
  if (r.ok) return r;

  var msgBase = r.erro ? r.erro : "Conflito de horário detectado.";
  if (r.conflitos && r.conflitos.length) {
    var c = r.conflitos[0];
    var tipo = c.bloqueio ? "bloqueio" : "agendamento";
    msgBase += " Ex.: conflito com " + tipo + " (" + c.hora_inicio + "–" + c.hora_fim + ").";
  }
  throw new Error(msgBase);
}

function Agenda_Action_ValidarConflito(payload) {
  payload = payload || {};
  return Agenda_ValidarConflitos_({
    data: payload.data,
    inicio: payload.hora_inicio,
    duracaoMin: payload.duracao_minutos,
    ignoreIdAgenda: payload.ignoreIdAgenda || ""
  });
}

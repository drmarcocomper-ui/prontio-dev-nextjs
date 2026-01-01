/* PRONTIO - Agenda Utils (utils.js) */
(function () {
  "use strict";

  const root = (window.PRONTIO = window.PRONTIO || {});
  root.Agenda = root.Agenda || {};

  function init() {}

  function stripAccents(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function clamp(n, a, b) {
    const x = Number(n);
    if (!isFinite(x)) return a;
    return Math.max(a, Math.min(b, x));
  }

  function timeToMinutes(hhmm) {
    if (!hhmm) return null;
    const parts = String(hhmm).split(":");
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }

  function minutesToTime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function normalizeHora(value) {
    if (!value) return null;
    if (value instanceof Date) return minutesToTime(value.getHours() * 60 + value.getMinutes());
    const s = String(value).trim();
    const m = s.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return `${String(parseInt(m[1], 10)).padStart(2, "0")}:${m[2]}`;
  }

  function formatDateToInput(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function parseInputDate(value) {
    const [y, m, d] = String(value || "").split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }

  function formatDataBonita(dataStr) {
    if (!dataStr) return "";
    const [y, m, d] = String(dataStr).split("-");
    return `${d}/${m}`;
  }

  function getDiaSemanaLabel(dataStr) {
    const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const [y, m, d] = String(dataStr).split("-").map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return dias[dt.getDay()];
  }

  function ymdFromIso(iso) {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      return formatDateToInput(d);
    } catch (_) {
      return "";
    }
  }

  function hhmmFromIso(iso) {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch (_) {
      return "";
    }
  }

  function diffMinutes(isoStart, isoEnd) {
    try {
      const a = new Date(isoStart);
      const b = new Date(isoEnd);
      const ms = b.getTime() - a.getTime();
      if (!isFinite(ms)) return 0;
      return Math.max(1, Math.round(ms / 60000));
    } catch (_) {
      return 0;
    }
  }

  function tryParseNotas(s) {
    try {
      const raw = String(s || "").trim();
      if (!raw || raw[0] !== "{") return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function buildNotasJson(baseNotasStr, patchObj) {
    let base = {};
    try {
      const s = String(baseNotasStr || "").trim();
      if (s && s[0] === "{") base = JSON.parse(s);
    } catch (_) {
      base = {};
    }
    if (!base || typeof base !== "object") base = {};
    base.__legacy = true;

    const patch = patchObj && typeof patchObj === "object" ? patchObj : {};
    Object.keys(patch).forEach((k) => {
      const v = patch[k];
      if (v === undefined || v === null) return;
      if (typeof v === "string" && v.trim() === "") return;
      base[k] = v;
    });

    try { return JSON.stringify(base); } catch (_) { return ""; }
  }

  function normalizeOrigemCanonic(v) {
    const s = String(v || "").trim().toUpperCase();
    if (!s) return "RECEPCAO";
    if (s.includes("RECEP")) return "RECEPCAO";
    if (s.includes("MED")) return "MEDICO";
    if (s.includes("SIS")) return "SISTEMA";
    return s;
  }

  function getPacienteIdFromInput(inputEl) {
    if (!inputEl || !inputEl.dataset) return "";
    return String(inputEl.dataset.pacienteId || "").trim();
  }

  function setPacienteIdOnInput(inputEl, pacienteOrNull) {
    if (!inputEl || !inputEl.dataset) return;
    if (!pacienteOrNull) {
      delete inputEl.dataset.pacienteId;
      delete inputEl.dataset.pacienteNome;
      return;
    }
    inputEl.dataset.pacienteId = String(pacienteOrNull.ID_Paciente || "");
    inputEl.dataset.pacienteNome = String(pacienteOrNull.nome || "");
  }

  // Status (labels UI <-> backend)
  const STATUS_OPTIONS = ["Agendado", "Confirmado", "Em atendimento", "Concluído", "Faltou", "Cancelado"];

  function normalizeStatusLabel(status) {
    const v = stripAccents(String(status || "")).trim().toLowerCase();
    if (!v) return "Agendado";
    if (v.includes("concl") || v.includes("atendid")) return "Concluído";
    if (v.includes("em_atend") || v.includes("em atend") || (v.includes("atend") && !v.includes("atendid"))) return "Em atendimento";
    if (v.includes("aguard") || v.includes("confirm")) return "Confirmado";
    if (v.includes("falt")) return "Faltou";
    if (v.includes("cancel")) return "Cancelado";
    if (v.includes("marc") || v.includes("agend") || v.includes("remarc")) return "Agendado";
    return "Agendado";
  }

  function mapStatusToBackend(label) {
    const v = stripAccents(String(label || "")).toLowerCase();
    if (v.includes("confirm")) return "CONFIRMADO";
    if (v.includes("em atend") || v.includes("em_atend") || (v.includes("atend") && !v.includes("concl"))) return "EM_ATENDIMENTO";
    if (v.includes("concl")) return "CONCLUIDO";
    if (v.includes("falt")) return "FALTOU";
    if (v.includes("cancel")) return "CANCELADO";
    return "AGENDADO";
  }

  function getStatusClass(status) {
    if (!status) return "status-agendado";
    const s = stripAccents(String(status)).toLowerCase();
    if (s.includes("confirm")) return "status-confirmado";
    if (s.includes("em_atend") || s.includes("em atend") || (s.includes("atend") && !s.includes("atendid"))) return "status-em-atendimento";
    if (s.includes("falt")) return "status-falta";
    if (s.includes("cancel")) return "status-cancelado";
    if (s.includes("concl") || s.includes("atendid")) return "status-concluido";
    return "status-agendado";
  }

  // Normaliza qualquer agendamento para shape UI
  function dtoToUiAg(dto) {
    const inicioIso = dto && dto.inicio ? String(dto.inicio) : "";
    const fimIso = dto && dto.fim ? String(dto.fim) : "";
    const tipo = String(dto && dto.tipo ? dto.tipo : "");
    const isBloqueio = tipo.toUpperCase() === "BLOQUEIO";
    const notasObj = tryParseNotas(dto && dto.notas ? dto.notas : null) || {};

    return {
      ID_Agenda: dto && (dto.idAgenda || dto.ID_Agenda) ? String(dto.idAgenda || dto.ID_Agenda) : "",
      ID_Paciente: dto && (dto.idPaciente || dto.ID_Paciente) ? String(dto.idPaciente || dto.ID_Paciente) : "",
      data: ymdFromIso(inicioIso),
      hora_inicio: hhmmFromIso(inicioIso),
      hora_fim: hhmmFromIso(fimIso),
      duracao_minutos: diffMinutes(inicioIso, fimIso),
      nome_paciente: (notasObj.nome_paciente || dto.titulo) ? String(notasObj.nome_paciente || dto.titulo) : (isBloqueio ? "Bloqueio" : ""),
      telefone_paciente: notasObj.telefone_paciente ? String(notasObj.telefone_paciente) : "",
      documento_paciente: notasObj.documento_paciente ? String(notasObj.documento_paciente) : "",
      motivo: notasObj.motivo ? String(notasObj.motivo) : "",
      canal: notasObj.canal ? String(notasObj.canal) : "",
      origem: dto && dto.origem ? String(dto.origem) : "",
      status: dto && dto.status ? String(dto.status) : "",
      tipo: tipo,
      bloqueio: isBloqueio,
      permite_encaixe: notasObj.permite_encaixe === true,
      notas: dto && dto.notas ? String(dto.notas) : ""
    };
  }

  function normalizeUiAg(ag) {
    if (!ag || typeof ag !== "object") return null;
    if (ag.ID_Agenda || ag.data || ag.hora_inicio) {
      const tipo = String(ag.tipo || "");
      const isBloqueio = ag.bloqueio === true || tipo.toUpperCase() === "BLOQUEIO";
      return {
        ID_Agenda: ag.ID_Agenda ? String(ag.ID_Agenda) : "",
        ID_Paciente: ag.ID_Paciente ? String(ag.ID_Paciente) : "",
        data: ag.data ? String(ag.data) : "",
        hora_inicio: ag.hora_inicio ? String(ag.hora_inicio) : "",
        hora_fim: ag.hora_fim ? String(ag.hora_fim) : "",
        duracao_minutos: ag.duracao_minutos ? Number(ag.duracao_minutos) : 0,
        nome_paciente: ag.nome_paciente ? String(ag.nome_paciente) : isBloqueio ? "Bloqueio" : "",
        telefone_paciente: ag.telefone_paciente ? String(ag.telefone_paciente) : "",
        documento_paciente: ag.documento_paciente ? String(ag.documento_paciente) : "",
        motivo: ag.motivo ? String(ag.motivo) : "",
        canal: ag.canal ? String(ag.canal) : "",
        origem: ag.origem ? String(ag.origem) : "",
        status: ag.status ? String(ag.status) : "",
        tipo: tipo,
        bloqueio: isBloqueio,
        permite_encaixe: ag.permite_encaixe === true,
        notas: ag.notas ? String(ag.notas) : ""
      };
    }
    return dtoToUiAg(ag);
  }

  function computeResumoDia(ags) {
    const resumo = { total: 0, confirmados: 0, faltas: 0, cancelados: 0, concluidos: 0, em_atendimento: 0 };
    (ags || []).forEach((ag) => {
      if (!ag || ag.bloqueio) return;
      resumo.total++;
      const s = stripAccents(String(ag.status || "")).toLowerCase();
      if (s.includes("falt")) return (resumo.faltas++, void 0);
      if (s.includes("cancel")) return (resumo.cancelados++, void 0);
      if (s.includes("concl") || s.includes("atendid")) return (resumo.concluidos++, void 0);
      if (s.includes("em_atend") || s.includes("em atend") || (s.includes("atend") && !s.includes("atendid"))) return (resumo.em_atendimento++, void 0);
      if (s.includes("confirm") || s.includes("aguard")) return (resumo.confirmados++, void 0);
    });
    return resumo;
  }

  root.Agenda.utils = {
    init,
    stripAccents,
    clamp,
    timeToMinutes,
    minutesToTime,
    normalizeHora,
    formatDateToInput,
    parseInputDate,
    formatDataBonita,
    getDiaSemanaLabel,
    ymdFromIso,
    hhmmFromIso,
    diffMinutes,
    tryParseNotas,
    buildNotasJson,
    normalizeOrigemCanonic,
    getPacienteIdFromInput,
    setPacienteIdOnInput,
    STATUS_OPTIONS,
    normalizeStatusLabel,
    mapStatusToBackend,
    getStatusClass,
    dtoToUiAg,
    normalizeUiAg,
    computeResumoDia
  };
})();

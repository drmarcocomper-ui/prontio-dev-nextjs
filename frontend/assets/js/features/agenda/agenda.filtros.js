// frontend/assets/js/features/agenda/agenda.filtros.js
/**
 * PRONTIO — Agenda Filtros (Front)
 * ------------------------------------------------------------
 * Responsável por:
 * - Normalizar filtros (nome/status)
 * - Aplicar filtros em agendamentos UI
 *
 * Regras:
 * - Não chama API
 * - Não acessa DOM
 */

(function (global) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.features = PRONTIO.features || {};
  PRONTIO.features.agenda = PRONTIO.features.agenda || {};

  const FX = PRONTIO.features.agenda.formatters || null;

  function strip_(s) {
    if (FX && typeof FX.stripAccents === "function") return FX.stripAccents(s);
    return String(s || "");
  }

  function normalizeFilters(filtros) {
    const f = filtros || {};
    const termo = strip_(String(f.nome || "")).toLowerCase().trim();
    const statusFiltro = strip_(String(f.status || "")).toLowerCase().trim();
    return { termo, statusFiltro };
  }

  function matchesFiltroStatus(statusValue, statusFiltro) {
    if (!statusFiltro) return true;

    const s = strip_(String(statusValue || "")).toLowerCase();

    // Matching mais preciso para evitar falsos positivos
    // "concluído" ou "atendido"
    if (statusFiltro.includes("concl") || statusFiltro === "atendido") {
      return s.includes("concl") || s === "atendido" || s.includes("atendid");
    }

    // "agendado" ou "marcado" (mas não "remarcado")
    if (statusFiltro.includes("agend") || statusFiltro === "marcado") {
      return s.includes("agend") || s === "marcado" || (s.includes("marc") && !s.includes("remarc"));
    }

    // "remarcado" - específico
    if (statusFiltro.includes("remarc")) {
      return s.includes("remarc");
    }

    // "em atendimento" - evita confundir com "atendido"
    if (statusFiltro.includes("em atendimento") || statusFiltro.includes("em_atend")) {
      return s.includes("em_atend") || s.includes("em atend");
    }

    // "atend" sem "ido" - significa "em atendimento"
    if (statusFiltro === "atend" || (statusFiltro.includes("atend") && !statusFiltro.includes("atendid"))) {
      return s.includes("em_atend") || s.includes("em atend");
    }

    // "confirmado"
    if (statusFiltro.includes("confirm")) {
      return s.includes("confirm");
    }

    // "cancelado"
    if (statusFiltro.includes("cancel")) {
      return s.includes("cancel");
    }

    // "faltou"
    if (statusFiltro.includes("falt")) {
      return s.includes("falt");
    }

    // Fallback: matching direto
    return s.includes(statusFiltro);
  }

  /**
   * @param {Object} ag UI agendamento
   * @param {string} termo normalized (lowercase, sem acentos)
   * @param {string} statusFiltro normalized (lowercase, sem acentos)
   * @param {Function} resolveNomeFn (ag) => string (nome do paciente)
   */
  function matchesAgendamento(ag, termo, statusFiltro, resolveNomeFn) {
    if (!ag) return false;

    if (termo) {
      const nomeRaw = (typeof resolveNomeFn === "function") ? resolveNomeFn(ag) : (ag.nomeCompleto || "");
      const nome = strip_(String(nomeRaw || "")).toLowerCase();
      if (!nome.includes(termo)) return false;
    }

    return matchesFiltroStatus(ag.status, statusFiltro);
  }

  function createAgendaFiltros() {
    return {
      normalizeFilters,
      matchesFiltroStatus,
      matchesAgendamento
    };
  }

  // Export tanto a factory quanto as funções diretamente (para compatibilidade com loaders)
  PRONTIO.features.agenda.filtros = {
    createAgendaFiltros,
    normalizeFilters,
    matchesFiltroStatus,
    matchesAgendamento
  };

})(window);

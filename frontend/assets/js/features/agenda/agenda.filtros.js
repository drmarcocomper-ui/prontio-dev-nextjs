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

    if (statusFiltro.includes("concl")) return s.includes("concl") || s.includes("atendid");
    if (statusFiltro.includes("agend")) return s.includes("agend") || s.includes("marc");
    if (statusFiltro.includes("em atendimento") || statusFiltro.includes("em_atend") || statusFiltro.includes("atend")) {
      return s.includes("em_atend") || s.includes("em atend") || (s.includes("atend") && !s.includes("atendid"));
    }
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

  PRONTIO.features.agenda.filtros = { createAgendaFiltros };

})(window);

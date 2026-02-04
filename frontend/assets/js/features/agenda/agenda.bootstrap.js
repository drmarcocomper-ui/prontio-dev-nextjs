// frontend/assets/js/features/agenda/agenda.bootstrap.js
/**
 * PRONTIO — Agenda Bootstrap Loader (Front) - OTIMIZADO
 * ------------------------------------------------------------
 * ✅ Carregamento PARALELO por grupos (muito mais rápido)
 * ✅ Mantém ordem de dependências
 *
 * Grupos de carregamento:
 * 1. Core (paralelo): formatters, view, api, state
 * 2. Módulos (paralelo): pacientesCache, filtros, loaders, uiActions, editActions
 * 3. Entry (sequencial): controller → events → entry
 */

(function (global, document) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.features = PRONTIO.features || {};
  PRONTIO.features.agenda = PRONTIO.features.agenda || {};
  PRONTIO.features.agenda.bootstrap = PRONTIO.features.agenda.bootstrap || {};

  function loadScript_(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve(src);
      s.onerror = () => reject(new Error("Falha ao carregar: " + src));
      document.head.appendChild(s);
    });
  }

  function isLoaded_() {
    const a = PRONTIO.features && PRONTIO.features.agenda ? PRONTIO.features.agenda : {};

    // base
    if (!a.formatters) return false;
    if (!a.view?.createAgendaView) return false;
    if (!a.api?.createAgendaApi) return false;
    if (!a.state?.createAgendaState) return false;

    // split modules
    if (!a.loaders?.createAgendaLoaders) return false;
    if (!a.uiActions?.createAgendaUiActions) return false;
    if (!a.editActions?.createAgendaEditActions) return false;
    if (!a.pacientesCache?.createAgendaPacientesCache) return false;
    if (!a.filtros?.createAgendaFiltros) return false;

    // controller + events + entry
    if (!a.controller?.createAgendaController) return false;
    if (!a.events?.bindAgendaEvents) return false;
    if (!a.entry?.init) return false;

    return true;
  }

  /**
   * Carrega scripts da Agenda em PARALELO por grupos.
   * @param {Object} opts
   * @param {string} [opts.base="/frontend/assets/js/"] base path
   * @returns {Promise<{loaded:string[], skipped:boolean}>}
   */
  async function load(opts) {
    opts = opts || {};
    const base = String(opts.base || "/frontend/assets/js/").replace(/\/+$/, "") + "/";

    // Se já estiver tudo carregado, não faz nada.
    if (isLoaded_()) return { loaded: [], skipped: true };

    const loaded = [];

    // ✅ GRUPO 1: Core (paralelo) - não têm dependências entre si
    const coreFiles = [
      "features/agenda/agenda.formatters.js",
      "features/agenda/agenda.view.js",
      "features/agenda/agenda.api.js",
      "features/agenda/agenda.state.js"
    ];
    await Promise.all(coreFiles.map(f => loadScript_(base + f)));
    loaded.push(...coreFiles);

    // ✅ GRUPO 2: Módulos (paralelo) - dependem do core mas não entre si
    const moduleFiles = [
      "features/agenda/agenda.pacientesCache.js",
      "features/agenda/agenda.filtros.js",
      "features/agenda/agenda.loaders.js",
      "features/agenda/agenda.uiActions.js",
      "features/agenda/agenda.editActions.js"
    ];
    await Promise.all(moduleFiles.map(f => loadScript_(base + f)));
    loaded.push(...moduleFiles);

    // ✅ GRUPO 3: Entry points (sequencial) - dependem de tudo acima
    const entryFiles = [
      "features/agenda/agenda.controller.js",
      "features/agenda/agenda.events.js",
      "features/agenda/agenda.entry.js"
    ];
    for (const f of entryFiles) {
      await loadScript_(base + f);
      loaded.push(f);
    }

    return { loaded, skipped: false };
  }

  PRONTIO.features.agenda.bootstrap.load = load;

})(window, document);

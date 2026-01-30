// frontend/assets/js/features/agenda/agenda.bootstrap.js
/**
 * PRONTIO — Agenda Bootstrap Loader (Front)
 * ------------------------------------------------------------
 * Responsabilidade:
 * - Carregar scripts da Agenda (split) em ordem determinística.
 *
 * Regras:
 * - Não chama API
 * - Não inicializa a página automaticamente
 * - Apenas garante que os módulos estejam carregados antes do entry/controller rodarem
 *
 * Uso sugerido:
 * - Incluir este arquivo cedo (antes de page-agenda.js), e chamar:
 *   PRONTIO.features.agenda.bootstrap.load().then(() => { ... })
 * - Ou chamar dentro do seu main.js / loader central quando detectar page "agenda".
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
      s.async = false; // mantém ordem
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
   * Carrega scripts da Agenda em ordem.
   * @param {Object} opts
   * @param {string} [opts.base="/frontend/assets/js/"] base path
   * @returns {Promise<{loaded:string[], skipped:boolean}>}
   */
  async function load(opts) {
    opts = opts || {};
    const base = String(opts.base || "/frontend/assets/js/").replace(/\/+$/, "") + "/";

    // Se já estiver tudo carregado, não faz nada.
    if (isLoaded_()) return { loaded: [], skipped: true };

    const files = [
      // core da feature
      "features/agenda/agenda.formatters.js",
      "features/agenda/agenda.view.js",
      "features/agenda/agenda.api.js",
      "features/agenda/agenda.state.js",

      // split modules
      "features/agenda/agenda.pacientesCache.js",
      "features/agenda/agenda.filtros.js",
      "features/agenda/agenda.loaders.js",
      "features/agenda/agenda.uiActions.js",
      "features/agenda/agenda.editActions.js",

      // controller + events + entry
      "features/agenda/agenda.controller.js",
      "features/agenda/agenda.events.js",
      "features/agenda/agenda.entry.js"
    ];

    const loaded = [];
    for (let i = 0; i < files.length; i++) {
      const src = base + files[i];
      await loadScript_(src);
      loaded.push(src);
    }

    return { loaded, skipped: false };
  }

  PRONTIO.features.agenda.bootstrap.load = load;

})(window, document);

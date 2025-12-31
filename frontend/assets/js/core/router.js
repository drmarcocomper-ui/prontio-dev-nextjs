// assets/js/core/router.js
// Responsável por descobrir qual página está sendo carregada
// e disparar a função de inicialização registrada para ela.
//
// Uso típico em page-pacientes.js:
// PRONTIO.core.router.register("pacientes", initPacientesPage);
//
// No HTML da página (ex.: pacientes.html):
// <body data-page="pacientes">
//
// ✅ PASSO 2 (padronização):
// - detectPageId aceita múltiplos atributos: data-page, data-page-id, data-pageId
//   para evitar divergências entre páginas.

(function (global) {
  "use strict";

  const PRONTIO = global.PRONTIO = global.PRONTIO || {};
  PRONTIO.core = PRONTIO.core || {};

  const Router = {
    routes: {},
    currentPageId: null,
    started: false,

    register(pageId, initFn) {
      if (!pageId || typeof initFn !== "function") {
        console.warn("[Router] register chamado com parâmetros inválidos", pageId, initFn);
        return;
      }
      this.routes[String(pageId).toLowerCase().trim()] = initFn;
    },

    detectPageId() {
      const body = document.body;

      // ✅ prioriza atributos explícitos (padroniza lower-case)
      try {
        if (body) {
          // data-page="x"
          if (body.dataset && body.dataset.page) return String(body.dataset.page).toLowerCase().trim();

          // data-page-id="x"
          const pidAttr = body.getAttribute("data-page-id");
          if (pidAttr) return String(pidAttr).toLowerCase().trim();

          // data-pageId="x" (caso algum HTML use camel)
          if (body.dataset && body.dataset.pageId) return String(body.dataset.pageId).toLowerCase().trim();

          // data-page="x" via getAttribute (fallback)
          const pAttr = body.getAttribute("data-page");
          if (pAttr) return String(pAttr).toLowerCase().trim();
        }
      } catch (_) {}

      // fallback: tenta extrair do caminho da URL, ex.: /pacientes.html -> "pacientes"
      const path = global.location.pathname || "";
      const fileName = path.split("/").pop() || "";
      const withoutExt = fileName.replace(/\.[^/.]+$/, ""); // remove extensão
      return (withoutExt || "index").toLowerCase().trim();
    },

    start() {
      if (this.started) return;
      this.started = true;

      const pageId = this.detectPageId();
      this.currentPageId = pageId;

      const initFn = this.routes[pageId];
      if (typeof initFn === "function") {
        try {
          initFn();
        } catch (err) {
          console.error(`[Router] Erro ao inicializar página '${pageId}'`, err);
        }
      } else {
        // não é erro fatal, mas ajuda debug
        console.warn(`[Router] Nenhuma rota registrada para a página '${pageId}'`);
      }
    }
  };

  PRONTIO.core.router = Router;

})(window);

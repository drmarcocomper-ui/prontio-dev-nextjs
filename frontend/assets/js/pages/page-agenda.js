/* PRONTIO - Page bootstrap: Agenda
 * Antes: monolito gigantesco aqui.
 * Agora: a lógica mora em /assets/js/agenda/*.js
 */
(function (global, document) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.pages = PRONTIO.pages || {};

  function initAgendaPage() {
    const body = document.body;
    const pageId = body.dataset.pageId || body.getAttribute("data-page") || null;
    if (pageId !== "agenda") return;

    if (!PRONTIO.Agenda || typeof PRONTIO.Agenda.initPage !== "function") {
      console.error("[PRONTIO][Agenda] Módulo PRONTIO.Agenda.initPage não encontrado.");
      alert("Agenda não inicializada (scripts não carregados).");
      return;
    }

    PRONTIO.Agenda.initPage();
  }

  if (typeof PRONTIO.registerPage === "function") {
    PRONTIO.registerPage("agenda", initAgendaPage);
  } else {
    PRONTIO.pages.agenda = { init: initAgendaPage };
  }
})(window, document);

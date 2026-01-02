// frontend/assets/js/pages/page-agenda.js
(function (global, document) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.pages = PRONTIO.pages || {};
  PRONTIO._pageInited = PRONTIO._pageInited || {};

  function initAgendaPage() {
    if (PRONTIO._pageInited.agenda === true) return;
    PRONTIO._pageInited.agenda = true;

    const entry =
      PRONTIO.features &&
      PRONTIO.features.agenda &&
      PRONTIO.features.agenda.entry
        ? PRONTIO.features.agenda.entry
        : null;

    if (!entry || typeof entry.init !== "function") {
      console.error("[PRONTIO][Agenda] agenda.entry.init não encontrado.");
      return;
    }

    // ✅ passa window também (evita env.window undefined em qualquer versão do entry)
    try {
      entry.init({ document: document, window: global });
    } catch (e) {
      console.error("[PRONTIO][Agenda] Erro ao inicializar agenda.entry:", e);
    }
  }

  PRONTIO.pages.agenda = PRONTIO.pages.agenda || {};
  PRONTIO.pages.agenda.init = initAgendaPage;

  try {
    if (typeof PRONTIO.registerPage === "function") {
      PRONTIO.registerPage("agenda", initAgendaPage);
    }
  } catch (_) {}

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAgendaPage);
  } else {
    initAgendaPage();
  }
})(window, document);

/**
 * PRONTIO - page-agenda.js - OTIMIZADO
 * ✅ Sem polling (execução direta após bootstrap)
 * ✅ Mais rápido e eficiente
 */
(function (global, document) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.pages = PRONTIO.pages || {};
  PRONTIO._pageInited = PRONTIO._pageInited || {};

  function getEntryInit_() {
    return PRONTIO.features &&
      PRONTIO.features.agenda &&
      PRONTIO.features.agenda.entry &&
      typeof PRONTIO.features.agenda.entry.init === "function"
      ? PRONTIO.features.agenda.entry.init
      : null;
  }

  /**
   * ✅ Inicializa agenda DIRETAMENTE (sem polling)
   * Chamado pelo bootstrap após carregar todos os scripts
   */
  function initAgendaPage() {
    if (PRONTIO._pageInited.agenda === true) return;
    PRONTIO._pageInited.agenda = true;

    const initFn = getEntryInit_();

    if (initFn) {
      try {
        initFn({ document: document, window: global });
      } catch (e) {
        console.error("[PRONTIO][Agenda] Erro ao executar agenda.entry.init:", e);
      }
    } else {
      console.error("[PRONTIO][Agenda] agenda.entry.init não encontrado. Verifique se bootstrap.load() foi chamado.");
    }
  }

  PRONTIO.pages.agenda = PRONTIO.pages.agenda || {};
  PRONTIO.pages.agenda.init = initAgendaPage;

  try {
    if (typeof PRONTIO.registerPage === "function") {
      PRONTIO.registerPage("agenda", initAgendaPage);
    }
  } catch (_) {}

  // ✅ NÃO auto-inicializa aqui - deixa o bootstrap.js controlar
  // O bootstrap.load() carrega os scripts e depois chama page.init()

})(window, document);

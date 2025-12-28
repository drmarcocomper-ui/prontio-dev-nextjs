// frontend/assets/js/core/app.js
// ============================================================
// PRONTIO - App bootstrap (Front-end) [PROFISSIONALIZADO]
// ============================================================
// Objetivo:
// - Ser um módulo idempotente chamado pelo main.js (único bootstrap).
// - NÃO auto-inicializar (evita init duplicado e estados inconsistentes).
// - NÃO injetar scripts por conta própria (loader central é o main.js).
// ============================================================

(function (global) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.core = PRONTIO.core || {};
  PRONTIO.app = PRONTIO.app || {};

  function log_(...args) {
    try { console.log("[PRONTIO.app]", ...args); } catch (_) {}
  }

  function warn_(...args) {
    try { console.warn("[PRONTIO.app]", ...args); } catch (_) {}
  }

  async function init_() {
    // ✅ trava anti-duplo-init
    if (PRONTIO.app._inited === true) return true;
    PRONTIO.app._inited = true;

    // Se existir router do PRONTIO, inicia (best-effort)
    try {
      if (PRONTIO.core && PRONTIO.core.router && typeof PRONTIO.core.router.start === "function") {
        PRONTIO.core.router.start();
      }
    } catch (e) {
      warn_("Falha ao iniciar router:", e && e.message ? e.message : String(e));
    }

    log_("init ok");
    return true;
  }

  // Exports
  PRONTIO.app.init = init_;

})(window);

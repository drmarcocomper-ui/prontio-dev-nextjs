// frontend/assets/js/core/app.js
// ============================================================
// PRONTIO - App bootstrap (Front-end) [PROFISSIONALIZADO]
// ============================================================
// Objetivo:
// - Ser um módulo idempotente chamado pelo main.js (único bootstrap).
// - NÃO auto-inicializar (evita init duplicado e estados inconsistentes).
// - NÃO injetar scripts por conta própria (loader central é o main.js).
//
// ✅ PASSO 2 (padronização global):
// - Guard oficial aqui (antes do router):
//   PRONTIO.core.session.ensureAuthenticated({ redirect:true })
// - Exceções: login/forgot-password/reset-password (páginas públicas)
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

  function getPageId_() {
    try {
      const body = global.document && global.document.body;
      const pid = (body && (body.getAttribute("data-page-id") || (body.dataset && (body.dataset.pageId || body.dataset.page)))) || "";
      return String(pid || "").toLowerCase().trim();
    } catch (_) {
      return "";
    }
  }

  function isPublicPage_(pageId) {
    const pid = String(pageId || "").toLowerCase().trim();

    // lista explícita de páginas públicas
    if (pid === "login") return true;
    if (pid === "forgot-password") return true;
    if (pid === "reset-password") return true;

    // fallback por path (caso pageId falhe)
    try {
      const path = (global.location && global.location.pathname) ? global.location.pathname.toLowerCase() : "";
      if (path.endsWith("/login.html") || path.endsWith("login.html")) return true;
      if (path.endsWith("/index.html") || path.endsWith("index.html")) return true; // seu index é login
      if (path.endsWith("/forgot-password.html") || path.endsWith("forgot-password.html")) return true;
      if (path.endsWith("/reset-password.html") || path.endsWith("reset-password.html")) return true;
    } catch (_) {}

    return false;
  }

  async function ensureAuthIfNeeded_() {
    const pageId = getPageId_();
    if (isPublicPage_(pageId)) return true;

    const session = PRONTIO.core && PRONTIO.core.session ? PRONTIO.core.session : null;
    if (!session || typeof session.ensureAuthenticated !== "function") {
      // fallback compat: usa auth.requireAuth se existir
      if (PRONTIO.auth && typeof PRONTIO.auth.requireAuth === "function") {
        return PRONTIO.auth.requireAuth({ redirect: true });
      }
      return true; // não bloqueia (modo dev/offline)
    }

    // ✅ Guard oficial (local + server-side)
    const ok = await session.ensureAuthenticated({ redirect: true });
    return !!ok;
  }

  async function init_() {
    // ✅ trava anti-duplo-init
    if (PRONTIO.app._inited === true) return true;
    PRONTIO.app._inited = true;

    // ✅ PASSO 2: autenticação antes de iniciar router/páginas
    try {
      const okAuth = await ensureAuthIfNeeded_();
      if (!okAuth) {
        // se redirecionou, não segue
        return false;
      }
    } catch (e) {
      warn_("Falha no guard de autenticação:", e && e.message ? e.message : String(e));
      // fallback: tenta redirecionar via auth
      try {
        if (PRONTIO.auth && typeof PRONTIO.auth.forceLogoutLocal === "function") {
          PRONTIO.auth.forceLogoutLocal((e && e.code) ? String(e.code) : "AUTH_REQUIRED", { redirect: true, clearChat: true });
        }
      } catch (_) {}
      return false;
    }

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

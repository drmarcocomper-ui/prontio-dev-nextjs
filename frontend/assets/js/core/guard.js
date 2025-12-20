// =====================================
// PRONTIO - core/guard.js
// Caminho: frontend/assets/js/core/guard.js
// =====================================
//
// ✅ Melhor prática adotada:
// - Guard oficial fica no main.js (carrega infra + evita flash).
// - Este arquivo fica como fallback/compat.
// - Se main.js já rodou, este guard não interfere.
//
// Isso preserva seu histórico e evita comportamento duplicado.
// =====================================

(function (global) {
  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});

  function isLoginPage_() {
    try {
      const body = global.document && global.document.body;
      const pageId = (body && body.dataset && (body.dataset.pageId || body.dataset.page)) || "";
      if (String(pageId).toLowerCase() === "login") return true;
    } catch (e) {}

    const path = (global.location && global.location.pathname)
      ? global.location.pathname.toLowerCase()
      : "";

    return (
      path.endsWith("/index.html") ||
      path.endsWith("index.html") ||
      path.endsWith("/login.html") ||
      path.endsWith("login.html")
    );
  }

  async function boot_() {
    // Não roda no login
    if (isLoginPage_()) return;

    // ✅ Se main.js já rodou, não faz nada
    if (PRONTIO._mainBootstrapped) return;

    if (!PRONTIO.auth || typeof PRONTIO.auth.requireAuth !== "function") {
      console.warn("[PRONTIO.guard] PRONTIO.auth.requireAuth não encontrado.");
      return;
    }

    // 1) Bloqueio básico
    const ok = PRONTIO.auth.requireAuth({ redirect: true });
    if (!ok) return;

    // 2) Validação server-side (se existir)
    try {
      if (typeof PRONTIO.auth.ensureSession === "function") {
        const okServer = await PRONTIO.auth.ensureSession({ redirect: true });
        if (!okServer) return;
      }
    } catch (e) {
      try {
        PRONTIO.auth.clearSession && PRONTIO.auth.clearSession();
        PRONTIO.auth.requireAuth({ redirect: true });
      } catch (_) {}
      return;
    }
  }

  global.document?.addEventListener("DOMContentLoaded", boot_);
})(window);

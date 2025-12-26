// frontend/assets/js/core/auth.js
// ============================================================
// PRONTIO - Auth (Front-end) - FINAL CONSOLIDADO
// ============================================================
// Ajuste extra:
// - suporta botão "Sair" do sidebar.html via data-nav-action="logout"
// ============================================================

(function (global, document) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.auth = PRONTIO.auth || {};

  const LS_KEYS = {
    TOKEN_1: "prontio.auth.token",
    TOKEN_2: "prontio_auth_token",
    USER_INFO: "medpronto_user_info", // usado pelo chat
    LAST_AUTH_REASON: "prontio.auth.lastAuthReason"
  };

  function safeGet_(k) {
    try {
      const ls = global.localStorage;
      if (!ls) return "";
      return ls.getItem(k) || "";
    } catch (_) {
      return "";
    }
  }

  function safeSet_(k, v) {
    try {
      const ls = global.localStorage;
      if (!ls) return;
      ls.setItem(k, String(v == null ? "" : v));
    } catch (_) {}
  }

  function safeRemove_(k) {
    try {
      const ls = global.localStorage;
      if (!ls) return;
      ls.removeItem(k);
    } catch (_) {}
  }

  // ------------------------------------------------------------
  // Token/session helpers
  // ------------------------------------------------------------

  function getToken() {
    return safeGet_(LS_KEYS.TOKEN_1) || safeGet_(LS_KEYS.TOKEN_2) || "";
  }

  function setToken(token) {
    const t = String(token || "").trim();
    if (!t) {
      clearToken();
      return;
    }
    safeSet_(LS_KEYS.TOKEN_1, t);
    safeSet_(LS_KEYS.TOKEN_2, t); // compat
  }

  function clearToken() {
    safeRemove_(LS_KEYS.TOKEN_1);
    safeRemove_(LS_KEYS.TOKEN_2);
  }

  function clearChatUser() {
    safeRemove_(LS_KEYS.USER_INFO);
  }

  function setLastAuthReason(code) {
    safeSet_(LS_KEYS.LAST_AUTH_REASON, String(code || "AUTH_REQUIRED"));
  }

  function getLastAuthReason() {
    return safeGet_(LS_KEYS.LAST_AUTH_REASON) || "";
  }

  // ------------------------------------------------------------
  // Logout (sempre funciona)
  // ------------------------------------------------------------

  function forceLogoutLocal(reasonCode, opts) {
    opts = opts || {};
    const redirect = opts.redirect !== false;
    const clearChat = opts.clearChat !== false; // default true

    setLastAuthReason(reasonCode || "AUTH_REQUIRED");
    clearToken();
    if (clearChat) clearChatUser();

    if (redirect) {
      try {
        global.location.href = "login.html";
      } catch (_) {}
    }
  }

  async function logout(opts) {
    opts = opts || {};
    const redirect = opts.redirect !== false;
    const clearChat = opts.clearChat !== false;

    const token = getToken();

    // Se não tem token, só limpa local.
    if (!token) {
      forceLogoutLocal("AUTH_NO_TOKEN", { redirect, clearChat });
      return { ok: true, local: true, reason: "NO_TOKEN" };
    }

    const callApiData =
      (PRONTIO.api && typeof PRONTIO.api.callApiData === "function")
        ? PRONTIO.api.callApiData
        : (typeof global.callApiData === "function" ? global.callApiData : null);

    // Sem API disponível: logout local.
    if (!callApiData) {
      forceLogoutLocal("AUTH_LOGOUT_FALLBACK", { redirect, clearChat });
      return { ok: true, local: true, reason: "NO_API" };
    }

    try {
      await callApiData({ action: "Auth_Logout", payload: { token } });
      forceLogoutLocal("AUTH_LOGOUT", { redirect, clearChat });
      return { ok: true, local: true, remote: true };
    } catch (e) {
      // Falha comum: sessão no backend não encontrada -> PERMISSION_DENIED
      forceLogoutLocal("AUTH_LOGOUT_FALLBACK", { redirect, clearChat });
      return {
        ok: true,
        local: true,
        remote: false,
        fallback: true,
        error: (e && e.message) ? e.message : String(e)
      };
    }
  }

  function requireAuth(opts) {
    opts = opts || {};
    const redirect = opts.redirect !== false;

    const token = getToken();
    if (token) return true;

    if (redirect) forceLogoutLocal("AUTH_REQUIRED", { redirect: true });
    return false;
  }

  function clearSession(opts) {
    opts = opts || {};
    const clearChat = opts.clearChat !== false;
    clearToken();
    if (clearChat) clearChatUser();
  }

  // ------------------------------------------------------------
  // Bind do botão "Sair"
  // ------------------------------------------------------------

  /**
   * Captura:
   * - [data-action="logout"]
   * - [data-logout]
   * - .js-logout
   * - [data-nav-action="logout"]   ✅ (seu sidebar.html)
   * - [data-nav-action="signout"]  ✅ (alias)
   */
  function bindLogoutButtons(root) {
    const doc = root || document;
    if (!doc) return;

    const selector =
      '[data-action="logout"], [data-logout], .js-logout, [data-nav-action="logout"], [data-nav-action="signout"]';

    const nodes = doc.querySelectorAll(selector);
    nodes.forEach((el) => {
      if (!el) return;
      if (el.getAttribute("data-logout-bound") === "1") return;
      el.setAttribute("data-logout-bound", "1");

      el.addEventListener("click", (ev) => {
        try { ev.preventDefault(); } catch (_) {}
        logout({ redirect: true, clearChat: true });
      });
    });
  }

  // ------------------------------------------------------------
  // Exports
  // ------------------------------------------------------------

  PRONTIO.auth.getToken = getToken;
  PRONTIO.auth.setToken = setToken;
  PRONTIO.auth.clearToken = clearToken;

  PRONTIO.auth.getLastAuthReason = getLastAuthReason;
  PRONTIO.auth.setLastAuthReason = setLastAuthReason;

  PRONTIO.auth.clearSession = clearSession;
  PRONTIO.auth.forceLogoutLocal = forceLogoutLocal;

  PRONTIO.auth.logout = logout;
  PRONTIO.auth.requireAuth = requireAuth;

  PRONTIO.auth.bindLogoutButtons = bindLogoutButtons;

  // Bind automático (caso auth.js seja carregado após DOM)
  try {
    if (document && document.readyState !== "loading") {
      bindLogoutButtons(document);
    } else if (document) {
      document.addEventListener("DOMContentLoaded", () => bindLogoutButtons(document));
    }
  } catch (_) {}

})(window, document);

// frontend/assets/js/core/auth.js
// ============================================================
// PRONTIO - Auth (Front-end) - CONSOLIDADO (LOGIN + LOGOUT + BIND)
// ============================================================
// ✅ Suporta o login page-* (Auth_Login / Auth_Me)
// ✅ Suporta logout resiliente (fallback local mesmo com API quebrada)
// ✅ Suporta bind do botão "Sair" do seu sidebar (data-nav-action="logout")
// ✅ Mantém compat com chaves antigas de token
// ============================================================

(function (global, document) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.auth = PRONTIO.auth || {};

  const LS_KEYS = {
    TOKEN_1: "prontio.auth.token",
    TOKEN_2: "prontio_auth_token",
    LAST_AUTH_REASON: "prontio.auth.lastAuthReason",
    CHAT_USER: "medpronto_user_info" // usado pelo widget chat (opcional limpar no logout)
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
  // Token helpers
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
    // grava nas duas por compat
    safeSet_(LS_KEYS.TOKEN_1, t);
    safeSet_(LS_KEYS.TOKEN_2, t);
  }

  function clearToken() {
    safeRemove_(LS_KEYS.TOKEN_1);
    safeRemove_(LS_KEYS.TOKEN_2);
  }

  function setLastAuthReason(code) {
    safeSet_(LS_KEYS.LAST_AUTH_REASON, String(code || "AUTH_REQUIRED"));
  }

  function getLastAuthReason() {
    return safeGet_(LS_KEYS.LAST_AUTH_REASON) || "";
  }

  // ------------------------------------------------------------
  // API accessor (callApiData)
  // ------------------------------------------------------------

  function getCallApiData_() {
    if (PRONTIO.api && typeof PRONTIO.api.callApiData === "function") return PRONTIO.api.callApiData;
    if (typeof global.callApiData === "function") return global.callApiData;
    return null;
  }

  // ------------------------------------------------------------
  // Auth actions (LOGIN / ME)
  // ------------------------------------------------------------

  /**
   * Login:
   * payload: { login, senha }
   * retorno esperado do backend: { token, user, expiresIn }
   */
  async function login(args) {
    args = args || {};
    const loginStr = String(args.login || "").trim();
    const senhaStr = String(args.senha || "").trim();

    if (!loginStr || !senhaStr) {
      const err = new Error("Informe login e senha.");
      err.code = "VALIDATION_ERROR";
      err.details = { fields: ["login", "senha"] };
      throw err;
    }

    const callApiData = getCallApiData_();
    if (!callApiData) {
      const err = new Error("API não disponível (callApiData indefinido).");
      err.code = "CLIENT_NO_API";
      throw err;
    }

    const data = await callApiData({
      action: "Auth_Login",
      payload: { login: loginStr, senha: senhaStr }
    });

    if (!data || !data.token) {
      const err = new Error("Resposta inválida do login (token ausente).");
      err.code = "CLIENT_INVALID_LOGIN_RESPONSE";
      err.details = { data: data || null };
      throw err;
    }

    setToken(data.token);
    return data;
  }

  /**
   * Me:
   * - valida token atual no backend
   */
  async function me() {
    const token = getToken();
    if (!token) {
      const err = new Error("Token ausente.");
      err.code = "AUTH_REQUIRED";
      err.details = { field: "token" };
      throw err;
    }

    const callApiData = getCallApiData_();
    if (!callApiData) {
      const err = new Error("API não disponível (callApiData indefinido).");
      err.code = "CLIENT_NO_API";
      throw err;
    }

    return await callApiData({
      action: "Auth_Me",
      payload: { token }
    });
  }

  // ------------------------------------------------------------
  // Logout resiliente (sempre funciona)
  // ------------------------------------------------------------

  function forceLogoutLocal(reasonCode, opts) {
    opts = opts || {};
    const redirect = opts.redirect !== false;
    const clearChat = opts.clearChat !== false;

    setLastAuthReason(reasonCode || "AUTH_REQUIRED");
    clearToken();
    if (clearChat) safeRemove_(LS_KEYS.CHAT_USER);

    if (redirect) {
      try { global.location.href = "login.html"; } catch (_) {}
    }
  }

  async function logout(opts) {
    opts = opts || {};
    const redirect = opts.redirect !== false;
    const clearChat = opts.clearChat !== false;

    const token = getToken();
    if (!token) {
      forceLogoutLocal("AUTH_NO_TOKEN", { redirect, clearChat });
      return { ok: true, local: true, reason: "NO_TOKEN" };
    }

    const callApiData = getCallApiData_();
    if (!callApiData) {
      forceLogoutLocal("AUTH_LOGOUT_FALLBACK", { redirect, clearChat });
      return { ok: true, local: true, reason: "NO_API" };
    }

    try {
      await callApiData({ action: "Auth_Logout", payload: { token } });
      forceLogoutLocal("AUTH_LOGOUT", { redirect, clearChat });
      return { ok: true, local: true, remote: true };
    } catch (e) {
      // se backend estiver com PERMISSION_DENIED ou sessão perdida: ainda assim desloga local
      forceLogoutLocal("AUTH_LOGOUT_FALLBACK", { redirect, clearChat });
      return { ok: true, local: true, remote: false, fallback: true };
    }
  }

  function clearSession(opts) {
    opts = opts || {};
    const clearChat = opts.clearChat !== false;
    clearToken();
    if (clearChat) safeRemove_(LS_KEYS.CHAT_USER);
  }

  function requireAuth(opts) {
    opts = opts || {};
    const redirect = opts.redirect !== false;
    const token = getToken();
    if (token) return true;
    if (redirect) forceLogoutLocal("AUTH_REQUIRED", { redirect: true });
    return false;
  }

  // ------------------------------------------------------------
  // Bind botão "Sair"
  // ------------------------------------------------------------

  /**
   * Captura:
   * - [data-action="logout"]
   * - [data-logout]
   * - .js-logout
   * - [data-nav-action="logout"]   ✅ seu sidebar.html
   * - [data-nav-action="signout"]  ✅ alias
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
  // Exports (aliases para compat com page-login.js antigo)
  // ------------------------------------------------------------

  PRONTIO.auth.getToken = getToken;
  PRONTIO.auth.setToken = setToken;
  PRONTIO.auth.clearToken = clearToken;

  PRONTIO.auth.getLastAuthReason = getLastAuthReason;
  PRONTIO.auth.setLastAuthReason = setLastAuthReason;

  PRONTIO.auth.login = login;
  PRONTIO.auth.signIn = login;        // alias comum
  PRONTIO.auth.doLogin = login;       // alias comum
  PRONTIO.auth.me = me;

  PRONTIO.auth.logout = logout;
  PRONTIO.auth.forceLogoutLocal = forceLogoutLocal;
  PRONTIO.auth.clearSession = clearSession;
  PRONTIO.auth.requireAuth = requireAuth;

  PRONTIO.auth.bindLogoutButtons = bindLogoutButtons;

  // Bind automático após DOM
  try {
    if (document && document.readyState !== "loading") {
      bindLogoutButtons(document);
    } else if (document) {
      document.addEventListener("DOMContentLoaded", () => bindLogoutButtons(document));
    }
  } catch (_) {}

})(window, document);

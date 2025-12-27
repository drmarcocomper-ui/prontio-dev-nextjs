/**
 * PRONTIO - widget-topbar.js
 *
 * - versiona SOMENTE o HTML do partial (fetch)
 */

(function (global, document) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.widgets = PRONTIO.widgets || {};
  PRONTIO.widgets.topbar = PRONTIO.widgets.topbar || {};

  const CHAT_CSS_HREF = "assets/css/components/chat-topbar.css";

  // Bump quando mudar o HTML do partial da topbar
  const PARTIAL_VERSION = "1.0.9";
  const PARTIAL_TOPBAR_PATH = "partials/topbar.html?v=" + encodeURIComponent(PARTIAL_VERSION);

  // ✅ Melhor: reaproveita action já registrada no Registry.gs
  // (se Auth_Me já retorna NomeCompleto/Perfil, não precisa criar Usuarios_GetMe)
  const ACTION_GET_ME = "Auth_Me";

  function hasChatEnabled_() {
    try {
      return (document.body && document.body.getAttribute("data-has-chat")) === "true";
    } catch (e) {
      return false;
    }
  }

  function getContext_() {
    try {
      return (
        (document.body && document.body.getAttribute("data-context")) ||
        (document.body && document.body.getAttribute("data-page-id")) ||
        "app"
      );
    } catch (e) {
      return "app";
    }
  }

  function getPatientIdIfAny_() {
    const el = document.getElementById("prontuario-paciente-id");
    if (!el) return null;
    const txt = String(el.textContent || "").trim();
    if (!txt || txt === "—") return null;
    return txt;
  }

  async function fetchPartial_(path) {
    let res = await fetch(path, { cache: "default" });
    if (!res.ok) res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error("Falha ao carregar partial: " + path + " (HTTP " + res.status + ")");
    return await res.text();
  }

  function fillTopbarTexts_() {
    const title =
      (document.body && (document.body.getAttribute("data-tag") || document.body.getAttribute("data-page-id"))) ||
      "PRONTIO";
    const subtitle = (document.body && document.body.getAttribute("data-subtitle")) || "";
    const context = (document.body && document.body.getAttribute("data-context")) || "";

    const titleEl = document.getElementById("topbar-title-text");
    const tagEl = document.getElementById("topbar-tag");
    const subtitleEl = document.getElementById("topbar-subtitle");
    const ctxEl = document.getElementById("topbar-meta-context");
    const dateEl = document.getElementById("topbar-meta-date");

    if (titleEl) titleEl.textContent = String(title);
    if (tagEl) tagEl.textContent = String(title);
    if (subtitleEl) subtitleEl.textContent = String(subtitle);
    if (ctxEl) ctxEl.textContent = String(context);

    if (dateEl) {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yyyy = String(now.getFullYear());
      dateEl.textContent = dd + "/" + mm + "/" + yyyy;
    }
  }

  function rebindThemeToggle_() {
    try {
      if (PRONTIO.theme && typeof PRONTIO.theme.init === "function") return PRONTIO.theme.init();
      if (PRONTIO.ui && typeof PRONTIO.ui.initTheme === "function") return PRONTIO.ui.initTheme();
      if (typeof global.initTheme === "function") return global.initTheme();
    } catch (e) {
      console.error("[PRONTIO.topbar] Erro ao rebind do tema:", e);
    }
  }

  function ensureChatCss_() {
    const id = "prontio-chat-css";
    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = CHAT_CSS_HREF;
    document.head.appendChild(link);
  }

  function getChatSlot_() {
    return document.getElementById("topbar-chat-slot");
  }

  function injectChatMarkup_() {
    const slot = getChatSlot_();
    if (!slot) return false;
    if (slot.getAttribute("data-chat-injected") === "1") return true;

    slot.innerHTML = `
      <div class="chat-topbar">
        <button id="chatTopBtn" class="chat-topbar-btn" type="button"
          aria-haspopup="true" aria-expanded="false" title="Chat">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2ZM6 9h12v2H6V9Zm8 5H6v-2h8v2Zm4-6H6V6h12v2Z"></path>
          </svg>
          <span class="chat-topbar-badge" id="chatUnreadBadge" hidden>0</span>
        </button>

        <div id="chatDropdown" class="chat-dropdown" hidden>
          <div class="chat-dropdown-header">
            <div class="chat-dropdown-title">Minhas Conversas</div>
            <button id="chatCreateGroupBtn" class="chat-dropdown-action" type="button">Criar grupo</button>
          </div>

          <div class="chat-dropdown-search">
            <input id="chatSearchInput" type="text" placeholder="Buscar contato" autocomplete="off"/>
          </div>

          <div class="chat-dropdown-section">
            <div class="chat-dropdown-section-title">Conversas iniciadas</div>
            <div id="chatConversationList" class="chat-conversation-list"></div>
          </div>
        </div>
      </div>
    `;

    slot.setAttribute("data-chat-injected", "1");
    return true;
  }

  async function initChatIfEnabled_() {
    if (!hasChatEnabled_()) return;

    ensureChatCss_();
    if (!injectChatMarkup_()) return;

    if (!global.ChatUI || typeof global.ChatUI.init !== "function") {
      console.warn("[PRONTIO.topbar] ChatUI não encontrado. Verifique se ui/chat-ui.js está no main.js.");
      return;
    }

    global.ChatUI.init({
      context: getContext_(),
      patientId: getPatientIdIfAny_(),
      currentUserId: (function () {
        try { return localStorage.getItem("PRONTIO_CURRENT_USER_ID") || null; } catch (e) { return null; }
      })()
    });
  }

  async function loadLoggedUser_() {
    const nameEl = document.getElementById("topbar-user-name");
    const roleEl = document.getElementById("topbar-user-role");
    if (!nameEl || !roleEl) return;

    // 1) PRONTIO.auth.getCurrentUser() (se existir)
    try {
      if (PRONTIO.auth && typeof PRONTIO.auth.getCurrentUser === "function") {
        const u = PRONTIO.auth.getCurrentUser();
        const nome = u && (u.NomeCompleto || u.nomeCompleto || u.nome);
        const perfil = u && (u.Perfil || u.perfil || u.role);

        if (nome) nameEl.textContent = String(nome);
        if (perfil) roleEl.textContent = String(perfil);

        if (nome || perfil) return;
      }
    } catch (e) {}

    // 2) localStorage (se o login já salva)
    try {
      const cachedName =
        localStorage.getItem("PRONTIO_CURRENT_USER_NAME") ||
        localStorage.getItem("PRONTIO_USER_NAME") ||
        "";
      const cachedRole =
        localStorage.getItem("PRONTIO_CURRENT_USER_ROLE") ||
        localStorage.getItem("PRONTIO_CURRENT_USER_PROFILE") ||
        localStorage.getItem("PRONTIO_USER_ROLE") ||
        "";

      if (cachedName) nameEl.textContent = cachedName;
      if (cachedRole) roleEl.textContent = cachedRole;

      if (cachedName || cachedRole) return;
    } catch (e) {}

    // 3) API (Auth_Me já existe no registry)
    try {
      if (!PRONTIO.api || typeof PRONTIO.api.callApiData !== "function") return;

      const data = await PRONTIO.api.callApiData({ action: ACTION_GET_ME, payload: {} });
      if (!data) return;

      // tolerante a formatos: {NomeCompleto, Perfil} ou {user:{...}}
      const u = data.user || data.usuario || data || {};
      const nome = u.NomeCompleto || u.nomeCompleto || u.nome || "";
      const perfil = u.Perfil || u.perfil || u.role || "";

      if (nome) nameEl.textContent = String(nome);
      if (perfil) roleEl.textContent = String(perfil);

      try {
        if (nome) localStorage.setItem("PRONTIO_CURRENT_USER_NAME", String(nome));
        if (perfil) localStorage.setItem("PRONTIO_CURRENT_USER_ROLE", String(perfil));
      } catch (e) {}
    } catch (e) {}
  }

  PRONTIO.widgets.topbar.init = async function initTopbar() {
    try {
      const mount = document.getElementById("topbarMount");
      if (!mount) return;

      if (mount.getAttribute("data-mounted") === "1") {
        fillTopbarTexts_();
        rebindThemeToggle_();
        await loadLoggedUser_();
        await initChatIfEnabled_();
        return;
      }

      const html = await fetchPartial_(PARTIAL_TOPBAR_PATH);
      mount.innerHTML = html;
      mount.setAttribute("data-mounted", "1");
      mount.setAttribute("data-mounted-from", PARTIAL_TOPBAR_PATH);

      fillTopbarTexts_();
      rebindThemeToggle_();
      await loadLoggedUser_();
      await initChatIfEnabled_();
    } catch (err) {
      console.error("[PRONTIO.topbar] Erro ao inicializar topbar:", err);
    }
  };
})(window, document);

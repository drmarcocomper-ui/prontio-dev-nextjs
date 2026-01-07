// =====================================
// PRONTIO - core/ui-core.js
// Utilidades genéricas de UI
// =====================================

(function (global, document) {
  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  const core = (PRONTIO.core = PRONTIO.core || {});
  const uiCore = (core.uiCore = core.uiCore || {});
  const auth = PRONTIO.auth || {};
  const dom = (core.dom = core.dom || {});

  const qs =
    dom.qs ||
    function (selector, root) {
      return (root || document).querySelector(selector);
    };

  // -----------------------------------------
  // Loading global
  // -----------------------------------------

  function ensureLoadingElement_() {
    let el = document.getElementById("prontio-global-loading");
    if (!el) {
      el = document.createElement("div");
      el.id = "prontio-global-loading";
      el.className = "prontio-global-loading hidden";
      el.innerHTML = '<div class="spinner"></div><div class="label">Carregando...</div>';
      document.body.appendChild(el);
    }
    return el;
  }

  function showLoading(message) {
    const el = ensureLoadingElement_();
    const label = el.querySelector(".label");
    if (label && message) {
      label.textContent = message;
    }
    el.classList.remove("hidden");
  }

  function hideLoading() {
    const el = document.getElementById("prontio-global-loading");
    if (!el) return;
    el.classList.add("hidden");
  }

  // -----------------------------------------
  // Sidebar / nome do usuário / ano
  // -----------------------------------------

  function _safeGetLs_(key) {
    try {
      return global.localStorage ? (global.localStorage.getItem(key) || "") : "";
    } catch (_) {
      return "";
    }
  }

  function _deriveUserName_(userObj) {
    if (!userObj || typeof userObj !== "object") return "";
    return String(
      userObj.nomeCompleto ||
      userObj.NomeCompleto ||
      userObj.nome ||
      userObj.Nome ||
      userObj.userName ||
      ""
    ).trim();
  }

  function updateSidebarUserName() {
    const el = document.getElementById("sidebarUserName");
    if (!el) return;

    // ✅ Correção: não depende de auth.getUserName (não existe no auth.js atual)
    let nome = "";

    try {
      if (auth && typeof auth.getCurrentUser === "function") {
        const u = auth.getCurrentUser();
        nome = _deriveUserName_(u);
      }
    } catch (_) {}

    // fallback: cache rápido gravado pelo auth.js (topbar cache)
    if (!nome) nome = _safeGetLs_("PRONTIO_CURRENT_USER_NAME");

    el.textContent = nome || "Usuário";
  }

  function updateSidebarYear() {
    const el = document.getElementById("sidebarYear");
    if (!el) return;
    el.textContent = String(new Date().getFullYear());
  }

  // -----------------------------------------
  // Títulos de página (topbar)
  // -----------------------------------------
  function setTopbarTitle(title, subtitle) {
    const titleEl = qs("#topbar-title-text") || qs(".topbar-title-main h1");
    const subtitleEl = qs("#topbar-subtitle") || qs(".topbar-subtitle");

    if (titleEl && title) {
      titleEl.textContent = title;
    }
    if (subtitleEl && typeof subtitle !== "undefined") {
      subtitleEl.textContent = subtitle || "";
    }
  }

  // -----------------------------------------
  // Inicialização leve de UI global
  // -----------------------------------------
  function initGlobalUI() {
    updateSidebarUserName();
    updateSidebarYear();
  }

  // -----------------------------------------
  // Exposição pública
  // -----------------------------------------
  uiCore.showLoading = showLoading;
  uiCore.hideLoading = hideLoading;
  uiCore.updateSidebarUserName = updateSidebarUserName;
  uiCore.updateSidebarYear = updateSidebarYear;
  uiCore.setTopbarTitle = setTopbarTitle;
  uiCore.initGlobalUI = initGlobalUI;
})(window, document);

// frontend/assets/js/ui/responsive-shell.js
// ============================================================
// PRONTIO - Shell Responsivo (Profissional) [AJUSTADO]
// Objetivo agora:
// - 1 único toggle (SÓ no TOPBAR)
// - Nada de botão fixo extra (evita duplicidade visual)
// - Overlay + ESC + clique fora
// - Se existir toggle antigo no topbar, ele é "adotado" (estiliza e usa)
// - Se existirem múltiplos, mantém 1 e remove os outros
// ============================================================

(function (global, document) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.ui = PRONTIO.ui || {};
  PRONTIO.ui.responsiveShell = PRONTIO.ui.responsiveShell || {};

  const BODY_OPEN_CLASS = "prontio-sidebar-open";
  const OVERLAY_ID = "prontioSidebarOverlay";
  const TOGGLE_BTN_ID = "prontioSidebarToggleBtn";

  function qs(sel, root) {
    try { return (root || document).querySelector(sel); } catch (_) { return null; }
  }
  function qsa(sel, root) {
    try { return Array.from((root || document).querySelectorAll(sel)); } catch (_) { return []; }
  }

  function findTopbar_() {
    return qs(".topbar") || qs("#topbarMount .topbar") || qs("#topbarMount");
  }

  function ensureOverlay_() {
    let ov = document.getElementById(OVERLAY_ID);
    if (ov) return ov;

    ov = document.createElement("div");
    ov.id = OVERLAY_ID;
    ov.className = "prontio-sidebar-overlay";
    ov.setAttribute("aria-hidden", "true");
    ov.addEventListener("click", function () { closeSidebar_(); });

    document.body.appendChild(ov);
    return ov;
  }

  function isOpen_() {
    return document.body.classList.contains(BODY_OPEN_CLASS);
  }

  function openSidebar_() {
    document.body.classList.add(BODY_OPEN_CLASS);
    ensureOverlay_().setAttribute("aria-hidden", "false");
    syncToggleAria_();
  }

  function closeSidebar_() {
    document.body.classList.remove(BODY_OPEN_CLASS);
    const ov = document.getElementById(OVERLAY_ID);
    if (ov) ov.setAttribute("aria-hidden", "true");
    syncToggleAria_();
  }

  function toggleSidebar_() {
    if (isOpen_()) closeSidebar_();
    else openSidebar_();
  }

  function syncToggleAria_() {
    const btn = document.getElementById(TOGGLE_BTN_ID);
    if (!btn) return;
    btn.setAttribute("aria-expanded", isOpen_() ? "true" : "false");
  }

  function wireToggle_(btn) {
    if (!btn) return;
    if (btn.getAttribute("data-prontio-toggle-bound") === "1") return;

    btn.setAttribute("data-prontio-toggle-bound", "1");
    btn.addEventListener("click", function (ev) {
      try { ev.preventDefault(); } catch (_) {}
      toggleSidebar_();
    });

    if (!btn.getAttribute("aria-label")) btn.setAttribute("aria-label", "Abrir menu");
    btn.setAttribute("aria-expanded", isOpen_() ? "true" : "false");
  }

  // Procura toggles antigos no TOPBAR (para adotar e evitar duplicidade)
  function findLegacyTopbarToggles_(topbar) {
    const root = topbar || findTopbar_();
    if (!root) return [];

    // Seletores tolerantes
    const candidates = []
      .concat(qsa('[data-nav-action="toggle-sidebar"]', root))
      .concat(qsa('[data-action="toggle-sidebar"]', root))
      .concat(qsa(".js-sidebar-toggle", root))
      .concat(qsa(".sidebar-toggle", root))
      .concat(qsa('button[aria-label*="menu" i]', root));

    // Remove duplicados por referência
    return Array.from(new Set(candidates)).filter(Boolean);
  }

  function adoptOrCreateTopbarToggle_() {
    const topbar = findTopbar_();
    if (!topbar) return false;

    // 1) Se já existe nosso botão, só garante que está ok
    let btn = document.getElementById(TOGGLE_BTN_ID);
    if (btn) {
      wireToggle_(btn);
      return true;
    }

    // 2) Se existe um “toggle antigo” no topbar, adota 1 e remove outros
    const legacy = findLegacyTopbarToggles_(topbar);

    if (legacy.length) {
      const keep = legacy[0];

      // Remove os demais (causavam a confusão visual)
      for (let i = 1; i < legacy.length; i++) {
        try { legacy[i].remove(); } catch (_) {}
      }

      // Adota o primeiro: padroniza id/classe/ícone
      try { keep.id = TOGGLE_BTN_ID; } catch (_) {}
      try { keep.classList.add("prontio-sidebar-toggle"); } catch (_) {}

      // Se não tem ícone claro, aplica o nosso
      try {
        const hasIcon = (keep.textContent || "").trim().length > 0;
        if (!hasIcon) keep.innerHTML = '<span class="prontio-sidebar-toggle__icon" aria-hidden="true">☰</span>';
      } catch (_) {}

      wireToggle_(keep);
      return true;
    }

    // 3) Se não há toggle antigo, cria um no começo do topbar
    const container =
      qs(".topbar__left", topbar) ||
      qs(".topbar-left", topbar) ||
      topbar;

    btn = document.createElement("button");
    btn.id = TOGGLE_BTN_ID;
    btn.type = "button";
    btn.className = "prontio-sidebar-toggle";
    btn.setAttribute("aria-label", "Abrir menu");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<span class="prontio-sidebar-toggle__icon" aria-hidden="true">☰</span>';

    wireToggle_(btn);

    try { container.insertBefore(btn, container.firstChild); }
    catch (_) { try { topbar.insertBefore(btn, topbar.firstChild); } catch (_) {} }

    return true;
  }

  function bindCloseOnEsc_() {
    if (document.body.getAttribute("data-prontio-esc-bound") === "1") return;
    document.body.setAttribute("data-prontio-esc-bound", "1");

    document.addEventListener("keydown", function (ev) {
      if (!ev) return;
      if (ev.key === "Escape" && isOpen_()) closeSidebar_();
    });
  }

  function init() {
    if (PRONTIO.ui.responsiveShell._inited === true) return;
    PRONTIO.ui.responsiveShell._inited = true;

    ensureOverlay_();
    bindCloseOnEsc_();

    // Topbar/sidebar carregam async: tenta algumas vezes
    let tries = 0;
    const timer = global.setInterval(function () {
      tries += 1;
      const ok = adoptOrCreateTopbarToggle_();
      if (ok || tries >= 16) global.clearInterval(timer);
    }, 250);
  }

  PRONTIO.ui.responsiveShell.init = init;
  PRONTIO.ui.responsiveShell.open = openSidebar_;
  PRONTIO.ui.responsiveShell.close = closeSidebar_;
  PRONTIO.ui.responsiveShell.toggle = toggleSidebar_;

})(window, document);

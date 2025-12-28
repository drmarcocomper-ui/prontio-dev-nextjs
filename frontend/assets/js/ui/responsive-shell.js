// frontend/assets/js/ui/responsive-shell.js
// ============================================================
// PRONTIO - Shell Responsivo (Profissional) [UNIFICADO]
// ============================================================
// Aqui NÃO criamos um segundo sistema de sidebar.
// Apenas garantimos que existe 1 botão no TOPBAR com:
//   - data-sidebar-toggle (usado pelo widget-sidebar.js via delegation)
//   - e uma classe visual padrão
//
// O drawer abre/fecha pelo sistema existente:
//   body.sidebar-open + .sidebar-backdrop + widget-sidebar.js
// ============================================================

(function (global, document) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.ui = PRONTIO.ui || {};
  PRONTIO.ui.responsiveShell = PRONTIO.ui.responsiveShell || {};

  const BTN_ID = "prontioTopbarDrawerToggle";

  function qs(sel, root) {
    try { return (root || document).querySelector(sel); } catch (_) { return null; }
  }

  function findTopbar_() {
    return qs(".topbar") || qs("#topbarMount .topbar") || qs("#topbarMount");
  }

  function findExistingToggleInTopbar_(topbar) {
    if (!topbar) return null;

    // Se já existir algo que o widget-sidebar.js reconhece, adotamos.
    return (
      qs("#" + BTN_ID, topbar) ||
      qs("[data-sidebar-toggle]", topbar) ||
      qs(".js-toggle-sidebar", topbar)
    );
  }

  function ensureTopbarToggle_() {
    const topbar = findTopbar_();
    if (!topbar) return false;

    const existing = findExistingToggleInTopbar_(topbar);
    if (existing) {
      // Padroniza classes (sem quebrar nada)
      try { existing.id = existing.id || BTN_ID; } catch (_) {}
      try { existing.classList.add("prontio-topbar-drawer-toggle"); } catch (_) {}

      // Garante atributo que o widget-sidebar.js usa
      if (!existing.hasAttribute("data-sidebar-toggle")) {
        existing.setAttribute("data-sidebar-toggle", "1");
      }
      existing.classList.add("js-toggle-sidebar");

      // Se estiver vazio, coloca ícone
      try {
        const hasContent = (existing.textContent || "").trim().length > 0 || (existing.innerHTML || "").trim().length > 0;
        if (!hasContent) {
          existing.innerHTML = '<span class="prontio-topbar-drawer-toggle__icon" aria-hidden="true">☰</span>';
        }
      } catch (_) {}

      return true;
    }

    // Cria botão novo no início do topbar
    const container =
      qs(".topbar__left", topbar) ||
      qs(".topbar-left", topbar) ||
      topbar;

    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.type = "button";
    btn.className = "prontio-topbar-drawer-toggle js-toggle-sidebar";
    btn.setAttribute("aria-label", "Abrir menu");
    btn.setAttribute("data-sidebar-toggle", "1");
    btn.innerHTML = '<span class="prontio-topbar-drawer-toggle__icon" aria-hidden="true">☰</span>';

    // Não precisamos adicionar click handler:
    // o widget-sidebar.js já faz event delegation em [data-sidebar-toggle] / .js-toggle-sidebar
    try { container.insertBefore(btn, container.firstChild); }
    catch (_) { try { topbar.insertBefore(btn, topbar.firstChild); } catch (_) {} }

    return true;
  }

  function init() {
    if (PRONTIO.ui.responsiveShell._inited === true) return;
    PRONTIO.ui.responsiveShell._inited = true;

    // Topbar costuma carregar async: tenta algumas vezes e para
    let tries = 0;
    const timer = global.setInterval(function () {
      tries += 1;
      const ok = ensureTopbarToggle_();
      if (ok || tries >= 18) global.clearInterval(timer);
    }, 250);
  }

  PRONTIO.ui.responsiveShell.init = init;

})(window, document);

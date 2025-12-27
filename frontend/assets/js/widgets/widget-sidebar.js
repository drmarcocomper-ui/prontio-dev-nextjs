// =====================================
// PRONTIO - ui/sidebar.js
// Controle da sidebar (menu lateral) do PRONTIO.
//
// Desktop:
//  - Sempre inicia com modo "compacto" restaurado do localStorage.
//  - Botão .js-toggle-compact alterna body.sidebar-compact (recolhe/expande).
//
// Mobile (max-width: 900px):
//  - Sidebar funciona como drawer (off-canvas), controlado por body.sidebar-open.
//  - Botão de menu (topbar) abre/fecha o drawer.
//  - Botão .js-toggle-compact também atua como toggle do drawer em mobile.
//  - Clicar no backdrop ou em um link do menu fecha o drawer.
//
// Em todas as larguras:
//  - Destaca o link ativo com base em data-page-id do <body>.
//  - PRONTUÁRIO só aparece quando body.dataset.hasProntuario === "true".
//
// Observação:
//  - Tema claro/escuro é responsabilidade da TOPBAR (não desta sidebar).
//
// ✅ Atualização (profissional):
//  - Event delegation para toggle do drawer via:
//      [data-sidebar-toggle] OU .js-toggle-sidebar
//    (independe da ordem de montagem da topbar).
// =====================================

(function (global, document) {
  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.widgets = PRONTIO.widgets || {};
  PRONTIO.ui = PRONTIO.ui || {};

  const STORAGE_KEY_COMPACT = "prontio.sidebar.compact";
  const MOBILE_MEDIA = "(max-width: 900px)";
  const DOC_FLAG_DELEGATION_BOUND = "prontioSidebarDelegationBound";

  function getSidebarElement() {
    return document.getElementById("sidebar");
  }

  function isMobile_() {
    return !!(global.matchMedia && global.matchMedia(MOBILE_MEDIA).matches);
  }

  /* -------- helpers de estado compacto (desktop) -------- */

  /**
   * Aplica estado compacto / expandido usando APENAS body.sidebar-compact.
   * @param {boolean} isCompactFlag
   */
  function setCompact(isCompactFlag) {
    const body = document.body;
    if (!body) return;

    if (isCompactFlag) {
      body.classList.add("sidebar-compact");
    } else {
      body.classList.remove("sidebar-compact");
    }
  }

  function isCompact() {
    const body = document.body;
    if (!body) return false;
    return body.classList.contains("sidebar-compact");
  }

  /**
   * Ajusta aria-pressed no botão de toggle compacto.
   * @param {HTMLElement} btn
   * @param {boolean} isCompactFlag
   */
  function syncToggleButtonAria(btn, isCompactFlag) {
    if (!btn) return;
    btn.setAttribute("aria-pressed", isCompactFlag ? "true" : "false");
  }

  function loadCompactFromStorage() {
    try {
      if (!global.localStorage) return false;
      const stored = global.localStorage.getItem(STORAGE_KEY_COMPACT);
      return stored === "1";
    } catch (e) {
      return false;
    }
  }

  function saveCompactToStorage(isCompactFlag) {
    try {
      if (!global.localStorage) return;
      global.localStorage.setItem(STORAGE_KEY_COMPACT, isCompactFlag ? "1" : "0");
    } catch (e) {
      // ambiente sem localStorage -> ignorar
    }
  }

  /* -------- helpers de drawer (mobile) -------- */

  function openDrawer() {
    const body = document.body;
    if (!body) return;
    body.classList.add("sidebar-open");
  }

  function closeDrawer() {
    const body = document.body;
    if (!body) return;
    body.classList.remove("sidebar-open");
  }

  function toggleDrawer() {
    const body = document.body;
    if (!body) return;
    const open = body.classList.contains("sidebar-open");
    if (open) closeDrawer();
    else openDrawer();
  }

  /* -------- destacar link ativo -------- */

  /**
   * Destaca o link ativo conforme data-page-id do <body>.
   * Usa classe .active e aria-current="page".
   *
   * ✅ Mantém compatibilidade também com CSS que aceita:
   *  - .is-active
   *  - [data-active="true"]
   */
  function highlightActiveNavLink(sidebar) {
    if (!sidebar || !document.body) return;

    const pageId = document.body.dataset.pageId || "";
    if (!pageId) return;

    const links = sidebar.querySelectorAll(".nav-link[data-page-id]");
    links.forEach(function (link) {
      const linkPageId = link.getAttribute("data-page-id") || "";
      const isActiveLink = linkPageId === pageId;

      if (isActiveLink) {
        link.classList.add("active");
        link.classList.add("is-active");
        link.setAttribute("data-active", "true");
        if (!link.hasAttribute("aria-current")) {
          link.setAttribute("aria-current", "page");
        }
      } else {
        link.classList.remove("active");
        link.classList.remove("is-active");
        link.removeAttribute("data-active");
        if (link.getAttribute("aria-current") === "page") {
          link.removeAttribute("aria-current");
        }
      }
    });
  }

  /* -------- visibilidade do PRONTUÁRIO -------- */

  /**
   * Mostra/oculta o item PRONTUÁRIO conforme body.dataset.hasProntuario.
   * Esperado:
   *   <body data-has-prontuario="true"> quando um paciente estiver aberto.
   */
  function updateProntuarioVisibility(sidebar) {
    if (!sidebar || !document.body) return;

    const link = sidebar.querySelector("[data-nav-section='prontuario']");
    if (!link) return;

    const hasProntuario =
      document.body.dataset && document.body.dataset.hasProntuario === "true";

    link.style.display = hasProntuario ? "" : "none";
  }

  /* -------- tratar ações especiais (Sistema) -------- */

  function setupSystemActions(sidebar) {
    if (!sidebar) return;

    // Ações do grupo SISTEMA que tenham data-nav-target
    const systemButtons = sidebar.querySelectorAll(".sidebar-group [data-nav-target]");

    systemButtons.forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        const target = btn.getAttribute("data-nav-target");
        if (!target) return;

        // Se existir um handler global, usamos
        if (PRONTIO.ui && typeof PRONTIO.ui.handleSystemNav === "function") {
          PRONTIO.ui.handleSystemNav(target);
        } else {
          // Fallback padrão:
          // - "tema" aciona o botão de tema da TOPBAR
          if (target === "tema") {
            event.preventDefault();
            const themeBtn = document.getElementById("btn-theme-toggle");
            if (themeBtn && typeof themeBtn.click === "function") {
              themeBtn.click();
            }
          }
          // "sobre" é via data-modal-open + bindTriggers (fora daqui)
        }

        if (isMobile_()) closeDrawer();
      });
    });

    // Ação "Sair"
    const logoutBtn = sidebar.querySelector("[data-nav-action='logout']");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        if (PRONTIO.ui && typeof PRONTIO.ui.handleLogout === "function") {
          PRONTIO.ui.handleLogout();
        } else {
          const ok = global.confirm("Deseja realmente sair do PRONTIO?");
          if (ok) {
            global.location.href = "index.html";
          }
        }

        if (isMobile_()) closeDrawer();
      });
    }
  }

  /* -------- event delegation: toggle sidebar (topbar) -------- */

  function bindGlobalSidebarToggleDelegation_() {
    if (!document || !document.documentElement) return;

    // Idempotência global: 1 listener por página
    if (document.documentElement.dataset[DOC_FLAG_DELEGATION_BOUND] === "1") return;
    document.documentElement.dataset[DOC_FLAG_DELEGATION_BOUND] = "1";

    document.addEventListener("click", function (ev) {
      // Captura clique em botões/elementos que declarem intenção de abrir menu
      const target = ev.target;

      // Compat: botão com data-sidebar-toggle (recomendado)
      // Compat: classe .js-toggle-sidebar (legado)
      const trigger =
        target && target.closest
          ? target.closest("[data-sidebar-toggle], .js-toggle-sidebar")
          : null;

      if (!trigger) return;

      // Só faz sentido no comportamento de drawer em mobile.
      if (!isMobile_()) return;

      ev.preventDefault();
      toggleDrawer();
    });
  }

  /* -------- bloquear itens "Em breve" (defensivo) -------- */

  function setupSoonLinks(sidebar) {
    if (!sidebar) return;

    const soonLinks = sidebar.querySelectorAll(
      ".nav-link[data-soon='true'], .nav-link[aria-disabled='true']"
    );

    soonLinks.forEach(function (el) {
      el.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
      });
    });
  }

  // -----------------------------------------------------
  // Inicializador público (idempotente)
  // -----------------------------------------------------

  function initSidebar() {
    const sidebar = getSidebarElement();
    if (!sidebar) {
      console.warn("PRONTIO.sidebar: #sidebar não encontrado.");
      return;
    }

    const body = document.body;
    if (!body) {
      console.warn("PRONTIO.sidebar: document.body não disponível.");
      return;
    }

    // ✅ Delegation do toggle do menu é global e não depende do DOM pronto
    bindGlobalSidebarToggleDelegation_();

    // Idempotência: não duplicar listeners se init for chamado novamente
    if (sidebar.dataset && sidebar.dataset.sidebarInited === "true") {
      // Atualiza estado dinâmico (pode mudar por página/estado)
      highlightActiveNavLink(sidebar);
      updateProntuarioVisibility(sidebar);
      return;
    }
    sidebar.dataset.sidebarInited = "true";

    // Estado inicial global:
    // - drawer fechado
    body.classList.remove("sidebar-open");

    // Estado compacto padrão: restaurado do storage
    const initialCompact = loadCompactFromStorage();
    setCompact(initialCompact);

    // 1) Botão de modo compacto (desktop) / toggle drawer (mobile)
    const btnCompact = sidebar.querySelector(".js-toggle-compact");
    if (btnCompact) {
      syncToggleButtonAria(btnCompact, initialCompact);

      btnCompact.addEventListener("click", function () {
        // Em mobile, esse botão atua como toggle do drawer
        if (isMobile_()) {
          toggleDrawer();
          return;
        }

        // Desktop: alterna modo compacto + salva estado
        const next = !isCompact();
        setCompact(next);
        syncToggleButtonAria(btnCompact, next);
        saveCompactToStorage(next);
      });
    }

    // 2) Backdrop do drawer (fecha ao clicar)
    const backdrop = document.querySelector("[data-sidebar-backdrop]");
    if (backdrop) {
      if (!(backdrop.dataset && backdrop.dataset.sidebarBackdropBound === "true")) {
        backdrop.dataset.sidebarBackdropBound = "true";
        backdrop.addEventListener("click", function () {
          closeDrawer();
        });
      }
    }

    // 3) Ao clicar em qualquer item de menu, fecha o drawer em mobile
    const navLinks = sidebar.querySelectorAll(".nav-link");
    navLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        if (!isMobile_()) return;

        // não fecha se o item é "Em breve" / desativado
        const isDisabled =
          link.getAttribute("aria-disabled") === "true" ||
          link.getAttribute("data-soon") === "true";

        if (!isDisabled) closeDrawer();
      });
    });

    // 4) Destacar link ativo
    highlightActiveNavLink(sidebar);

    // 5) Visibilidade do PRONTUÁRIO (dinâmico)
    updateProntuarioVisibility(sidebar);

    // 6) Ações especiais do grupo SISTEMA
    setupSystemActions(sidebar);

    // 7) Proteção extra para "Em breve"
    setupSoonLinks(sidebar);

    console.log(
      "PRONTIO.sidebar: initSidebar concluído. Compacto? =",
      isCompact(),
      "| Drawer aberto? =",
      body.classList.contains("sidebar-open")
    );
  }

  // -----------------------------------------------------
  // Registro no namespace PRONTIO (padrão widgets)
  // -----------------------------------------------------

  PRONTIO.widgets.sidebar = {
    init: initSidebar
  };

  // Retrocompat: window.initSidebar e PRONTIO.ui.sidebar.init
  try {
    PRONTIO.ui.sidebar = PRONTIO.ui.sidebar || {};
    PRONTIO.ui.sidebar.init = initSidebar;

    // função global antiga, se alguma página ainda chamar direto
    global.initSidebar = global.initSidebar || initSidebar;
  } catch (e) {
    // ambiente sem window (ex.: testes), ignorar
  }
})(window, document);

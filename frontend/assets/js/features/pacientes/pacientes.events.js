// frontend/assets/js/features/pacientes/pacientes.events.js
/**
 * PRONTIO — Pacientes Events (Front)
 * ------------------------------------------------------------
 * Responsabilidades:
 * - Binding de eventos DOM
 * - Atalhos de teclado
 * - Handlers de formulário
 */

(function (global) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.features = PRONTIO.features || {};
  PRONTIO.features.pacientes = PRONTIO.features.pacientes || {};

  function bindPacientesEvents(ctx) {
    const { state, view, actions, document: doc } = ctx || {};
    const document = doc || global.document;

    if (!state || !view || !actions) {
      console.error("[PacientesEvents] Dependências não fornecidas.");
      return;
    }

    let debounceTimer = null;

    // ========================================
    // Form Sections (Collapsibles)
    // ========================================
    function initFormSections() {
      const toggles = document.querySelectorAll(".form-section__toggle");
      toggles.forEach(function (toggle) {
        if (toggle.dataset.bound === "1") return;
        toggle.dataset.bound = "1";

        toggle.addEventListener("click", function () {
          const section = this.closest(".form-section");
          if (!section) return;

          const isOpen = section.classList.contains("is-open");
          section.classList.toggle("is-open", !isOpen);
          this.setAttribute("aria-expanded", !isOpen ? "true" : "false");
        });
      });
    }

    // ========================================
    // Modal Confirmação
    // ========================================
    function initModalConfirmacao() {
      const btnOk = document.getElementById("btnConfirmacaoOk");
      const btnCancelar = document.getElementById("btnConfirmacaoCancelar");
      const modal = document.getElementById("modalConfirmacao");
      const btnClose = modal ? modal.querySelector(".modal-close") : null;

      if (btnOk) {
        btnOk.addEventListener("click", function () {
          if (typeof state.confirmacaoCallback === "function") {
            state.confirmacaoCallback();
          }
          view.fecharModalConfirmacao();
        });
      }

      if (btnCancelar) {
        btnCancelar.addEventListener("click", function () {
          view.fecharModalConfirmacao();
        });
      }

      if (btnClose) {
        btnClose.addEventListener("click", function () {
          view.fecharModalConfirmacao();
        });
      }

      if (modal) {
        modal.addEventListener("click", function (e) {
          if (e.target === modal) view.fecharModalConfirmacao();
        });
      }
    }

    // ========================================
    // Modal Visualização
    // ========================================
    function initModalVisualizacao() {
      const btnFechar = document.getElementById("btnVisualizacaoFechar");
      const btnProntuario = document.getElementById("btnVisualizacaoProntuario");
      const btnEditar = document.getElementById("btnVisualizacaoEditar");
      const modal = document.getElementById("modalVisualizacao");
      const btnClose = modal ? modal.querySelector(".modal-close") : null;

      if (btnFechar) {
        btnFechar.addEventListener("click", function () {
          view.fecharModalVisualizacao();
        });
      }

      if (btnClose) {
        btnClose.addEventListener("click", function () {
          view.fecharModalVisualizacao();
        });
      }

      if (btnProntuario) {
        btnProntuario.addEventListener("click", function () {
          if (state.pacienteVisualizandoId) {
            const p = state.pacientesCache.find(function (px) {
              return String(px.idPaciente || px.ID_Paciente || px.id || "") === state.pacienteVisualizandoId;
            });
            if (p) {
              view.fecharModalVisualizacao();
              state.pacienteSelecionadoId = state.pacienteVisualizandoId;
              state.pacienteSelecionadoNomeCompleto = p.nomeCompleto || p.nome || "";
              actions.irParaProntuario();
            }
          }
        });
      }

      if (btnEditar) {
        btnEditar.addEventListener("click", function () {
          if (state.pacienteVisualizandoId) {
            const p = state.pacientesCache.find(function (px) {
              return String(px.idPaciente || px.ID_Paciente || px.id || "") === state.pacienteVisualizandoId;
            });
            if (p) {
              view.fecharModalVisualizacao();
              state.pacienteSelecionadoId = state.pacienteVisualizandoId;
              state.pacienteSelecionadoNomeCompleto = p.nomeCompleto || p.nome || "";
              actions.entrarModoEdicao();
            }
          }
        });
      }

      if (modal) {
        modal.addEventListener("click", function (e) {
          if (e.target === modal) view.fecharModalVisualizacao();
        });
      }
    }

    // ========================================
    // Eventos Principais
    // ========================================
    function initEventosPrincipais() {
      const form = document.getElementById("formPaciente");
      const btnCarregar = document.getElementById("btnCarregarPacientes");
      const btnIrProntuario = document.getElementById("btnIrProntuario");
      const btnInativar = document.getElementById("btnInativar");
      const btnReativar = document.getElementById("btnReativar");
      const btnEditar = document.getElementById("btnEditar");
      const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
      const btnNovoPaciente = document.getElementById("btnNovoPaciente");
      const btnExportarCsv = document.getElementById("btnExportarCsv");
      const btnCopiar = document.getElementById("btnCopiarDadosPaciente");

      // Formulário
      if (form) {
        form.addEventListener("submit", function (event) {
          event.preventDefault();
          actions.salvarPaciente();
        });
      }

      // Botões principais
      if (btnCarregar) btnCarregar.addEventListener("click", function () { actions.carregarPacientes(); });
      if (btnIrProntuario) btnIrProntuario.addEventListener("click", function () { actions.irParaProntuario(); });
      if (btnInativar) btnInativar.addEventListener("click", function () { actions.alterarStatusPaciente(false); });
      if (btnReativar) btnReativar.addEventListener("click", function () { actions.alterarStatusPaciente(true); });
      if (btnEditar) btnEditar.addEventListener("click", function () { actions.entrarModoEdicao(); });
      if (btnCancelarEdicao) btnCancelarEdicao.addEventListener("click", function () { actions.sairModoEdicao(); });
      if (btnExportarCsv) btnExportarCsv.addEventListener("click", function () { actions.exportarCsv(); });
      if (btnCopiar) btnCopiar.addEventListener("click", function () { actions.copiarDadosPaciente(); });

      if (btnNovoPaciente) {
        btnNovoPaciente.addEventListener("click", function () {
          actions.abrirNovoPaciente();
        });
      }
    }

    // ========================================
    // Filtros
    // ========================================
    function initFiltros() {
      const filtroTexto = document.getElementById("filtroTexto");
      const chkSomenteAtivos = document.getElementById("chkSomenteAtivos");
      const selectOrdenacao = document.getElementById("selectOrdenacao");

      function scheduleReload(ms) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          if (state.carregando) return;
          if (state.usarPaginacao) state.pageAtual = 1;
          actions.carregarPacientes();
        }, ms);
      }

      if (filtroTexto) {
        filtroTexto.addEventListener("input", function () { scheduleReload(250); });
        filtroTexto.addEventListener("focus", function () { scheduleReload(0); });
      }

      if (chkSomenteAtivos) {
        chkSomenteAtivos.addEventListener("change", function () { scheduleReload(0); });
      }

      if (selectOrdenacao) {
        selectOrdenacao.addEventListener("change", function () {
          state.criterioOrdenacao = selectOrdenacao.value;
          scheduleReload(0);
        });
      }
    }

    // ========================================
    // Colunas
    // ========================================
    function initColunas() {
      const btnConfigColunas = document.getElementById("btnConfigColunas");
      const painelColunas = document.getElementById("painelColunas");
      const btnFecharPainelColunas = document.getElementById("btnFecharPainelColunas");
      const checkboxesColunas = document.querySelectorAll(".chk-coluna");

      if (btnConfigColunas && painelColunas) {
        btnConfigColunas.addEventListener("click", function () {
          if (state.carregando) return;
          painelColunas.classList.toggle("oculto");
        });
      }

      if (btnFecharPainelColunas && painelColunas) {
        btnFecharPainelColunas.addEventListener("click", function () {
          painelColunas.classList.add("oculto");
        });
      }

      document.addEventListener("click", function (ev) {
        if (!painelColunas || painelColunas.classList.contains("oculto")) return;
        if (btnConfigColunas && (btnConfigColunas === ev.target || btnConfigColunas.contains(ev.target))) return;
        if (painelColunas === ev.target || painelColunas.contains(ev.target)) return;
        painelColunas.classList.add("oculto");
      });

      checkboxesColunas.forEach(function (chk) {
        chk.addEventListener("change", function () {
          actions.aplicarColunasVisiveis();
        });
      });
    }

    // ========================================
    // Paginação
    // ========================================
    function initPaginacao() {
      const chkUsarPaginacao = document.getElementById("chkUsarPaginacao");
      const paginacaoControles = document.getElementById("paginacaoControles");
      const selectPageSize = document.getElementById("selectPageSize");
      const btnPaginaAnterior = document.getElementById("btnPaginaAnterior");
      const btnPaginaProxima = document.getElementById("btnPaginaProxima");

      if (chkUsarPaginacao) {
        chkUsarPaginacao.addEventListener("change", function () {
          if (state.carregando) return;
          state.usarPaginacao = !!chkUsarPaginacao.checked;
          state.pageAtual = 1;
          actions.salvarPreferenciasPaginacao();
          if (paginacaoControles) paginacaoControles.style.display = state.usarPaginacao ? "flex" : "none";
          actions.carregarPacientes();
        });
      }

      if (selectPageSize) {
        selectPageSize.addEventListener("change", function () {
          if (state.carregando) return;
          const n = parseInt(selectPageSize.value, 10);
          if (n && n > 0) state.pageSizeAtual = n;
          state.pageAtual = 1;
          actions.salvarPreferenciasPaginacao();
          if (state.usarPaginacao) actions.carregarPacientes();
        });
      }

      if (btnPaginaAnterior) {
        btnPaginaAnterior.addEventListener("click", function () {
          if (state.carregando || !state.usarPaginacao) return;
          if (state.pageAtual > 1) {
            state.pageAtual -= 1;
            actions.carregarPacientes();
          }
        });
      }

      if (btnPaginaProxima) {
        btnPaginaProxima.addEventListener("click", function () {
          if (state.carregando || !state.usarPaginacao) return;
          if (state.lastPaging && state.lastPaging.hasNext) {
            state.pageAtual += 1;
            actions.carregarPacientes();
          }
        });
      }
    }

    // ========================================
    // Atalhos de Teclado
    // ========================================
    function initAtalhosTeclado() {
      document.addEventListener("keydown", function (ev) {
        try {
          const key = String(ev.key || "").toLowerCase();

          const tag = (ev.target && ev.target.tagName) ? String(ev.target.tagName).toLowerCase() : "";
          const isTypingField = (tag === "input" || tag === "textarea" || tag === "select");

          if (key === "escape") {
            // Prioridade: fechar modais
            if (view.isModalVisualizacaoAberto()) {
              view.fecharModalVisualizacao();
              ev.preventDefault();
              return;
            }

            if (view.isModalConfirmacaoAberto()) {
              view.fecharModalConfirmacao();
              ev.preventDefault();
              return;
            }

            const painel = document.getElementById("painelColunas");
            if (painel && !painel.classList.contains("oculto")) {
              painel.classList.add("oculto");
              ev.preventDefault();
              return;
            }

            if (state.modoEdicao) {
              actions.sairModoEdicao(true);
              ev.preventDefault();
              return;
            }
            return;
          }

          if (isTypingField) return;

          // Ctrl+N: Novo paciente
          if ((ev.ctrlKey || ev.metaKey) && key === "n") {
            const btnNovo = document.getElementById("btnNovoPaciente");
            if (btnNovo && !btnNovo.disabled) {
              btnNovo.click();
              ev.preventDefault();
            }
            return;
          }

          // Ctrl+F: Foco no filtro
          if ((ev.ctrlKey || ev.metaKey) && key === "f") {
            const filtro = document.getElementById("filtroTexto");
            if (filtro && typeof filtro.focus === "function") {
              filtro.focus();
              try { filtro.select(); } catch (_) {}
              ev.preventDefault();
            }
            return;
          }
        } catch (_) {}
      });
    }

    // ========================================
    // Init
    // ========================================
    initFormSections();
    initModalConfirmacao();
    initModalVisualizacao();
    initEventosPrincipais();
    initFiltros();
    initColunas();
    initPaginacao();
    initAtalhosTeclado();
  }

  PRONTIO.features.pacientes.events = { bindPacientesEvents };

})(window);

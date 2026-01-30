// frontend/assets/js/features/agenda/agenda.controller.js
(function (global) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.features = PRONTIO.features || {};
  PRONTIO.features.agenda = PRONTIO.features.agenda || {};

  const createAgendaApi = PRONTIO.features.agenda.api?.createAgendaApi;
  const createAgendaView = PRONTIO.features.agenda.view?.createAgendaView;
  const createAgendaState = PRONTIO.features.agenda.state?.createAgendaState;

  const createAgendaLoaders = PRONTIO.features.agenda.loaders?.createAgendaLoaders;
  const createAgendaUiActions = PRONTIO.features.agenda.uiActions?.createAgendaUiActions;
  const createAgendaEditActions = PRONTIO.features.agenda.editActions?.createAgendaEditActions;

  const createPacientesApi = PRONTIO.features?.pacientes?.api?.createPacientesApi || null;
  const createPacientesPicker = PRONTIO.features?.pacientes?.picker?.createPacientesPicker || null;

  const attachTypeahead = PRONTIO.widgets?.typeahead?.attach || null;

  function createAgendaController(env) {
    env = env || {};
    const document = env.document || global.document;
    const storage = global.localStorage || null;

    if (!createAgendaApi || !createAgendaView || !createAgendaState) {
      console.error("[AgendaController] Dependências básicas não carregadas.");
      return null;
    }

    const api = createAgendaApi(PRONTIO);
    const view = createAgendaView({ document });
    const state = createAgendaState(storage);

    const loaders = createAgendaLoaders ? createAgendaLoaders({ api, state, view }) : null;
    const uiActions = createAgendaUiActions ? createAgendaUiActions({ state, view, loaders }) : null;
    const editActions = createAgendaEditActions ? createAgendaEditActions({ api, state, view, loaders }) : null;

    if (!loaders || !uiActions || !editActions) {
      console.error("[AgendaController] Módulos da Agenda não carregados (loaders/uiActions/editActions).");
      return null;
    }

    // Pacientes API (1x)
    const pacientesApi = (createPacientesApi && typeof createPacientesApi === "function")
      ? createPacientesApi(PRONTIO)
      : null;

    function nomePaciente_(p) {
      return String(p?.nomeCompleto || p?.nome || "").trim();
    }

    function telefonePaciente_(p) {
      return String(p?.telefone || p?.telefonePrincipal || p?.telefone_principal || "").trim();
    }

    function tryInitPacientesPicker_(dom) {
      state.pacientesPicker = null;

      if (!pacientesApi || typeof pacientesApi.buscarSimples !== "function") return;
      if (!createPacientesPicker) return;

      if (!dom || !dom.modalPacientes || !dom.buscaPacienteTermo || !dom.listaPacientesEl || !dom.msgPacientesEl) return;

      try {
        const picker = createPacientesPicker({
          document,
          modalEl: dom.modalPacientes,
          inputTermoEl: dom.buscaPacienteTermo,
          listEl: dom.listaPacientesEl,
          msgEl: dom.msgPacientesEl,
          closeBtnEl: dom.btnFecharModalPacientes,
          view: view,
          searchFn: async (termo, limite) => {
            const data = await pacientesApi.buscarSimples(termo, limite || 30);
            return (data && data.pacientes) ? data.pacientes : [];
          },
          onSelect: (p, ctx2) => {
            const mode = (ctx2 && ctx2.mode) ? String(ctx2.mode) : "novo";

            if (mode === "editar") {
              state.pacienteEditar = p;
              if (dom.editNomePaciente) dom.editNomePaciente.value = nomePaciente_(p);
            } else {
              state.pacienteNovo = p;
              if (dom.novoNomePaciente) dom.novoNomePaciente.value = nomePaciente_(p);
              if (dom.novoTelefone && !String(dom.novoTelefone.value || "").trim()) {
                dom.novoTelefone.value = telefonePaciente_(p);
              }
            }
          }
        });

        if (picker && typeof picker.bind === "function") picker.bind();
        state.pacientesPicker = picker || null;
      } catch (e) {
        console.warn("[AgendaController] Falha ao inicializar pacientesPicker:", e);
        state.pacientesPicker = null;
      }
    }

    function setupTypeahead_(dom) {
      if (!attachTypeahead) return;
      if (!pacientesApi || typeof pacientesApi.buscarSimples !== "function") return;

      function renderItem(p) {
        const title = nomePaciente_(p) || "(sem nome)";
        const tel = telefonePaciente_(p);
        return { title, subtitle: tel ? tel : "" };
      }

      function invalidateIfMismatch(inputEl, selectedGetter, selectedClear) {
        const typed = String(inputEl.value || "").trim();
        const sel = selectedGetter();
        const selNome = sel ? nomePaciente_(sel) : "";
        if (!typed || !sel) return;
        if (typed !== selNome) selectedClear();
      }

      // Novo
      if (dom.novoNomePaciente) {
        attachTypeahead({
          inputEl: dom.novoNomePaciente,
          minChars: 2,
          debounceMs: 220,
          fetchItems: async (q) => {
            const data = await pacientesApi.buscarSimples(q, 12);
            return (data && data.pacientes) ? data.pacientes : [];
          },
          renderItem,
          onInputChanged: () => invalidateIfMismatch(
            dom.novoNomePaciente,
            () => state.pacienteNovo,
            () => { state.pacienteNovo = null; }
          ),
          onSelect: (p) => {
            state.pacienteNovo = p;
            dom.novoNomePaciente.value = nomePaciente_(p);
            if (dom.novoTelefone && !String(dom.novoTelefone.value || "").trim()) {
              dom.novoTelefone.value = telefonePaciente_(p);
            }
          }
        });
      }

      // Editar
      if (dom.editNomePaciente) {
        attachTypeahead({
          inputEl: dom.editNomePaciente,
          minChars: 2,
          debounceMs: 220,
          fetchItems: async (q) => {
            const data = await pacientesApi.buscarSimples(q, 12);
            return (data && data.pacientes) ? data.pacientes : [];
          },
          renderItem,
          onInputChanged: () => invalidateIfMismatch(
            dom.editNomePaciente,
            () => state.pacienteEditar,
            () => { state.pacienteEditar = null; }
          ),
          onSelect: (p) => {
            state.pacienteEditar = p;
            dom.editNomePaciente.value = nomePaciente_(p);
          }
        });
      }
    }

    const actions = {
      init(dom) {
        state.dom = dom;

        tryInitPacientesPicker_(dom);
        setupTypeahead_(dom);

        uiActions.init(dom);
        loaders.init(dom);
      },

      setVisao: uiActions.setVisao,
      onChangeData: uiActions.onChangeData,
      onHoje: uiActions.onHoje,
      onAgora: uiActions.onAgora,
      onNav: uiActions.onNav,

      onFiltrosChanged: uiActions.onFiltrosChanged,
      limparFiltros: uiActions.limparFiltros,

      openPacientePicker: uiActions.openPacientePicker,
      closePacientePicker: uiActions.closePacientePicker,
      isPacientePickerOpen: uiActions.isPacientePickerOpen,
      clearPaciente: uiActions.clearPaciente,

      abrirModalNovo: uiActions.abrirModalNovo,
      fecharModalNovo: uiActions.fecharModalNovo,
      abrirModalBloqueio: uiActions.abrirModalBloqueio,
      fecharModalBloqueio: uiActions.fecharModalBloqueio,

      abrirModalEditar: editActions.abrirModalEditar,
      fecharModalEditar: editActions.fecharModalEditar,
      abrirProntuario: editActions.abrirProntuario,

      submitNovo: editActions.submitNovo,
      submitEditar: editActions.submitEditar,
      submitBloqueio: editActions.submitBloqueio,
      mudarStatus: editActions.mudarStatus,
      desbloquear: editActions.desbloquear
    };

    state.controllerActions = actions;
    return { state, actions, view };
  }

  PRONTIO.features.agenda.controller = { createAgendaController };
})(window);

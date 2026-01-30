// frontend/assets/js/features/agenda/agenda.controller.js
/**
 * PRONTIO — Agenda Controller (Front)
 * ------------------------------------------------------------
 * Controller FINO (orquestrador)
 *
 * Responsabilidades:
 * - Inicializar state, api e view
 * - Conectar módulos especializados
 * - Injetar dependências de UI (ex.: pacientesPicker) no state
 * - Expor actions públicas para agenda.entry.js
 * - Bridge: expor actions ao loader via state.controllerActions
 */

(function (global) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.features = PRONTIO.features || {};
  PRONTIO.features.agenda = PRONTIO.features.agenda || {};

  const createAgendaApi = PRONTIO.features.agenda.api?.createAgendaApi;
  const createAgendaView = PRONTIO.features.agenda.view?.createAgendaView;
  const createAgendaState = PRONTIO.features.agenda.state?.createAgendaState;

  // módulos
  const createAgendaLoaders = PRONTIO.features.agenda.loaders?.createAgendaLoaders;
  const createAgendaUiActions = PRONTIO.features.agenda.uiActions?.createAgendaUiActions;
  const createAgendaEditActions = PRONTIO.features.agenda.editActions?.createAgendaEditActions;

  // integração opcional: picker de pacientes
  const createPacientesApi = PRONTIO.features?.pacientes?.api?.createPacientesApi || null;
  const createPacientesPicker = PRONTIO.features?.pacientes?.picker?.createPacientesPicker || null;

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

    function tryInitPacientesPicker_(dom) {
      state.pacientesPicker = null;

      if (!createPacientesApi || !createPacientesPicker) return;
      if (!dom || !dom.modalPacientes || !dom.buscaPacienteTermo || !dom.listaPacientesEl || !dom.msgPacientesEl) return;

      const pacientesApi = createPacientesApi(PRONTIO);
      if (!pacientesApi || typeof pacientesApi.buscarSimples !== "function") return;

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
            if (mode === "editar") state.pacienteEditar = p;
            else state.pacienteNovo = p;
          }
        });

        if (picker && typeof picker.bind === "function") picker.bind();
        state.pacientesPicker = picker || null;
      } catch (e) {
        console.warn("[AgendaController] Falha ao inicializar pacientesPicker:", e);
        state.pacientesPicker = null;
      }
    }

    const actions = {
      init(dom) {
        state.dom = dom;

        // injeta picker no state (para uiActions)
        tryInitPacientesPicker_(dom);

        uiActions.init(dom);
        loaders.init(dom);
      },

      // navegação / visão
      setVisao: uiActions.setVisao,
      onChangeData: uiActions.onChangeData,
      onHoje: uiActions.onHoje,
      onAgora: uiActions.onAgora,
      onNav: uiActions.onNav,

      // filtros
      onFiltrosChanged: uiActions.onFiltrosChanged,
      limparFiltros: uiActions.limparFiltros,

      // pacientes
      openPacientePicker: uiActions.openPacientePicker,
      closePacientePicker: uiActions.closePacientePicker,
      isPacientePickerOpen: uiActions.isPacientePickerOpen,
      clearPaciente: uiActions.clearPaciente,

      // modais (Novo/Bloqueio são UI-only)
      abrirModalNovo: uiActions.abrirModalNovo,
      fecharModalNovo: uiActions.fecharModalNovo,
      abrirModalBloqueio: uiActions.abrirModalBloqueio,
      fecharModalBloqueio: uiActions.fecharModalBloqueio,

      // modais (Editar precisa preencher campos -> editActions)
      abrirModalEditar: editActions.abrirModalEditar,
      fecharModalEditar: editActions.fecharModalEditar,

      // prontuário (monta contexto -> editActions)
      abrirProntuario: editActions.abrirProntuario,

      // mutações
      submitNovo: editActions.submitNovo,
      submitEditar: editActions.submitEditar,
      submitBloqueio: editActions.submitBloqueio,
      mudarStatus: editActions.mudarStatus,
      desbloquear: editActions.desbloquear
    };

    // bridge para callbacks do loader/render
    state.controllerActions = actions;

    return { state, actions, view };
  }

  PRONTIO.features.agenda.controller = { createAgendaController };
})(window);

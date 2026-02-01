// frontend/assets/js/features/agenda/agenda.controller.js
/**
 * PRONTIO — Agenda Controller (Front)
 * ------------------------------------------------------------
 * Controller FINO (orquestrador)
 *
 * ✅ Compat robusta:
 * - Suporta editActions antigo (ctx com dom/agendaApi/pacientesCache/validarConflito/carregarDia/carregarSemana)
 * - Suporta editActions novo  (ctx com api/state/view/loaders)
 *
 * ✅ Também:
 * - Injeta pacientesCache no state (se existir)
 * - Injeta pacientesPicker (se existir)
 * - Dispara LOAD inicial (dia/semana) no init
 */

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

  // editActions (pode estar em formatos diferentes no repo)
  const createAgendaEditActions = PRONTIO.features.agenda.editActions?.createAgendaEditActions || null;

  // cache de pacientes (front)
  const createPacientesCache = PRONTIO.features.agenda.pacientesCache?.createPacientesCache || null;

  // picker de pacientes
  const createPacientesApi = PRONTIO.features?.pacientes?.api?.createPacientesApi || null;
  const createPacientesPicker = PRONTIO.features?.pacientes?.picker?.createPacientesPicker || null;

  function createAgendaController(env) {
    env = env || {};
    const document = env.document || global.document;
    const storage = global.localStorage || null;

    if (!createAgendaApi || !createAgendaView || !createAgendaState) {
      console.error("[AgendaController] Dependências básicas não carregadas (api/view/state).");
      return null;
    }

    const api = createAgendaApi(PRONTIO);
    const view = createAgendaView({ document });
    const state = createAgendaState(storage);

    // pacientesCache (se existir)
    state.pacientesCache =
      (createPacientesCache && typeof createPacientesCache === "function")
        ? createPacientesCache(storage, state)
        : null;

    const loaders = (createAgendaLoaders && typeof createAgendaLoaders === "function")
      ? createAgendaLoaders({ api, state, view })
      : null;

    const uiActions = (createAgendaUiActions && typeof createAgendaUiActions === "function")
      ? createAgendaUiActions({ state, view, loaders })
      : null;

    if (!loaders || !uiActions) {
      console.error("[AgendaController] Módulos loaders/uiActions não carregados.");
      return null;
    }

    // Pacientes API para picker
    const pacientesApi = (createPacientesApi && typeof createPacientesApi === "function")
      ? createPacientesApi(PRONTIO)
      : null;

    function _nomePaciente_(p) {
      return String(p?.nomeCompleto || p?.nome || "").trim();
    }
    function _telPaciente_(p) {
      return String(p?.telefone || p?.telefonePrincipal || "").trim();
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
            // cacheia paciente para exibição futura
            try { state.pacientesCache?.cachePaciente?.(p); } catch (_) {}

            const mode = (ctx2 && ctx2.mode) ? String(ctx2.mode) : "novo";
            if (mode === "editar") {
              state.pacienteEditar = p;
              if (dom.editNomePaciente) dom.editNomePaciente.value = _nomePaciente_(p);
            } else {
              state.pacienteNovo = p;
              if (dom.novoNomePaciente) dom.novoNomePaciente.value = _nomePaciente_(p);
              if (dom.novoTelefone && !String(dom.novoTelefone.value || "").trim()) {
                dom.novoTelefone.value = _telPaciente_(p);
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

    // cria editActions de forma compatível (após dom existir)
    function buildEditActions_(dom) {
      if (!createAgendaEditActions || typeof createAgendaEditActions !== "function") return null;

      // FORMATO NOVO (ctx { api, state, view, loaders })
      try {
        const maybe = createAgendaEditActions({ api, state, view, loaders });
        if (maybe && (typeof maybe.submitNovo === "function" || typeof maybe.submitEditar === "function")) {
          return maybe;
        }
      } catch (_) {}

      // FORMATO ANTIGO (ctx { dom, view, state, agendaApi, pacientesCache, validarConflito, carregarDia, carregarSemana })
      try {
        const validarConflito = async (payload) => {
          try {
            await api.validarConflito(payload || {});
            return { ok: true, conflitos: [] };
          } catch (e) {
            return {
              ok: false,
              erro: (e && e.message) ? String(e.message) : "Conflito de horário.",
              conflitos: [],
              code: (e && e.code) ? String(e.code) : "CONFLICT"
            };
          }
        };

        const maybe2 = createAgendaEditActions({
          dom,
          view,
          state,
          agendaApi: api,
          pacientesCache: state.pacientesCache,
          validarConflito,
          carregarDia: loaders.carregarDia,
          carregarSemana: loaders.carregarSemana
        });

        if (maybe2 && (typeof maybe2.submitNovo === "function" || typeof maybe2.submitEditar === "function")) {
          return maybe2;
        }
      } catch (e) {
        console.error("[AgendaController] Falha ao criar editActions (ambos formatos).", e);
      }

      return null;
    }

    // actions públicas (contrato com agenda.entry.js)
    const actions = {
      init(dom) {
        state.dom = dom;

        tryInitPacientesPicker_(dom);

        uiActions.init(dom);
        loaders.init(dom);

        // editActions compat
        state._editActions = buildEditActions_(dom);

        // LOAD inicial
        Promise.resolve()
          .then(() => uiActions.setVisao(state.modoVisao || "dia"))
          .catch(() => loaders.carregarDia());
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

      // modais (novo/bloqueio) — sempre do uiActions
      abrirModalNovo: uiActions.abrirModalNovo,
      fecharModalNovo: uiActions.fecharModalNovo,
      abrirModalBloqueio: uiActions.abrirModalBloqueio,
      fecharModalBloqueio: uiActions.fecharModalBloqueio,

      // editar/prontuário — delega para editActions se existir
      abrirModalEditar: (ag) => state._editActions?.abrirModalEditar?.(ag),
      fecharModalEditar: () => state._editActions?.fecharModalEditar?.(),
      abrirProntuario: (ag) => state._editActions?.abrirProntuario?.(ag),

      // submits/mutações — delega para editActions se existir
      submitNovo: () => state._editActions?.submitNovo?.(),
      submitEditar: () => state._editActions?.submitEditar?.(),
      submitBloqueio: () => state._editActions?.submitBloqueio?.(),
      mudarStatus: (id, label, el) => state._editActions?.mudarStatus?.(id, label, el),
      desbloquear: (id, el) => state._editActions?.desbloquear?.(id, el)
    };

    // útil para loaders (callbacks)
    state.controllerActions = actions;

    return { state, actions, view };
  }

  PRONTIO.features.agenda.controller = { createAgendaController };
})(window);

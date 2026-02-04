// frontend/assets/js/features/pacientes/pacientes.entry.js
/**
 * PRONTIO — Pacientes Entry (Front)
 * ------------------------------------------------------------
 * Ponto de entrada do módulo Pacientes.
 * Responsável por:
 * - Validar dependências
 * - Criar instâncias dos módulos
 * - Inicializar a página
 */

(function (global) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.features = PRONTIO.features || {};
  PRONTIO.features.pacientes = PRONTIO.features.pacientes || {};

  // Garante que entry sempre existe
  PRONTIO.features.pacientes.entry = PRONTIO.features.pacientes.entry || {};

  function assertPacientesDeps() {
    const miss = [];
    const p = PRONTIO.features && PRONTIO.features.pacientes ? PRONTIO.features.pacientes : {};

    if (!p.state || typeof p.state.createPacientesState !== "function") miss.push("pacientes.state.js");
    if (!p.view || typeof p.view.createPacientesView !== "function") miss.push("pacientes.view.js");
    if (!p.actions || typeof p.actions.createPacientesActions !== "function") miss.push("pacientes.actions.js");
    if (!p.events || typeof p.events.bindPacientesEvents !== "function") miss.push("pacientes.events.js");
    if (!p.api || typeof p.api.createPacientesApi !== "function") miss.push("pacientes.api.js");

    return miss;
  }

  function init(env) {
    env = env || {};
    const doc = env.document || global.document;

    try {
      const missing = assertPacientesDeps();
      if (missing.length) {
        console.error("[PRONTIO][Pacientes] Dependências faltando (scripts):", missing.join(", "));
        console.error("[PRONTIO][Pacientes] Estado atual:", {
          state: typeof PRONTIO.features?.pacientes?.state?.createPacientesState,
          view: typeof PRONTIO.features?.pacientes?.view?.createPacientesView,
          actions: typeof PRONTIO.features?.pacientes?.actions?.createPacientesActions,
          events: typeof PRONTIO.features?.pacientes?.events?.bindPacientesEvents,
          api: typeof PRONTIO.features?.pacientes?.api?.createPacientesApi
        });
        return;
      }

      // Criar estado
      const state = PRONTIO.features.pacientes.state.createPacientesState();

      // Criar API
      const api = PRONTIO.features.pacientes.api.createPacientesApi(PRONTIO);

      // Criar view
      const view = PRONTIO.features.pacientes.view.createPacientesView({
        state: state,
        document: doc
      });

      // Criar actions
      const actions = PRONTIO.features.pacientes.actions.createPacientesActions({
        state: state,
        view: view,
        api: api,
        document: doc
      });

      // Bind eventos
      PRONTIO.features.pacientes.events.bindPacientesEvents({
        state: state,
        view: view,
        actions: actions,
        document: doc
      });

      // Inicializar
      actions.carregarConfigColunas();
      actions.carregarPreferenciasPaginacao();
      actions.carregarPacientes();

      console.log("[PRONTIO][Pacientes] Módulo inicializado com sucesso.");

    } catch (e) {
      console.error("[PRONTIO][Pacientes] Falha na inicialização:", e);
    }
  }

  PRONTIO.features.pacientes.entry.init = init;

  // Registrar página
  try {
    if (typeof PRONTIO.registerPage === "function") {
      PRONTIO.registerPage("pacientes", function () {
        init({ document: global.document });
      });
    } else {
      PRONTIO.pages = PRONTIO.pages || {};
      PRONTIO.pages.pacientes = {
        init: function () {
          init({ document: global.document });
        }
      };
    }
  } catch (e) {
    console.error("[PRONTIO][Pacientes] Erro ao registrar página:", e);
  }

})(window);

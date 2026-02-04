// frontend/assets/js/features/agenda/agenda.events.js
(function (global) {
  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.features = PRONTIO.features || {};
  PRONTIO.features.agenda = PRONTIO.features.agenda || {};

  function bindAgendaEvents(args) {
    const document = (args && args.document) ? args.document : global.document;
    const dom = args && args.dom ? args.dom : null;
    const controller = args && args.controller ? args.controller : null;

    if (!dom || !controller) return;

    const actions = controller.actions || {};
    const state = controller.state || {};
    const view = controller.view || args.view || null;

    // Data change
    if (dom.inputData && typeof actions.onChangeData === "function") {
      dom.inputData.addEventListener("change", () => actions.onChangeData());
    }

    // Hoje/agora
    if (dom.btnHoje && typeof actions.onHoje === "function") dom.btnHoje.addEventListener("click", () => actions.onHoje());
    if (dom.btnAgora && typeof actions.onAgora === "function") dom.btnAgora.addEventListener("click", () => actions.onAgora());

    // Navegação (dia/semana depende do modo atual dentro do controller)
    if (dom.btnDiaAnterior && typeof actions.onNav === "function") dom.btnDiaAnterior.addEventListener("click", () => actions.onNav(-1));
    if (dom.btnDiaPosterior && typeof actions.onNav === "function") dom.btnDiaPosterior.addEventListener("click", () => actions.onNav(+1));

    // Visão
    if (dom.btnVisaoDia && typeof actions.setVisao === "function") dom.btnVisaoDia.addEventListener("click", () => actions.setVisao("dia"));
    if (dom.btnVisaoSemana && typeof actions.setVisao === "function") dom.btnVisaoSemana.addEventListener("click", () => actions.setVisao("semana"));

    // Filtros (debounce 300ms para evitar requisições excessivas)
    let filtroDebounce = null;
    function scheduleFiltros() {
      if (filtroDebounce) clearTimeout(filtroDebounce);
      filtroDebounce = setTimeout(() => {
        if (typeof actions.onFiltrosChanged !== "function") return;
        actions.onFiltrosChanged(
          dom.inputFiltroNome ? dom.inputFiltroNome.value : "",
          dom.selectFiltroStatus ? dom.selectFiltroStatus.value : ""
        );
      }, 300);
    }

    if (dom.inputFiltroNome) {
      dom.inputFiltroNome.addEventListener("input", () => scheduleFiltros());
      dom.inputFiltroNome.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          scheduleFiltros();
        }
      });
    }

    if (dom.selectFiltroStatus) dom.selectFiltroStatus.addEventListener("change", () => scheduleFiltros());

    if (dom.btnLimparFiltros && typeof actions.limparFiltros === "function") {
      dom.btnLimparFiltros.addEventListener("click", () => actions.limparFiltros());
    }

    // Ações (botões principais)
    if (dom.btnNovoAgendamento && typeof actions.abrirModalNovo === "function") {
      dom.btnNovoAgendamento.addEventListener("click", () => actions.abrirModalNovo());
    }
    if (dom.btnBloquearHorario && typeof actions.abrirModalBloqueio === "function") {
      dom.btnBloquearHorario.addEventListener("click", () => actions.abrirModalBloqueio());
    }

    // Modal Novo
    if (dom.btnFecharModalNovo && typeof actions.fecharModalNovo === "function") dom.btnFecharModalNovo.addEventListener("click", () => actions.fecharModalNovo());
    if (dom.btnCancelarModalNovo && typeof actions.fecharModalNovo === "function") dom.btnCancelarModalNovo.addEventListener("click", () => actions.fecharModalNovo());
    if (dom.modalNovo && typeof actions.fecharModalNovo === "function") {
      dom.modalNovo.addEventListener("click", (event) => {
        if (event.target === dom.modalNovo) actions.fecharModalNovo();
      });
    }
    if (dom.formNovo && typeof actions.submitNovo === "function") {
      dom.formNovo.addEventListener("submit", (e) => { e.preventDefault(); actions.submitNovo(); });
    }

    // Modal Editar
    if (dom.btnFecharModalEditar && typeof actions.fecharModalEditar === "function") dom.btnFecharModalEditar.addEventListener("click", () => actions.fecharModalEditar());
    if (dom.btnCancelarEditar && typeof actions.fecharModalEditar === "function") dom.btnCancelarEditar.addEventListener("click", () => actions.fecharModalEditar());
    if (dom.modalEdit && typeof actions.fecharModalEditar === "function") {
      dom.modalEdit.addEventListener("click", (event) => {
        if (event.target === dom.modalEdit) actions.fecharModalEditar();
      });
    }
    if (dom.formEditar && typeof actions.submitEditar === "function") {
      dom.formEditar.addEventListener("submit", (e) => { e.preventDefault(); actions.submitEditar(); });
    }

    // Modal Bloqueio
    if (dom.btnFecharModalBloqueio && typeof actions.fecharModalBloqueio === "function") dom.btnFecharModalBloqueio.addEventListener("click", () => actions.fecharModalBloqueio());
    if (dom.btnCancelarBloqueio && typeof actions.fecharModalBloqueio === "function") dom.btnCancelarBloqueio.addEventListener("click", () => actions.fecharModalBloqueio());
    if (dom.modalBloqueio && typeof actions.fecharModalBloqueio === "function") {
      dom.modalBloqueio.addEventListener("click", (event) => {
        if (event.target === dom.modalBloqueio) actions.fecharModalBloqueio();
      });
    }
    if (dom.formBloqueio && typeof actions.submitBloqueio === "function") {
      dom.formBloqueio.addEventListener("submit", (e) => { e.preventDefault(); actions.submitBloqueio(); });
    }

    // Modal Pacientes (picker reutilizável)
    if (dom.btnSelecionarPaciente && typeof actions.openPacientePicker === "function") {
      dom.btnSelecionarPaciente.addEventListener("click", () => actions.openPacientePicker("novo"));
    }
    if (dom.btnEditSelecionarPaciente && typeof actions.openPacientePicker === "function") {
      dom.btnEditSelecionarPaciente.addEventListener("click", () => actions.openPacientePicker("editar"));
    }

    if (dom.btnFecharModalPacientes && typeof actions.closePacientePicker === "function") {
      dom.btnFecharModalPacientes.addEventListener("click", () => actions.closePacientePicker());
    }
    if (dom.modalPacientes && typeof actions.closePacientePicker === "function") {
      dom.modalPacientes.addEventListener("click", (event) => {
        if (event.target === dom.modalPacientes) actions.closePacientePicker();
      });
    }

    // Limpar paciente
    if (dom.btnLimparPaciente && typeof actions.clearPaciente === "function") {
      dom.btnLimparPaciente.addEventListener("click", () => actions.clearPaciente("novo"));
    }
    if (dom.btnEditLimparPaciente && typeof actions.clearPaciente === "function") {
      dom.btnEditLimparPaciente.addEventListener("click", () => actions.clearPaciente("editar"));
    }

    // ESC fecha modais (usando actions quando possível)
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;

      // Prioridade: fechar picker se aberto
      if (typeof actions.isPacientePickerOpen === "function" && actions.isPacientePickerOpen()) {
        if (typeof actions.closePacientePicker === "function") actions.closePacientePicker();
        return;
      }

      if (typeof actions.fecharModalBloqueio === "function" && view && view.isModalVisible && view.isModalVisible(dom.modalBloqueio)) return actions.fecharModalBloqueio();
      if (typeof actions.fecharModalEditar === "function" && view && view.isModalVisible && view.isModalVisible(dom.modalEdit)) return actions.fecharModalEditar();
      if (typeof actions.fecharModalNovo === "function" && view && view.isModalVisible && view.isModalVisible(dom.modalNovo)) return actions.fecharModalNovo();
    });

  }

  PRONTIO.features.agenda.events = { bindAgendaEvents };
})(window);

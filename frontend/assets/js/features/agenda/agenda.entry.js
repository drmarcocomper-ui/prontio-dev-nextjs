// frontend/assets/js/features/agenda/agenda.entry.js
(function (global) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.features = PRONTIO.features || {};
  PRONTIO.features.agenda = PRONTIO.features.agenda || {};

  function getEl(doc, id) {
    const el = doc.getElementById(id);
    if (!el) console.warn(`[Agenda] elemento #${id} não encontrado.`);
    return el;
  }

  function collectDom(doc) {
    const inputData = getEl(doc, "input-data");
    if (!inputData) return null;

    return {
      // root
      inputData,

      // topo
      btnHoje: getEl(doc, "btn-hoje"),
      btnAgora: getEl(doc, "btn-agora"),
      btnDiaAnterior: getEl(doc, "btn-dia-anterior"),
      btnDiaPosterior: getEl(doc, "btn-dia-posterior"),

      // visão
      secDia: doc.querySelector(".agenda-dia"),
      secSemana: getEl(doc, "agenda-semana"),
      semanaGridEl: getEl(doc, "agenda-semana-grid"),
      btnVisaoDia: getEl(doc, "btn-visao-dia"),
      btnVisaoSemana: getEl(doc, "btn-visao-semana"),

      // lista
      listaHorariosEl: getEl(doc, "agenda-lista-horarios"),

      // filtros
      inputFiltroNome: getEl(doc, "filtro-nome"),
      selectFiltroStatus: getEl(doc, "filtro-status"),
      btnLimparFiltros: getEl(doc, "btn-limpar-filtros"),

      // ações
      btnNovoAgendamento: getEl(doc, "btn-novo-agendamento"),
      btnBloquearHorario: getEl(doc, "btn-bloquear-horario"),

      // modal novo
      modalNovo: getEl(doc, "modal-novo-agendamento"),
      btnFecharModalNovo: getEl(doc, "btn-fechar-modal"),
      btnCancelarModalNovo: getEl(doc, "btn-cancelar-modal"),
      formNovo: getEl(doc, "form-novo-agendamento"),
      msgNovo: getEl(doc, "novo-agendamento-mensagem"),
      novoHoraInicio: getEl(doc, "novo-hora-inicio"),
      novoDuracao: getEl(doc, "novo-duracao"),
      novoNomePaciente: getEl(doc, "novo-nome-paciente"),
      novoTelefone: getEl(doc, "novo-telefone"),
      novoTipo: getEl(doc, "novo-tipo"),
      novoMotivo: getEl(doc, "novo-motivo"),
      novoOrigem: getEl(doc, "novo-origem"),
      novoCanal: getEl(doc, "novo-canal"),
      novoPermiteEncaixe: getEl(doc, "novo-permite-encaixe"),
      btnSelecionarPaciente: getEl(doc, "btn-selecionar-paciente"),
      btnLimparPaciente: getEl(doc, "btn-limpar-paciente"),
      btnSubmitNovo: getEl(doc, "btn-submit-novo"),

      // modal editar
      modalEdit: getEl(doc, "modal-editar-agendamento"),
      btnFecharModalEditar: getEl(doc, "btn-fechar-modal-editar"),
      btnCancelarEditar: getEl(doc, "btn-cancelar-editar"),
      formEditar: getEl(doc, "form-editar-agendamento"),
      msgEditar: getEl(doc, "editar-agendamento-mensagem"),
      editIdAgenda: getEl(doc, "edit-id-agenda"),
      editData: getEl(doc, "edit-data"),
      editHoraInicio: getEl(doc, "edit-hora-inicio"),
      editDuracao: getEl(doc, "edit-duracao"),
      editNomePaciente: getEl(doc, "edit-nome-paciente"),
      editTipo: getEl(doc, "edit-tipo"),
      editMotivo: getEl(doc, "edit-motivo"),
      editOrigem: getEl(doc, "edit-origem"),
      editCanal: getEl(doc, "edit-canal"),
      editPermiteEncaixe: getEl(doc, "edit-permite-encaixe"),
      btnEditSelecionarPaciente: getEl(doc, "btn-edit-selecionar-paciente"),
      btnEditLimparPaciente: getEl(doc, "btn-edit-limpar-paciente"),
      btnSubmitEditar: getEl(doc, "btn-submit-editar"),

      // modal bloqueio
      modalBloqueio: getEl(doc, "modal-bloqueio"),
      btnFecharModalBloqueio: getEl(doc, "btn-fechar-modal-bloqueio"),
      btnCancelarBloqueio: getEl(doc, "btn-cancelar-bloqueio"),
      formBloqueio: getEl(doc, "form-bloqueio"),
      msgBloqueio: getEl(doc, "bloqueio-mensagem"),
      bloqHoraInicio: getEl(doc, "bloq-hora-inicio"),
      bloqDuracao: getEl(doc, "bloq-duracao"),
      btnSubmitBloqueio: getEl(doc, "btn-submit-bloqueio"),

      // modal pacientes
      modalPacientes: getEl(doc, "modal-pacientes"),
      buscaPacienteTermo: getEl(doc, "busca-paciente-termo"),
      listaPacientesEl: getEl(doc, "lista-pacientes"),
      msgPacientesEl: getEl(doc, "pacientes-resultado-msg"),
      btnFecharModalPacientes: getEl(doc, "btn-fechar-modal-pacientes")
    };
  }

  async function init(env) {
    env = env || {};
    const document = env.document || global.document;

    // ✅ blindagem: se env.window vier undefined, usa global
    const win = env.window || global;

    const dom = collectDom(document);
    if (!dom) {
      console.error("[PRONTIO][Agenda] DOM da Agenda incompleto (input-data ausente).");
      return;
    }

    const factory =
      PRONTIO.features &&
      PRONTIO.features.agenda &&
      PRONTIO.features.agenda.controller &&
      typeof PRONTIO.features.agenda.controller.createAgendaController === "function"
        ? PRONTIO.features.agenda.controller.createAgendaController
        : null;

    if (!factory) {
      console.error("[PRONTIO][Agenda] createAgendaController não encontrado. Verifique assets/js/features/agenda/agenda.controller.js.");
      return;
    }

    // ✅ controller novo: recebe env (document) e cria api/view internamente
    const controller = factory({ document: document });

    if (!controller || !controller.actions || typeof controller.actions.init !== "function") {
      console.error("[PRONTIO][Agenda] controller.actions.init não disponível.");
      return;
    }

    // init do controller (monta dom + inicia visão)
    controller.actions.init(dom);

    // bind de eventos (compatível com actions)
    const binder =
      PRONTIO.features &&
      PRONTIO.features.agenda &&
      PRONTIO.features.agenda.events &&
      typeof PRONTIO.features.agenda.events.bindAgendaEvents === "function"
        ? PRONTIO.features.agenda.events.bindAgendaEvents
        : null;

    if (binder) {
      binder({ document, dom, controller, window: win });
    } else {
      console.warn("[PRONTIO][Agenda] binder de eventos não encontrado (agenda.events.js).");
    }
  }

  PRONTIO.features.agenda.entry = { init };
})(window);

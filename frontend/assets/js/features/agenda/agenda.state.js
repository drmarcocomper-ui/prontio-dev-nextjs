// frontend/assets/js/features/agenda/agenda.state.js
(function (global) {
  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.features = PRONTIO.features || {};
  PRONTIO.features.agenda = PRONTIO.features.agenda || {};

  const KEY_VIEW = "prontio.agenda.modoVisao";
  const KEY_FILTERS = "prontio.agenda.filtros.v2"; // v2 (profissional)

  function safeJsonParse(raw, fallback) {
    try {
      if (!raw) return fallback;
      const obj = JSON.parse(raw);
      return obj && typeof obj === "object" ? obj : fallback;
    } catch (_) {
      return fallback;
    }
  }

  /**
   * Estado ÚNICO da Agenda (UI state).
   * - Persistidos: modoVisao + filtros
   * - Runtime (não persistidos): seleção, listas, concorrência, reqSeq, etc.
   */
  function createAgendaState(storage) {
    const modoSalvo = storage ? storage.getItem(KEY_VIEW) : null;
    const modoVisao = modoSalvo === "semana" ? "semana" : "dia";

    const filtrosSalvos = storage ? safeJsonParse(storage.getItem(KEY_FILTERS), null) : null;

    return {
      // ===== Infra runtime (injetado pelo controller) =====
      dom: null,
      pacientesPicker: null,

      // ===== Persistidos =====
      modoVisao,
      filtros: {
        nome: String((filtrosSalvos && filtrosSalvos.nome) || ""),
        status: String((filtrosSalvos && filtrosSalvos.status) || "")
      },

      // ===== Runtime =====
      dataSelecionada: "",

      // foco/scroll (runtime)
      horaFocoDia: null,

      // config
      config: {
        hora_inicio_padrao: "08:00",
        hora_fim_padrao: "18:00",
        duracao_grade_minutos: 15
      },
      configCarregada: false,

      // dados
      agendamentosamentos: null, // (compat opcional; pode remover depois)
      agendamentosPeriodo: [], // DTO canônico bruto
      agendamentosDiaUi: [],   // UI do dia
      agendamentosSemanaUi: [],// UI da semana (opcional, mas útil)

      // seleção
      pacienteNovo: null,
      pacienteEditar: null,
      agendamentoEmEdicao: null,

      // cache local de pacientes (Agenda não faz join no backend)
      pacienteNomeById: {}, // { [idPaciente]: "Nome..." }
      pacienteMiniById: {}, // { [idPaciente]: { idPaciente, nomeCompleto, telefone, documento } }

      // concorrência (runtime)
      reqSeqDia: 0,
      reqSeqSemana: 0,

      inFlight: {
        statusById: new Set(),
        desbloquearById: new Set()
      }
    };
  }

  PRONTIO.features.agenda.state = { createAgendaState, KEY_VIEW, KEY_FILTERS };
})(window);

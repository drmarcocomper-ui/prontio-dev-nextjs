/* PRONTIO - Agenda State (state.js)
 * Estado em memória:
 * - modoVisao, agendaConfig, cache de dia/semana, foco, inFlight, anti-race seq
 */
(function () {
  "use strict";

  const root = (window.PRONTIO = window.PRONTIO || {});
  root.Agenda = root.Agenda || {};

  const state = {
    _ctx: null,
    _data: {
      modoVisao: "dia",
      agendaConfig: {
        hora_inicio_padrao: "08:00",
        hora_fim_padrao: "18:00",
        duracao_grade_minutos: 15
      },
      agendaConfigCarregada: false,

      // dados carregados
      agendamentosOriginaisDia: [],
      agendamentosOriginaisSemana: [],

      // UI
      horaFocoDia: null,

      // anti-race
      reqSeqDia: 0,
      reqSeqSemana: 0,

      // inFlight
      inFlight: {
        statusById: new Set(),
        removerBloqById: new Set()
      }
    }
  };

  function init(ctx) {
    state._ctx = ctx || null;
  }

  function get(key) {
    return state._data[key];
  }

  function set(key, value) {
    state._data[key] = value;
  }

  function bumpSeqDia() {
    state._data.reqSeqDia += 1;
    return state._data.reqSeqDia;
  }

  function bumpSeqSemana() {
    state._data.reqSeqSemana += 1;
    return state._data.reqSeqSemana;
  }

  function setConfig(patch) {
    const cfg = state._data.agendaConfig || {};
    state._data.agendaConfig = Object.assign({}, cfg, patch || {});
  }

  function markConfigLoaded() {
    state._data.agendaConfigCarregada = true;
  }

  function isConfigLoaded() {
    return state._data.agendaConfigCarregada === true;
  }

  root.Agenda.state = {
    init,
    get,
    set,
    bumpSeqDia,
    bumpSeqSemana,
    setConfig,
    markConfigLoaded,
    isConfigLoaded
  };
})();

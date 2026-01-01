/* PRONTIO - Agenda API (api.js)
 * Wrapper para callApiData + endpoints usados pela Agenda
 * (front NÃO conhece planilha; só chama ações)
 */
(function () {
  "use strict";

  const root = (window.PRONTIO = window.PRONTIO || {});
  root.Agenda = root.Agenda || {};

  const api = { _ctx: null };

  function callApiData_() {
    const PRONTIO = root;
    return (
      (PRONTIO.api && PRONTIO.api.callApiData) ||
      window.callApiData ||
      function () {
        console.error("[PRONTIO][Agenda] callApiData não está definido.");
        return Promise.reject(new Error("API não inicializada (callApiData indefinido)."));
      }
    );
  }

  function init(ctx) {
    api._ctx = ctx || null;
  }

  // Config
  async function obterConfig() {
    const callApiData = callApiData_();
    return callApiData({ action: "AgendaConfig_Obter", payload: {} });
  }

  // Listagens
  async function listarDia(dataStr) {
    const callApiData = callApiData_();
    return callApiData({ action: "Agenda_ListarDia", payload: { data: dataStr } });
  }

  async function listarSemana(dataRef) {
    const callApiData = callApiData_();
    return callApiData({ action: "Agenda_ListarSemana", payload: { data_referencia: dataRef } });
  }

  // Conflitos
  async function validarConflito(params) {
    const callApiData = callApiData_();
    const payload = {
      data: params.data,
      hora_inicio: params.hora_inicio,
      duracao_minutos: params.duracao_minutos,
      ignoreIdAgenda: params.ignoreIdAgenda || "",
      permite_encaixe: params.permite_encaixe === true,
      permitirEncaixe: params.permite_encaixe === true
    };
    try {
      return await callApiData({ action: "Agenda_ValidarConflito", payload });
    } catch (e) {
      // fallback: se endpoint indisponível, não bloqueia
      console.warn("[PRONTIO][Agenda] validarConflito indisponível (fallback ok=true).", e);
      return { ok: true, conflitos: [], intervalo: null, erro: "" };
    }
  }

  // CRUD
  async function criar(payload) {
    const callApiData = callApiData_();
    return callApiData({ action: "Agenda.Criar", payload });
  }

  async function atualizar(payload) {
    const callApiData = callApiData_();
    return callApiData({ action: "Agenda.Atualizar", payload });
  }

  async function cancelar(payload) {
    const callApiData = callApiData_();
    return callApiData({ action: "Agenda.Cancelar", payload });
  }

  // Pacientes
  async function buscarPacientesSimples(termo, limite) {
    const callApiData = callApiData_();
    const t = String(termo || "").trim();
    if (!t || t.length < 2) return { pacientes: [] };
    return callApiData({ action: "Pacientes_BuscarSimples", payload: { termo: t, limite: limite || 12 } });
  }

  root.Agenda.api = {
    init,
    obterConfig,
    listarDia,
    listarSemana,
    validarConflito,
    criar,
    atualizar,
    cancelar,
    buscarPacientesSimples
  };
})();

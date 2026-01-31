/**
 * PRONTIO — Agenda Constants
 * ------------------------------------------------------------
 * Fonte de verdade da Agenda:
 * - Usa AgendaEventos como entidade oficial
 * - Mantém enums de Status / Tipo / Origem
 *
 * ⚠️ IMPORTANTE:
 * - Agenda (legado) não é mais usada
 * - idEvento é o ID canônico
 */

// ============================================================
// ENTIDADE CANÔNICA
// ============================================================
var AGENDA_ENTITY = "AgendaEventos";
var AGENDA_ID_FIELD = "idEvento";

// ============================================================
// STATUS DO AGENDAMENTO
// ============================================================
var AGENDA_STATUS = {
  MARCADO: "MARCADO",
  CONFIRMADO: "CONFIRMADO",
  AGUARDANDO: "AGUARDANDO",
  EM_ATENDIMENTO: "EM_ATENDIMENTO",
  ATENDIDO: "ATENDIDO",
  FALTOU: "FALTOU",
  CANCELADO: "CANCELADO",
  REMARCADO: "REMARCADO"
};

// ============================================================
// TIPO DE EVENTO
// ============================================================
var AGENDA_TIPO = {
  CONSULTA: "CONSULTA",
  RETORNO: "RETORNO",
  PROCEDIMENTO: "PROCEDIMENTO",
  BLOQUEIO: "BLOQUEIO",
  OUTRO: "OUTRO"
};

// ============================================================
// ORIGEM DO AGENDAMENTO
// ============================================================
var AGENDA_ORIGEM = {
  RECEPCAO: "RECEPCAO",
  MEDICO: "MEDICO",
  SISTEMA: "SISTEMA"
};

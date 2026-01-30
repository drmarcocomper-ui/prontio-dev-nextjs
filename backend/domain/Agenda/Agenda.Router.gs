// backend/domain/Agenda/Agenda.Router.gs
/**
 * PRONTIO — Agenda Router (Back)
 * ------------------------------------------------------------
 * Ajustes (2026-01):
 * - Actions canônicas usam "Agenda.*" (Registry é a fonte de verdade das actions externas).
 * - Mantém compat com actions antigas (underscore / lowercase) sem quebrar.
 * - Bloqueio/Desbloqueio: NÃO chama legacy (força caminho canônico).
 *
 * Observação:
 * - O Registry deve chamar diretamente Agenda_Action_* quando existir.
 * - Este Router permanece como compat interno/legado e para integrações que ainda chamem handleAgendaAction_.
 */

function handleAgendaAction_(action, payload) {
  payload = payload || {};

  var ctx = {
    action: String(action || "").trim(),
    user: null, // preenchido pelo Api.gs / Auth
    env: (typeof PRONTIO_ENV !== "undefined" ? PRONTIO_ENV : "DEV"),
    apiVersion: (typeof PRONTIO_API_VERSION !== "undefined" ? PRONTIO_API_VERSION : "1.0.0-DEV")
  };

  var a = ctx.action;

  // ======================================================
  // ACTIONS CANÔNICAS (Registry)
  // ======================================================
  switch (a) {
    case "Agenda.ListarPorPeriodo":
      return Agenda_Action_ListarPorPeriodo_(ctx, payload);

    case "Agenda.Criar":
      return Agenda_Action_Criar_(ctx, payload);

    case "Agenda.Atualizar":
      return Agenda_Action_Atualizar_(ctx, payload);

    case "Agenda.Cancelar":
      return Agenda_Action_Cancelar_(ctx, payload);

    case "Agenda.ValidarConflito":
      return Agenda_Action_ValidarConflito_(ctx, payload);

    case "Agenda.ListarEventosDiaParaValidacao":
      return (typeof Agenda_Action_ListarEventosDiaParaValidacao_ === "function")
        ? Agenda_Action_ListarEventosDiaParaValidacao_(ctx, payload)
        : _agendaThrow_("NOT_FOUND", "Agenda_Action_ListarEventosDiaParaValidacao_ não encontrado.", { action: a });

    // ✅ Bloqueio/Desbloqueio: força action canônica (sem legacy)
    case "Agenda.BloquearHorario":
      return (typeof Agenda_Action_BloquearHorario_ === "function")
        ? Agenda_Action_BloquearHorario_(ctx, payload)
        : _agendaThrow_("NOT_FOUND", "Agenda_Action_BloquearHorario_ não encontrado.", { action: a });

    case "Agenda.DesbloquearHorario":
      return (typeof Agenda_Action_DesbloquearHorario_ === "function")
        ? Agenda_Action_DesbloquearHorario_(ctx, payload)
        : _agendaThrow_("NOT_FOUND", "Agenda_Action_DesbloquearHorario_ não encontrado.", { action: a });
  }

  // ======================================================
  // ACTIONS NOVAS (lowercase legacy interno) — compat
  // Mantidas para chamadas antigas que ainda usam "agenda.*"
  // ======================================================
  switch (a) {
    case "agenda.listarPorPeriodo":
      return Agenda_Action_ListarPorPeriodo_(ctx, payload);

    case "agenda.criar":
      return Agenda_Action_Criar_(ctx, payload);

    case "agenda.atualizar":
      return Agenda_Action_Atualizar_(ctx, payload);

    case "agenda.cancelar":
      return Agenda_Action_Cancelar_(ctx, payload);

    case "agenda.validarConflito":
      return Agenda_Action_ValidarConflito_(ctx, payload);
  }

  // ======================================================
  // ACTIONS LEGACY (underscore) — compat controlada
  // ======================================================
  switch (a) {
    case "Agenda_ListarDia":
      return Agenda_Legacy_ListarDia_(ctx, payload);

    case "Agenda_ListarSemana":
      return Agenda_Legacy_ListarSemana_(ctx, payload);

    // Compat: mapear para canônicas, se existirem
    case "Agenda_Criar":
      return (typeof Agenda_Action_Criar_ === "function")
        ? Agenda_Action_Criar_(ctx, payload)
        : Agenda_Legacy_Criar_(ctx, payload);

    case "Agenda_Atualizar":
      return (typeof Agenda_Action_Atualizar_ === "function")
        ? Agenda_Action_Atualizar_(ctx, payload)
        : Agenda_Legacy_Atualizar_(ctx, payload);

    case "Agenda_ValidarConflito":
      return (typeof Agenda_Action_ValidarConflito_ === "function")
        ? Agenda_Action_ValidarConflito_(ctx, payload)
        : _Registry_agendaValidarConflitoHandler_()(ctx, payload);

    // Legacy bloqueio/remover bloqueio permanecem apenas para clientes antigos
    case "Agenda_BloquearHorario":
      return (typeof Agenda_Legacy_BloquearHorario_ === "function")
        ? Agenda_Legacy_BloquearHorario_(ctx, payload)
        : _agendaThrow_("NOT_FOUND", "Handler legacy de bloqueio não disponível.", { action: a });

    case "Agenda_MudarStatus":
      return Agenda_Legacy_MudarStatus_(ctx, payload);

    case "Agenda_RemoverBloqueio":
      return (typeof Agenda_Legacy_RemoverBloqueio_ === "function")
        ? Agenda_Legacy_RemoverBloqueio_(ctx, payload)
        : _agendaThrow_("NOT_FOUND", "Handler legacy de remoção de bloqueio não disponível.", { action: a });

    // Legacy de validação (mantido) — recomenda-se migrar para "Agenda.ListarEventosDiaParaValidacao"
    case "Agenda_ListarEventosDiaParaValidacao":
      if (typeof Agenda_ListarEventosDiaParaValidacao_ === "function") {
        var ds = payload && payload.data ? String(payload.data) : "";
        return { items: Agenda_ListarEventosDiaParaValidacao_(ds) };
      }
      return _agendaThrow_("NOT_FOUND", "Agenda_ListarEventosDiaParaValidacao_ não encontrado.", { action: a });
  }

  // ======================================================
  // ACTION NÃO RECONHECIDA
  // ======================================================
  _agendaThrow_("NOT_FOUND", "Action de Agenda não reconhecida.", { action: a });
}

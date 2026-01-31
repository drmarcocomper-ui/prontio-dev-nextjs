/**
 * PRONTIO - Agenda.CoreConflitos.gs
 * Regra oficial (fonte da verdade) de conflito.
 * Escopo: POR PROFISSIONAL
 *
 * ✅ Atualizado para AgendaEventos:
 * - ID canônico: idEvento
 * - Datas canônicas: inicioDateTime / fimDateTime
 * - Cancelado: status=CANCELADO e/ou ativo=false
 * - Mantém aliases em detalhes para compat (idAgenda/inicio/fim)
 */
function _agendaAssertSemConflitos_(ctx, args, params) {
  params = params || {};
  args = args || {};

  var inicio = args.inicio;
  var fim = args.fim;
  var idProfissional = args.idProfissional ? String(args.idProfissional) : "";

  if (!idProfissional) {
    _agendaThrow_("VALIDATION_ERROR", '"idProfissional" é obrigatório para validação de conflito.', {});
  }

  if (!(inicio instanceof Date) || isNaN(inicio.getTime())) {
    _agendaThrow_("VALIDATION_ERROR", "inicio inválido.", {});
  }

  if (!(fim instanceof Date) || isNaN(fim.getTime())) {
    _agendaThrow_("VALIDATION_ERROR", "fim inválido.", {});
  }

  // ignoreIdAgenda = compat; agora ele carrega idEvento
  var ignoreId = args.ignoreIdAgenda ? String(args.ignoreIdAgenda) : null;
  var isBloqueioNovo = args.modoBloqueio === true;

  var cfgPermiteSobreposicao = params.permiteSobreposicao === true;
  var permitirEncaixe = args.permitirEncaixe === true;

  var all = Repo_list_(AGENDA_ENTITY);

  for (var i = 0; i < all.length; i++) {
    var e = _agendaNormalizeRowToDto_(all[i]);

    // id canônico (e compat)
    var eId = String(e.idEvento || e.idAgenda || "");
    if (ignoreId && eId === ignoreId) continue;

    if (String(e.idProfissional || "") !== idProfissional) continue;

    // ativo + status
    var evStatus = _agendaNormalizeStatus_(e.status || AGENDA_STATUS.MARCADO);
    var evAtivo = (e.ativo === undefined || e.ativo === null) ? true : (e.ativo === true);

    if (!evAtivo) continue;
    if (evStatus === AGENDA_STATUS.CANCELADO) continue;

    // datas canônicas (com fallback)
    var evIni = _agendaParseDate_(e.inicioDateTime || e.inicio);
    var evFim = _agendaParseDate_(e.fimDateTime || e.fim);
    if (!evIni || !evFim) continue;

    var overlaps = (inicio.getTime() < evFim.getTime()) &&
                   (fim.getTime() > evIni.getTime());
    if (!overlaps) continue;

    var evTipo = _agendaNormalizeTipo_(e.tipo || AGENDA_TIPO.CONSULTA);
    var evIsBloqueio = (evTipo === AGENDA_TIPO.BLOQUEIO);

    // payload de conflito (com aliases)
    var conflito = {
      idEvento: eId,
      idAgenda: eId, // alias compat
      idProfissional: e.idProfissional,
      inicioDateTime: e.inicioDateTime || e.inicio,
      fimDateTime: e.fimDateTime || e.fim,
      inicio: e.inicioDateTime || e.inicio, // alias compat
      fim: e.fimDateTime || e.fim,          // alias compat
      tipo: e.tipo,
      status: e.status
    };

    if (evIsBloqueio) {
      _agendaThrow_("CONFLICT", "Horário bloqueado para este profissional.", {
        conflitos: [conflito]
      });
    }

    if (isBloqueioNovo) {
      _agendaThrow_("CONFLICT", "Não é possível bloquear: existe agendamento no intervalo.", {
        conflitos: [conflito]
      });
    }

    if (cfgPermiteSobreposicao) continue;
    if (permitirEncaixe) continue;

    _agendaThrow_("CONFLICT", "Já existe agendamento para este profissional no intervalo.", {
      conflitos: [conflito]
    });
  }

  return true;
}

// backend/domain/Agenda/Agenda.Cache.gs
/**
 * ============================================================
 * PRONTIO - Agenda Cache (P2)
 * ============================================================
 * Cache de agenda com invalidação granular por dia.
 *
 * - Cacheia resultados de ListarPorPeriodo por profissional+data
 * - Invalida apenas o dia afetado após mutações (criar/atualizar/cancelar)
 * - TTL de 10 minutos
 * ============================================================
 */

var AGENDA_CACHE_PREFIX = "PRONTIO_AGENDA_DAY_";
var AGENDA_CACHE_TTL_SEC = 60 * 10; // 10 minutos

/**
 * Gera chave de cache para um dia específico.
 * Formato: PRONTIO_AGENDA_DAY_{idProfissional}_{YYYY-MM-DD}
 */
function _agendaCacheKey_(idProfissional, dateStr) {
  return AGENDA_CACHE_PREFIX + String(idProfissional || "ALL") + "_" + String(dateStr || "");
}

/**
 * Obtém dados do cache para um dia específico.
 * @returns {Array|null} Lista de eventos ou null se não houver cache
 */
function _agendaCacheGet_(idProfissional, dateStr) {
  try {
    var cache = CacheService.getScriptCache();
    var key = _agendaCacheKey_(idProfissional, dateStr);
    var raw = cache.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

/**
 * Salva dados no cache para um dia específico.
 */
function _agendaCacheSet_(idProfissional, dateStr, items) {
  try {
    var cache = CacheService.getScriptCache();
    var key = _agendaCacheKey_(idProfissional, dateStr);
    var json = JSON.stringify(items || []);

    // CacheService tem limite de 100KB por entrada
    if (json.length > 90000) {
      // Muito grande para cachear, pula
      return false;
    }

    cache.put(key, json, AGENDA_CACHE_TTL_SEC);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Invalida cache de um dia específico para um profissional.
 * Chamado após criar/atualizar/cancelar agendamento.
 */
function _agendaCacheInvalidateDay_(idProfissional, dateStr) {
  try {
    var cache = CacheService.getScriptCache();

    // Invalida cache específico do profissional
    var key = _agendaCacheKey_(idProfissional, dateStr);
    cache.remove(key);

    // Invalida cache "ALL" (sem filtro de profissional)
    var keyAll = _agendaCacheKey_("ALL", dateStr);
    cache.remove(keyAll);

    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Invalida cache de múltiplos dias (usado quando evento cruza meia-noite).
 */
function _agendaCacheInvalidateDays_(idProfissional, dates) {
  if (!dates || !dates.length) return;

  for (var i = 0; i < dates.length; i++) {
    _agendaCacheInvalidateDay_(idProfissional, dates[i]);
  }
}

/**
 * Extrai data(s) de um evento para invalidação.
 * Retorna array de datas no formato YYYY-MM-DD.
 */
function _agendaCacheExtractDates_(inicioDateTime, fimDateTime) {
  var dates = [];

  var ini = _agendaParseDate_(inicioDateTime);
  if (!ini) return dates;

  var iniStr = _agendaFormatYYYYMMDD_(ini);
  if (iniStr) dates.push(iniStr);

  var fim = _agendaParseDate_(fimDateTime);
  if (fim) {
    var fimStr = _agendaFormatYYYYMMDD_(fim);
    if (fimStr && fimStr !== iniStr) {
      dates.push(fimStr);
    }
  }

  return dates;
}

/**
 * Invalida cache após mutação de evento.
 * Extrai as datas afetadas do DTO e invalida.
 */
function _agendaCacheInvalidateFromDto_(dto) {
  if (!dto) return;

  var idProfissional = dto.idProfissional || "";
  var dates = _agendaCacheExtractDates_(
    dto.inicioDateTime || dto.inicio,
    dto.fimDateTime || dto.fim
  );

  _agendaCacheInvalidateDays_(idProfissional, dates);
}

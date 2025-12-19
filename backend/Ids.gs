/**
 * ============================================================
 * PRONTIO - Ids.gs (FASE 1)
 * ============================================================
 * Gerador centralizado de IDs por entidade.
 */

var IDS_META_KEY = "IDS_COUNTERS";

/**
 * Gera próximo ID para uma entidade
 * Ex.: nextId_("Agenda") -> ID_AGENDA_000001
 */
function Ids_nextId_(entity) {
  entity = String(entity || "").toUpperCase();
  if (!entity) throw new Error("Entidade inválida para geração de ID.");

  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty(IDS_META_KEY);
  var counters = raw ? JSON.parse(raw) : {};

  var current = counters[entity] || 0;
  current++;

  counters[entity] = current;
  props.setProperty(IDS_META_KEY, JSON.stringify(counters));

  return "ID_" + entity + "_" + Utilities.formatString("%06d", current);
}

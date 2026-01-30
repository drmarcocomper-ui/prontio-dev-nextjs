// backend/data/Repository.gs
/**
 * ============================================================
 * PRONTIO - Repository.gs (CANÔNICO)
 * ============================================================
 * Único ponto de acesso físico ao Google Sheets.
 *
 * Regras canônicas (PRONTIO):
 * - Repo NÃO cria abas.
 * - Repo NÃO cria/atualiza headers.
 * - Estrutura (abas + headers) é criada SOMENTE por Migrations (Migrations_bootstrap_).
 * - Em runtime, se schema não estiver pronto, Repo falha (fail-fast).
 *
 * Mantém:
 * - Assinaturas Repo_list_/getById_/insert_/update_/softDelete_
 * - Otimização getById/update com scan só da coluna ID + cache best-effort (ScriptCache).
 * ============================================================
 */

// ======================
// Config interno (cache)
// ======================
var _REPO_CACHE_PREFIX = typeof _REPO_CACHE_PREFIX !== "undefined" ? _REPO_CACHE_PREFIX : "PRONTIO_REPO_IDX_";
var _REPO_CACHE_TTL_SEC = typeof _REPO_CACHE_TTL_SEC !== "undefined" ? _REPO_CACHE_TTL_SEC : 60 * 5; // 5 min

function Repo_getDb_() {
  if (typeof PRONTIO_getDb_ !== "function") {
    throw new Error("Repo_getDb_: PRONTIO_getDb_ não encontrado (Utils.gs).");
  }
  return PRONTIO_getDb_();
}

/**
 * Normalização de célula para escrita:
 * - undefined/null vira string vazia (padrão do Sheets no PRONTIO)
 * - demais valores são mantidos
 */
function _repoCell_(v) {
  return (v === undefined || v === null) ? "" : v;
}

/**
 * Erro canônico para schema não pronto.
 */
function _repoSchemaNotReady_(code, message, details) {
  var e = new Error(message || "Schema não inicializado.");
  e.code = code || "SCHEMA_NOT_READY";
  e.details = details || {};
  return e;
}

/**
 * Abre a aba. Não cria. Não mexe em header.
 * Falha se não existir.
 */
function Repo_getSheet_(sheetName) {
  var db = Repo_getDb_();
  var sheet = db.getSheetByName(sheetName);

  if (!sheet) {
    throw _repoSchemaNotReady_(
      "SCHEMA_NOT_READY",
      "Aba não encontrada: " + sheetName + ". Rode Meta_BootstrapDb / Migrations_bootstrap_.",
      { sheetName: sheetName }
    );
  }

  return sheet;
}

function Repo_getHeader_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (!lastCol || lastCol < 1) return [];

  // lê a linha 1 inteira até lastCol
  var raw = sheet.getRange(1, 1, 1, lastCol).getValues()[0] || [];

  // normaliza: trim + remove vazios
  var header = raw.map(function (h) { return String(h || "").trim(); })
    .filter(function (h) { return !!h; });

  return header;
}

function _repoRequireHeader_(sheetName, header) {
  if (header && header.length) return true;
  throw _repoSchemaNotReady_(
    "SCHEMA_NOT_READY",
    "Header vazio na aba " + sheetName + ". Rode Meta_BootstrapDb / Migrations_bootstrap_.",
    { sheetName: sheetName }
  );
}

// ======================
// Cache helpers (best-effort)
// ======================
function _repoCacheKey_(sheetName, idField) {
  return _REPO_CACHE_PREFIX + String(sheetName || "") + "|" + String(idField || "");
}

function _repoCacheGetMap_(sheetName, idField) {
  try {
    var cache = CacheService.getScriptCache();
    var raw = cache.get(_repoCacheKey_(sheetName, idField));
    if (!raw) return null;
    var obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    return obj;
  } catch (_) {
    return null;
  }
}

function _repoCacheSetMap_(sheetName, idField, mapObj) {
  try {
    var cache = CacheService.getScriptCache();
    cache.put(_repoCacheKey_(sheetName, idField), JSON.stringify(mapObj || {}), _REPO_CACHE_TTL_SEC);
  } catch (_) {}
}

function _repoCacheInvalidate_(sheetName, idField) {
  try {
    var cache = CacheService.getScriptCache();
    cache.remove(_repoCacheKey_(sheetName, idField));
  } catch (_) {}
}

/**
 * Busca rowIndex (1-based) para um idValue na planilha.
 * Usa cache best-effort; se não achar, faz scan da coluna de ID.
 */
function _repoFindRowIndexById_(sheet, sheetName, idField, header, idValue) {
  var target = String(idValue);

  // acha coluna de ID
  var idxId = header.indexOf(String(idField));
  if (idxId < 0) {
    throw _repoSchemaNotReady_(
      "SCHEMA_MISMATCH",
      "Repo: campo ID não encontrado no header: " + idField + " (sheet=" + sheetName + ")",
      { sheetName: sheetName, idField: idField, header: header }
    );
  }

  // 1) tenta cache de mapa (id->rowIndex)
  var cached = _repoCacheGetMap_(sheetName, idField);
  if (cached && cached[target]) {
    var ri = parseInt(cached[target], 10);
    if (isFinite(ri) && ri >= 2 && ri <= sheet.getLastRow()) {
      // valida se a linha ainda corresponde ao ID (evita cache obsoleto)
      try {
        var cellVal = sheet.getRange(ri, idxId + 1, 1, 1).getValues()[0][0];
        if (String(cellVal) === target) return ri;
      } catch (_) {}
    }
    // cache ruim/obsoleto -> segue para scan
  }

  // 2) scan da coluna do ID
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  var ids = sheet.getRange(2, idxId + 1, lastRow - 1, 1).getValues();
  var foundRowIndex = null;

  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === target) {
      foundRowIndex = i + 2; // +2 por causa do header e índice 0
      break;
    }
  }

  // 3) reconstrói cache (best-effort)
  try {
    var mapObj = {};
    for (var j = 0; j < ids.length; j++) {
      var v = String(ids[j][0]);
      if (!v) continue;
      mapObj[v] = j + 2;
    }
    _repoCacheSetMap_(sheetName, idField, mapObj);
  } catch (_) {}

  return foundRowIndex;
}

// ======================
// CRUD
// ======================
function Repo_list_(sheetName) {
  var sheet = Repo_getSheet_(sheetName);
  var header = Repo_getHeader_(sheet);
  _repoRequireHeader_(sheetName, header);

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, header.length).getValues();

  var out = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    for (var c = 0; c < header.length; c++) {
      obj[header[c]] = row[c];
    }
    out.push(obj);
  }
  return out;
}

function Repo_getById_(sheetName, idField, idValue) {
  var sheet = Repo_getSheet_(sheetName);
  var header = Repo_getHeader_(sheet);
  _repoRequireHeader_(sheetName, header);

  var rowIndex = _repoFindRowIndexById_(sheet, sheetName, idField, header, idValue);
  if (!rowIndex) return null;

  var row = sheet.getRange(rowIndex, 1, 1, header.length).getValues()[0];
  var obj = {};
  for (var c = 0; c < header.length; c++) obj[header[c]] = row[c];
  return obj;
}

function Repo_insert_(sheetName, obj) {
  obj = obj || {};
  var sheet = Repo_getSheet_(sheetName);
  var header = Repo_getHeader_(sheet);
  _repoRequireHeader_(sheetName, header);

  var row = new Array(header.length);
  for (var c = 0; c < header.length; c++) {
    var k = header[c];
    row[c] = _repoCell_(obj[k]);
  }

  // mais previsível que appendRow em alguns casos (filtros/linhas vazias)
  var newRow = sheet.getLastRow() + 1;
  sheet.getRange(newRow, 1, 1, header.length).setValues([row]);

  // não sabemos idField aqui; cache é por (sheetName+idField).
  return obj;
}

function Repo_update_(sheetName, idField, idValue, patch) {
  patch = patch || {};
  var sheet = Repo_getSheet_(sheetName);
  var header = Repo_getHeader_(sheet);
  _repoRequireHeader_(sheetName, header);

  var rowIndex = _repoFindRowIndexById_(sheet, sheetName, idField, header, idValue);
  if (!rowIndex) return false;

  // lê a linha inteira uma única vez
  var row = sheet.getRange(rowIndex, 1, 1, header.length).getValues()[0];

  // aplica patch por header
  var changed = false;
  for (var c = 0; c < header.length; c++) {
    var k = header[c];
    if (patch[k] !== undefined) {
      row[c] = _repoCell_(patch[k]);
      changed = true;
    }
  }

  if (!changed) return true;

  // escreve apenas a linha alterada
  sheet.getRange(rowIndex, 1, 1, header.length).setValues([row]);

  // invalida cache do índice dessa entidade para evitar cache fantasma
  _repoCacheInvalidate_(sheetName, idField);

  return true;
}

/**
 * SoftDelete genérico (se existir colunas "ativo" ou "status")
 */
function Repo_softDelete_(sheetName, idField, idValue) {
  var patch = {};
  patch.ativo = false;
  patch.status = "INATIVO";
  return Repo_update_(sheetName, idField, idValue, patch);
}

// ======================
// Debug helpers
// ======================
function DEBUG_REPO_SHEETS() {
  var ss = null;

  try {
    if (typeof Repository_getSpreadsheet_ === "function") {
      ss = Repository_getSpreadsheet_();
    }
  } catch (_) {}

  if (!ss) {
    try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) {}
  }

  if (!ss) {
    Logger.log("ERRO: não consegui obter Spreadsheet.");
    return;
  }

  var sheets = ss.getSheets().map(function (sh) { return sh.getName(); });

  Logger.log(JSON.stringify({
    spreadsheetId: ss.getId(),
    spreadsheetName: ss.getName(),
    sheets: sheets
  }, null, 2));

  Logger.log("AGENDA_ENTITY=" + (typeof AGENDA_ENTITY !== "undefined" ? AGENDA_ENTITY : "undefined"));
  Logger.log("ATENDIMENTO_ENTITY=" + (typeof ATENDIMENTO_ENTITY !== "undefined" ? ATENDIMENTO_ENTITY : "undefined"));
}

function DEBUG_SHEET_STATS_(sheetName) {
  var sh = Repo_getSheet_(sheetName);
  var header = Repo_getHeader_(sh);
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();

  var sample = [];
  if (lastRow >= 2 && header.length > 0) {
    var n = Math.min(5, lastRow - 1);
    sample = sh.getRange(2, 1, n, Math.min(header.length, 12)).getValues();
  }

  Logger.log(JSON.stringify({
    sheet: sheetName,
    lastRow: lastRow,
    lastCol: lastCol,
    headerLen: header.length,
    header: header,
    sampleRows: sample
  }, null, 2));
}

function DEBUG_AGENDA_ATENDIMENTO_STATS() {
  DEBUG_SHEET_STATS_("Agenda");
  DEBUG_SHEET_STATS_("Atendimento");
  DEBUG_SHEET_STATS_("AgendaEventos");
}

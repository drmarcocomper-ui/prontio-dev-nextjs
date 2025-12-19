/**
 * ============================================================
 * PRONTIO - Migrations.gs (FASE 4)
 * ============================================================
 * - Bootstrap/criação de abas e cabeçalhos mínimos
 * - Versionamento do schema
 * - Estado do banco (DbStatus)
 *
 * Regras:
 * - Front NÃO conhece Sheets.
 * - Aqui é backend-only. Nomes de abas/colunas são internos.
 * - Usa PRONTIO_getDb_() (Utils.gs) para selecionar DEV/PROD.
 */

var MIGRATIONS_LATEST_VERSION = 1;

var MIGRATIONS_META_SHEET = "__meta";
var MIGRATIONS_META_HEADERS = ["key", "value", "updatedAt"];

var MIGRATIONS_SHEETS = {
  "__meta": MIGRATIONS_META_HEADERS,

  "Agenda": [
    "idAgenda",
    "idPaciente",
    "inicio",
    "fim",
    "titulo",
    "notas",
    "tipo",
    "status",
    "origem",
    "criadoEm",
    "atualizadoEm",
    "canceladoEm",
    "canceladoMotivo"
  ],

  "Pacientes": [
    "idPaciente",
    "ativo",
    "nome",
    "nascimento",
    "sexo",
    "cpf",
    "telefone",
    "email",
    "endereco",
    "observacoes",
    "criadoEm",
    "atualizadoEm"
  ],

  "Evolucao": [
    "idEvolucao",
    "idPaciente",
    "data",
    "texto",
    "criadoEm",
    "atualizadoEm",
    "ativo"
  ],

  // Preparado para uso futuro (Audit.gs poderá persistir aqui)
  "Audit": [
    "ts",
    "requestId",
    "action",
    "env",
    "apiVersion",
    "userId",
    "userLogin",
    "userPerfil",
    "outcome",
    "entity",
    "entityId",
    "durationMs",
    "error",
    "extra"
  ]
};

/**
 * Retorna o status do banco, sem alterar nada.
 */
function Migrations_getDbStatus_() {
  var db = _migGetDb_();
  var existingSheets = db.getSheets().map(function (s) { return s.getName(); });

  var missing = [];
  var present = [];
  Object.keys(MIGRATIONS_SHEETS).forEach(function (name) {
    if (existingSheets.indexOf(name) >= 0) present.push(name);
    else missing.push(name);
  });

  var meta = _migTryReadMeta_();
  var currentVersion = meta.dbVersion !== null ? Number(meta.dbVersion) : null;
  var latest = Number(MIGRATIONS_LATEST_VERSION);

  var ok = (missing.length === 0) && (currentVersion !== null) && (currentVersion >= latest);

  return {
    ok: ok,
    latestVersion: latest,
    currentVersion: currentVersion,
    needsBootstrap: (missing.length > 0) || (currentVersion === null),
    needsMigration: (currentVersion !== null) ? (currentVersion < latest) : true,
    missingSheets: missing,
    presentSheets: present,
    env: (typeof PRONTIO_ENV !== "undefined") ? PRONTIO_ENV : null,
    dbId: _migTryGetDbId_()
  };
}

/**
 * Executa bootstrap/migrations até a última versão.
 * OBS: função interna (não exposta como action por padrão).
 */
function Migrations_bootstrap_() {
  var db = _migGetDb_();

  // 1) Garante abas + headers
  Object.keys(MIGRATIONS_SHEETS).forEach(function (sheetName) {
    _migEnsureSheetWithHeader_(db, sheetName, MIGRATIONS_SHEETS[sheetName]);
  });

  // 2) Garante meta keys e versão
  var meta = _migTryReadMeta_();
  var currentVersion = meta.dbVersion !== null ? Number(meta.dbVersion) : 0;

  // Se não existia, consideramos 0 e migramos até latest
  if (!currentVersion || currentVersion < 0) currentVersion = 0;

  // 3) Aplica migrations incrementais (placeholder para evolução futura)
  var target = Number(MIGRATIONS_LATEST_VERSION);
  for (var v = currentVersion + 1; v <= target; v++) {
    _migApplyVersion_(v);
  }

  _migSetMeta_("dbVersion", String(target));
  _migSetMeta_("dbUpdatedAt", new Date().toISOString());

  return {
    ok: true,
    appliedToVersion: target,
    status: Migrations_getDbStatus_()
  };
}

/**
 * Aplica mudanças específicas de versão.
 * Nesta primeira versão (v1), o bootstrap já garante tudo.
 */
function _migApplyVersion_(version) {
  // Reservado para futuras evoluções:
  // v2: adicionar novas colunas, novas abas, ajustes etc.
  // Aqui mantemos idempotente.
  _migSetMeta_("lastMigrationVersion", String(version));
  _migSetMeta_("lastMigrationAt", new Date().toISOString());
}

/**
 * Leitura segura do meta.
 */
function _migTryReadMeta_() {
  var db = _migGetDb_();
  var sheet = db.getSheetByName(MIGRATIONS_META_SHEET);
  if (!sheet) return { dbVersion: null };

  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return { dbVersion: null };

  var header = values[0];
  var idxKey = header.indexOf("key");
  var idxVal = header.indexOf("value");
  if (idxKey < 0 || idxVal < 0) return { dbVersion: null };

  var map = {};
  for (var i = 1; i < values.length; i++) {
    var k = values[i][idxKey];
    var v = values[i][idxVal];
    if (k) map[String(k)] = v;
  }

  return {
    dbVersion: map.dbVersion !== undefined ? map.dbVersion : null
  };
}

/**
 * Define/atualiza uma chave no __meta.
 */
function _migSetMeta_(key, value) {
  var db = _migGetDb_();
  var sheet = db.getSheetByName(MIGRATIONS_META_SHEET);
  if (!sheet) sheet = db.insertSheet(MIGRATIONS_META_SHEET);

  // Garante header
  _migEnsureHeader_(sheet, MIGRATIONS_META_HEADERS);

  var values = sheet.getDataRange().getValues();
  var header = values[0];
  var idxKey = header.indexOf("key");
  var idxVal = header.indexOf("value");
  var idxUpd = header.indexOf("updatedAt");

  // Procura key
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idxKey]) === String(key)) {
      sheet.getRange(i + 1, idxVal + 1).setValue(value);
      sheet.getRange(i + 1, idxUpd + 1).setValue(new Date());
      return true;
    }
  }

  // Insere nova linha
  sheet.appendRow([key, value, new Date()]);
  return true;
}

/**
 * Garante aba com cabeçalho correto.
 * Se existir e header estiver vazio/diferente, ajusta apenas a primeira linha.
 */
function _migEnsureSheetWithHeader_(db, sheetName, headers) {
  var sheet = db.getSheetByName(sheetName);
  if (!sheet) sheet = db.insertSheet(sheetName);

  _migEnsureHeader_(sheet, headers);
  return sheet;
}

function _migEnsureHeader_(sheet, headers) {
  var lastCol = Math.max(1, headers.length);
  var firstRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  var isBlank = true;
  for (var i = 0; i < firstRow.length; i++) {
    if (String(firstRow[i] || "").trim() !== "") { isBlank = false; break; }
  }

  // Se está em branco: escreve header completo
  if (isBlank) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return true;
  }

  // Se não está em branco, mas difere, atualiza a linha 1 (idempotente)
  var differs = false;
  for (var c = 0; c < headers.length; c++) {
    if (String(firstRow[c] || "") !== String(headers[c])) { differs = true; break; }
  }
  if (differs) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return true;
}

function _migGetDb_() {
  if (typeof PRONTIO_getDb_ !== "function") {
    throw new Error("Migrations: PRONTIO_getDb_ não encontrado (Utils.gs).");
  }
  return PRONTIO_getDb_();
}

function _migTryGetDbId_() {
  try {
    // Se aberto por ID, o SpreadsheetApp não expõe o ID diretamente daqui de forma simples.
    // Mantemos null para não vazar detalhes.
    return null;
  } catch (_) {
    return null;
  }
}

/**
 * ============================================================
 * PRONTIO - Repository.gs (FASE 1)
 * ============================================================
 * Único ponto de acesso ao Google Sheets.
 *
 * Fornece as funções usadas pela Agenda nova:
 * - Repo_list_(sheetName)
 * - Repo_getById_(sheetName, idField, idValue)
 * - Repo_insert_(sheetName, obj)
 * - Repo_update_(sheetName, idField, idValue, patch)
 * - Repo_softDelete_(sheetName, idField, idValue)  (opcional)
 *
 * Observações:
 * - Usa PRONTIO_getDb_() (Utils.gs) para selecionar DEV/PROD.
 * - As abas/headers são internas (backend-only).
 * - Header é garantido conforme Migrations.gs (MIGRATIONS_SHEETS) quando disponível.
 */

function Repo_getDb_() {
  if (typeof PRONTIO_getDb_ !== "function") {
    throw new Error("Repo_getDb_: PRONTIO_getDb_ não encontrado (Utils.gs).");
  }
  return PRONTIO_getDb_();
}

/**
 * Garante que a aba exista e que tenha header.
 * Se MIGRATIONS_SHEETS existir, usa o header definido lá.
 */
function Repo_getSheet_(sheetName) {
  var db = Repo_getDb_();
  var sheet = db.getSheetByName(sheetName);
  if (!sheet) sheet = db.insertSheet(sheetName);

  // Garantir header (preferir migrations)
  var expected = null;
  try {
    if (typeof MIGRATIONS_SHEETS !== "undefined" && MIGRATIONS_SHEETS && MIGRATIONS_SHEETS[sheetName]) {
      expected = MIGRATIONS_SHEETS[sheetName];
    }
  } catch (_) {
    expected = null;
  }

  // Se não houver migrations, tenta inferir header existente
  if (expected && expected.length) {
    _repoEnsureHeader_(sheet, expected);
  } else {
    // Se header estiver vazio, não cria automaticamente (para não inventar schema)
    // Mas não quebra: se estiver vazio, as funções abaixo vão retornar vazio ou lançar erro amigável.
  }

  return sheet;
}

function _repoEnsureHeader_(sheet, headers) {
  var lastCol = Math.max(1, headers.length);
  var row1 = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  var isBlank = true;
  for (var i = 0; i < row1.length; i++) {
    if (String(row1[i] || "").trim() !== "") { isBlank = false; break; }
  }

  if (isBlank) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }

  // Se difere, atualiza linha 1 (idempotente)
  var differs = false;
  for (var c = 0; c < headers.length; c++) {
    if (String(row1[c] || "") !== String(headers[c])) { differs = true; break; }
  }
  if (differs) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function Repo_getHeader_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (!lastCol || lastCol < 1) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h || "").trim();
  });
}

function Repo_list_(sheetName) {
  var sheet = Repo_getSheet_(sheetName);
  var lastRow = sheet.getLastRow();
  var header = Repo_getHeader_(sheet);
  if (!header.length) return [];

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
  var lastRow = sheet.getLastRow();
  var header = Repo_getHeader_(sheet);
  if (!header.length) return null;
  if (lastRow < 2) return null;

  var idx = header.indexOf(String(idField));
  if (idx < 0) {
    throw new Error("Repo_getById_: campo ID não encontrado: " + idField);
  }

  var ids = sheet.getRange(2, idx + 1, lastRow - 1, 1).getValues();
  var target = String(idValue);

  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === target) {
      var row = sheet.getRange(i + 2, 1, 1, header.length).getValues()[0];
      var obj = {};
      for (var c = 0; c < header.length; c++) obj[header[c]] = row[c];
      return obj;
    }
  }
  return null;
}

function Repo_insert_(sheetName, obj) {
  obj = obj || {};
  var sheet = Repo_getSheet_(sheetName);
  var header = Repo_getHeader_(sheet);
  if (!header.length) {
    throw new Error("Repo_insert_: header vazio na aba " + sheetName + ". Rode Meta.BootstrapDb/Migrations_bootstrap_.");
  }

  var row = new Array(header.length);
  for (var c = 0; c < header.length; c++) {
    var k = header[c];
    row[c] = (obj[k] !== undefined) ? obj[k] : "";
  }

  sheet.appendRow(row);
  return obj;
}

function Repo_update_(sheetName, idField, idValue, patch) {
  patch = patch || {};
  var sheet = Repo_getSheet_(sheetName);
  var lastRow = sheet.getLastRow();
  var header = Repo_getHeader_(sheet);
  if (!header.length) return false;
  if (lastRow < 2) return false;

  var idxId = header.indexOf(String(idField));
  if (idxId < 0) throw new Error("Repo_update_: campo ID não encontrado: " + idField);

  var values = sheet.getRange(2, 1, lastRow - 1, header.length).getValues();
  var target = String(idValue);

  for (var r = 0; r < values.length; r++) {
    if (String(values[r][idxId]) === target) {
      // aplica patch por header
      for (var c = 0; c < header.length; c++) {
        var k = header[c];
        if (patch[k] !== undefined) {
          values[r][c] = patch[k];
        }
      }

      // escreve apenas a linha alterada
      sheet.getRange(r + 2, 1, 1, header.length).setValues([values[r]]);
      return true;
    }
  }

  return false;
}

/**
 * SoftDelete genérico (se existir colunas "ativo" ou "status")
 */
function Repo_softDelete_(sheetName, idField, idValue) {
  var patch = {};
  // padrões comuns
  patch.ativo = false;
  patch.status = "INATIVO";
  return Repo_update_(sheetName, idField, idValue, patch);
}

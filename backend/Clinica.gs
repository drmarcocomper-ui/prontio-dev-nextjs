/**
 * ============================================================
 * PRONTIO - Clinica.gs (MÓDULO 1)
 * ============================================================
 * Responsabilidade:
 * - Identidade institucional e parâmetros globais
 * - Single clinic mode (1 clínica), preparado para multi-clínica
 *
 * Ações (via Registry):
 * - Clinica_Get    (auth required)
 * - Clinica_Update (admin)
 *
 * Persistência:
 * - Aba: "Clinica" (Migrations.gs)
 * - via Repo_* (Repository.gs)
 *
 * Observação:
 * - idClinica padrão vem de Config_getClinicId_() (Config.gs)
 */

var CLINICA_SHEET_NAME = "Clinica";
var CLINICA_ID_FIELD = "idClinica";

function Clinica_Get(ctx, payload) {
  payload = payload || {};

  _clinicaRequireInfra_();

  var idClinica = Config_getClinicId_();
  var existing = Repo_getById_(CLINICA_SHEET_NAME, CLINICA_ID_FIELD, idClinica);

  if (existing) {
    return _clinicaNormalizeOut_(existing);
  }

  // Se não existir ainda, cria automaticamente (single clinic mode)
  var now = new Date();
  var created = {
    idClinica: idClinica,
    nome: String(Config_get_("clinica_nome") || "PRONTIO"),
    endereco: String(Config_get_("clinica_endereco") || ""),
    telefone: String(Config_get_("clinica_telefone") || ""),
    email: String(Config_get_("clinica_email") || ""),
    logoUrl: "",
    timezone: String(Config_get_("timezone") || "America/Sao_Paulo"),
    templatesDocumentos: {},     // objeto (Repo grava como string se precisar; aqui fica no DTO)
    parametrosGlobais: {},       // idem
    criadoEm: now,
    atualizadoEm: now,
    ativo: true
  };

  // Para planilha: objetos -> string JSON (evita virar "[object Object]")
  var toStore = _clinicaToStore_(created);
  Repo_insert_(CLINICA_SHEET_NAME, toStore);

  try {
    if (typeof Audit_log_ === "function") {
      Audit_log_(ctx, { outcome: "SUCCESS", entity: "Clinica", entityId: idClinica, extra: { autoCreated: true } });
    }
  } catch (_) {}

  return _clinicaNormalizeOut_(toStore);
}

function Clinica_Update(ctx, payload) {
  payload = payload || {};

  _clinicaRequireInfra_();

  var idClinica = Config_getClinicId_();

  // Garante que existe
  var before = Repo_getById_(CLINICA_SHEET_NAME, CLINICA_ID_FIELD, idClinica);
  if (!before) {
    // cria e depois atualiza
    Clinica_Get(ctx, {});
    before = Repo_getById_(CLINICA_SHEET_NAME, CLINICA_ID_FIELD, idClinica);
  }

  // Patch permitido (whitelist)
  var patch = {};
  if (payload.nome !== undefined) patch.nome = String(payload.nome || "").trim();
  if (payload.endereco !== undefined) patch.endereco = String(payload.endereco || "").trim();
  if (payload.telefone !== undefined) patch.telefone = String(payload.telefone || "").trim();
  if (payload.email !== undefined) patch.email = String(payload.email || "").trim();
  if (payload.logoUrl !== undefined) patch.logoUrl = String(payload.logoUrl || "").trim();
  if (payload.timezone !== undefined) patch.timezone = String(payload.timezone || "").trim();

  if (payload.templatesDocumentos !== undefined) patch.templatesDocumentos = payload.templatesDocumentos;
  if (payload.parametrosGlobais !== undefined) patch.parametrosGlobais = payload.parametrosGlobais;

  if (payload.ativo !== undefined) patch.ativo = !!payload.ativo;

  // Validações mínimas (sem depender do Schema ainda)
  if (patch.nome !== undefined && !patch.nome) {
    _clinicaThrow_("VALIDATION_ERROR", "nome é obrigatório.", { field: "nome" });
  }
  if (patch.timezone !== undefined && !patch.timezone) {
    _clinicaThrow_("VALIDATION_ERROR", "timezone inválido.", { field: "timezone" });
  }

  patch.atualizadoEm = new Date();

  // converter objetos para armazenamento em célula
  var storePatch = _clinicaToStore_(patch);

  var ok = Repo_update_(CLINICA_SHEET_NAME, CLINICA_ID_FIELD, idClinica, storePatch);
  if (!ok) _clinicaThrow_("NOT_FOUND", "Clínica não encontrada para atualizar.", { idClinica: idClinica });

  var after = Repo_getById_(CLINICA_SHEET_NAME, CLINICA_ID_FIELD, idClinica);

  try {
    if (typeof Audit_log_ === "function") {
      Audit_log_(ctx, {
        outcome: "SUCCESS",
        entity: "Clinica",
        entityId: idClinica,
        extra: { before: _clinicaNormalizeOut_(before), after: _clinicaNormalizeOut_(after) }
      });
    }
  } catch (_) {}

  return _clinicaNormalizeOut_(after);
}

// ======================
// Internals
// ======================

function _clinicaRequireInfra_() {
  if (typeof Config_getClinicId_ !== "function") throw new Error("Clinica.gs: Config_getClinicId_ não disponível (Config.gs).");
  if (typeof Repo_getById_ !== "function" || typeof Repo_insert_ !== "function" || typeof Repo_update_ !== "function") {
    throw new Error("Clinica.gs: Repository não disponível (Repository.gs).");
  }
}

function _clinicaThrow_(code, message, details) {
  var err = new Error(String(message || "Erro."));
  err.code = String(code || "INTERNAL_ERROR");
  err.details = (details === undefined ? null : details);
  throw err;
}

/**
 * Converte campos complexos (object) para string JSON para armazenar na sheet.
 */
function _clinicaToStore_(obj) {
  obj = obj || {};
  var out = {};
  for (var k in obj) {
    if (!obj.hasOwnProperty(k)) continue;
    var v = obj[k];
    if (k === "templatesDocumentos" || k === "parametrosGlobais") {
      if (v === null || v === undefined) out[k] = "";
      else if (typeof v === "string") out[k] = v; // permite já vir serializado
      else {
        try { out[k] = JSON.stringify(v); } catch (_) { out[k] = String(v); }
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Normaliza saída para o front (objetos voltam para object, best-effort).
 */
function _clinicaNormalizeOut_(row) {
  row = row || {};
  var out = {};
  for (var k in row) {
    if (!row.hasOwnProperty(k)) continue;
    out[k] = row[k];
  }

  out.templatesDocumentos = _clinicaParseJson_(out.templatesDocumentos);
  out.parametrosGlobais = _clinicaParseJson_(out.parametrosGlobais);

  return out;
}

function _clinicaParseJson_(v) {
  if (v === null || v === undefined) return {};
  if (typeof v === "object") return v;
  var s = String(v || "").trim();
  if (!s) return {};
  try {
    var o = JSON.parse(s);
    return (o && typeof o === "object") ? o : {};
  } catch (_) {
    return {};
  }
}

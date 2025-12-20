/**
 * ============================================================
 * PRONTIO - Profissionais.gs (MÓDULO 2)
 * ============================================================
 * Responsabilidade:
 * - Cadastro de profissionais que atendem/assinam e possuem agenda
 *
 * Ações (via Registry):
 * - Profissionais_List
 * - Profissionais_Create
 * - Profissionais_Update
 * - Profissionais_SetActive
 *
 * Persistência:
 * - Aba: "Profissionais" (Migrations.gs)
 * - via Repo_* (Repository.gs)
 *
 * Observações:
 * - idClinica vem de Config_getClinicId_() (single clinic mode)
 * - IDs gerados por Ids_nextId_("PROFISSIONAL") se disponível; fallback UUID
 */

var PROF_SHEET_NAME = "Profissionais";
var PROF_ID_FIELD = "idProfissional";

function Profissionais_List(ctx, payload) {
  payload = payload || {};
  _profRequireInfra_();

  var idClinica = Config_getClinicId_();

  var onlyActive = (payload.onlyActive === undefined) ? true : !!payload.onlyActive;

  var all = Repo_list_(PROF_SHEET_NAME);
  var out = [];

  for (var i = 0; i < all.length; i++) {
    var p = all[i];
    if (!p || !p[PROF_ID_FIELD]) continue;

    if (String(p.idClinica || "") !== String(idClinica)) continue;

    var ativo = _profBool_(p.ativo);
    if (onlyActive && !ativo) continue;

    out.push(_profNormalizeOut_(p));
  }

  // ordena por nome
  out.sort(function (a, b) {
    var an = String(a.nomeCompleto || "").toLowerCase();
    var bn = String(b.nomeCompleto || "").toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    return 0;
  });

  return out;
}

function Profissionais_Create(ctx, payload) {
  payload = payload || {};
  _profRequireInfra_();

  var idClinica = Config_getClinicId_();
  var now = new Date();

  var nomeCompleto = String(payload.nomeCompleto || "").trim();
  var tipoProfissional = String(payload.tipoProfissional || "").trim().toUpperCase();

  if (!nomeCompleto) _profThrow_("VALIDATION_ERROR", "nomeCompleto é obrigatório.", { field: "nomeCompleto" });
  if (!tipoProfissional) tipoProfissional = "MEDICO";

  if (["MEDICO", "NUTRICIONISTA", "OUTRO"].indexOf(tipoProfissional) < 0) {
    _profThrow_("VALIDATION_ERROR", "tipoProfissional inválido.", { field: "tipoProfissional", allowed: ["MEDICO","NUTRICIONISTA","OUTRO"] });
  }

  var idProfissional = _profNewId_();

  var record = {
    idProfissional: idProfissional,
    idClinica: idClinica,
    tipoProfissional: tipoProfissional,
    nomeCompleto: nomeCompleto,
    documentoRegistro: String(payload.documentoRegistro || "").trim(),
    especialidade: String(payload.especialidade || "").trim(),
    assinaturaDigitalBase64: String(payload.assinaturaDigitalBase64 || "").trim(),
    corInterface: String(payload.corInterface || "").trim(),
    ativo: true,
    criadoEm: now,
    atualizadoEm: now
  };

  Repo_insert_(PROF_SHEET_NAME, record);

  try {
    if (typeof Audit_log_ === "function") {
      Audit_log_(ctx, { outcome: "SUCCESS", entity: "Profissional", entityId: idProfissional, extra: { created: true } });
    }
  } catch (_) {}

  return _profNormalizeOut_(record);
}

function Profissionais_Update(ctx, payload) {
  payload = payload || {};
  _profRequireInfra_();

  var idClinica = Config_getClinicId_();
  var id = String(payload.idProfissional || payload.id || "").trim();
  if (!id) _profThrow_("VALIDATION_ERROR", "idProfissional é obrigatório.", { field: "idProfissional" });

  var before = Repo_getById_(PROF_SHEET_NAME, PROF_ID_FIELD, id);
  if (!before) _profThrow_("NOT_FOUND", "Profissional não encontrado.", { idProfissional: id });

  if (String(before.idClinica || "") !== String(idClinica)) {
    _profThrow_("PERMISSION_DENIED", "Profissional fora do escopo da clínica.", { idClinica: idClinica, idProfissional: id });
  }

  var patch = {};

  if (payload.tipoProfissional !== undefined) {
    var tp = String(payload.tipoProfissional || "").trim().toUpperCase();
    if (tp && ["MEDICO", "NUTRICIONISTA", "OUTRO"].indexOf(tp) < 0) {
      _profThrow_("VALIDATION_ERROR", "tipoProfissional inválido.", { field: "tipoProfissional" });
    }
    patch.tipoProfissional = tp;
  }

  if (payload.nomeCompleto !== undefined) {
    var nome = String(payload.nomeCompleto || "").trim();
    if (!nome) _profThrow_("VALIDATION_ERROR", "nomeCompleto é obrigatório.", { field: "nomeCompleto" });
    patch.nomeCompleto = nome;
  }

  if (payload.documentoRegistro !== undefined) patch.documentoRegistro = String(payload.documentoRegistro || "").trim();
  if (payload.especialidade !== undefined) patch.especialidade = String(payload.especialidade || "").trim();
  if (payload.assinaturaDigitalBase64 !== undefined) patch.assinaturaDigitalBase64 = String(payload.assinaturaDigitalBase64 || "").trim();
  if (payload.corInterface !== undefined) patch.corInterface = String(payload.corInterface || "").trim();
  if (payload.ativo !== undefined) patch.ativo = !!payload.ativo;

  patch.atualizadoEm = new Date();

  var ok = Repo_update_(PROF_SHEET_NAME, PROF_ID_FIELD, id, patch);
  if (!ok) _profThrow_("NOT_FOUND", "Falha ao atualizar profissional.", { idProfissional: id });

  var after = Repo_getById_(PROF_SHEET_NAME, PROF_ID_FIELD, id);

  try {
    if (typeof Audit_log_ === "function") {
      Audit_log_(ctx, {
        outcome: "SUCCESS",
        entity: "Profissional",
        entityId: id,
        extra: { before: _profNormalizeOut_(before), after: _profNormalizeOut_(after) }
      });
    }
  } catch (_) {}

  return _profNormalizeOut_(after);
}

function Profissionais_SetActive(ctx, payload) {
  payload = payload || {};
  _profRequireInfra_();

  var idClinica = Config_getClinicId_();
  var id = String(payload.idProfissional || payload.id || "").trim();
  if (!id) _profThrow_("VALIDATION_ERROR", "idProfissional é obrigatório.", { field: "idProfissional" });

  var ativo = !!payload.ativo;

  var before = Repo_getById_(PROF_SHEET_NAME, PROF_ID_FIELD, id);
  if (!before) _profThrow_("NOT_FOUND", "Profissional não encontrado.", { idProfissional: id });
  if (String(before.idClinica || "") !== String(idClinica)) {
    _profThrow_("PERMISSION_DENIED", "Profissional fora do escopo da clínica.", { idClinica: idClinica, idProfissional: id });
  }

  var patch = { ativo: ativo, atualizadoEm: new Date() };
  var ok = Repo_update_(PROF_SHEET_NAME, PROF_ID_FIELD, id, patch);
  if (!ok) _profThrow_("NOT_FOUND", "Falha ao alterar ativo do profissional.", { idProfissional: id });

  var after = Repo_getById_(PROF_SHEET_NAME, PROF_ID_FIELD, id);

  try {
    if (typeof Audit_log_ === "function") {
      Audit_log_(ctx, { outcome: "SUCCESS", entity: "Profissional", entityId: id, extra: { ativo: ativo } });
    }
  } catch (_) {}

  return _profNormalizeOut_(after);
}

// ======================
// Internals
// ======================

function _profRequireInfra_() {
  if (typeof Config_getClinicId_ !== "function") throw new Error("Profissionais.gs: Config_getClinicId_ não disponível (Config.gs).");
  if (typeof Repo_list_ !== "function" || typeof Repo_insert_ !== "function" || typeof Repo_update_ !== "function" || typeof Repo_getById_ !== "function") {
    throw new Error("Profissionais.gs: Repository não disponível (Repository.gs).");
  }
}

function _profThrow_(code, message, details) {
  var err = new Error(String(message || "Erro."));
  err.code = String(code || "INTERNAL_ERROR");
  err.details = (details === undefined ? null : details);
  throw err;
}

function _profNewId_() {
  try {
    if (typeof Ids_nextId_ === "function") return Ids_nextId_("PROFISSIONAL");
  } catch (_) {}
  return "ID_PROFISSIONAL_" + Utilities.getUuid().split("-")[0].toUpperCase();
}

function _profBool_(v) {
  if (v === true) return true;
  if (v === false) return false;
  var s = String(v || "").trim().toLowerCase();
  if (s === "true" || s === "1" || s === "sim" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "nao" || s === "não" || s === "no") return false;
  return !!v;
}

function _profNormalizeOut_(row) {
  row = row || {};
  return {
    idProfissional: row.idProfissional,
    idClinica: row.idClinica,
    tipoProfissional: row.tipoProfissional,
    nomeCompleto: row.nomeCompleto,
    documentoRegistro: row.documentoRegistro,
    especialidade: row.especialidade,
    assinaturaDigitalBase64: row.assinaturaDigitalBase64,
    corInterface: row.corInterface,
    ativo: _profBool_(row.ativo),
    criadoEm: row.criadoEm,
    atualizadoEm: row.atualizadoEm
  };
}

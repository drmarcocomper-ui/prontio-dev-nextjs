// ---------------------------------------------------------------------------
// Adapter repo-first para Pacientes (Repository.gs)
// ---------------------------------------------------------------------------

function Pacientes_Repo_List_() {
  if (typeof Repo_list_ !== "function") {
    _pacientesThrow_("INTERNAL_ERROR", "Repo_list_ não disponível (Repository.gs não carregado?).", { missing: "Repo_list_" });
  }
  return Repo_list_(PACIENTES_ENTITY) || [];
}

/**
 * Lista pacientes com paginação real no backend.
 * Evita carregar todos os registros na memória.
 *
 * @param {Object} options - Opções de paginação
 * @param {number} options.limit - Limite de registros (padrão: 50)
 * @param {number} options.offset - Offset (skip) de registros (padrão: 0)
 * @returns {Object} { items: Array, total: number, hasMore: boolean }
 */
function Pacientes_Repo_ListPaged_(options) {
  if (typeof Repo_listPaged_ !== "function") {
    // Fallback para método antigo se Repo_listPaged_ não existir
    var all = Pacientes_Repo_List_();
    options = options || {};
    var limit = options.limit || 50;
    var offset = options.offset || 0;
    var items = all.slice(offset, offset + limit);
    return { items: items, total: all.length, hasMore: (offset + items.length) < all.length };
  }
  return Repo_listPaged_(PACIENTES_ENTITY, options);
}

function Pacientes_Repo_GetById_(idPaciente) {
  if (typeof Repo_getById_ !== "function") {
    _pacientesThrow_("INTERNAL_ERROR", "Repo_getById_ não disponível.", { missing: "Repo_getById_" });
  }
  var id = String(idPaciente || "").trim();
  if (!id) return null;

  var r1 = Repo_getById_(PACIENTES_ENTITY, "idPaciente", id);
  if (r1) return r1;

  // compat
  var r2 = Repo_getById_(PACIENTES_ENTITY, "ID_Paciente", id);
  if (r2) return r2;

  return null;
}

function Pacientes_Repo_Insert_(dto) {
  if (typeof Repo_insert_ !== "function") {
    _pacientesThrow_("INTERNAL_ERROR", "Repo_insert_ não disponível.", { missing: "Repo_insert_" });
  }
  return Repo_insert_(PACIENTES_ENTITY, dto);
}

function Pacientes_Repo_UpdateById_(idPaciente, patch) {
  if (typeof Repo_update_ !== "function") {
    _pacientesThrow_("INTERNAL_ERROR", "Repo_update_ não disponível.", { missing: "Repo_update_" });
  }
  var id = String(idPaciente || "").trim();
  if (!id) return false;

  var ok = Repo_update_(PACIENTES_ENTITY, "idPaciente", id, patch);
  if (ok) return true;

  // fallback compat
  ok = Repo_update_(PACIENTES_ENTITY, "ID_Paciente", id, patch);
  return !!ok;
}

function _pacPick_(obj, keys) {
  obj = obj || {};
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (obj[k] !== undefined && obj[k] !== null) {
      var s = String(obj[k]).trim();
      if (s) return obj[k];
    }
  }
  return "";
}

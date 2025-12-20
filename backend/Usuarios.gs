/**
 * ============================================================
 * PRONTIO - Usuarios.gs
 * ============================================================
 *
 * ✅ Atualização (compatibilidade de schema sem perder nada):
 * - Sua aba "Usuarios" hoje usa colunas como "NomeCompleto" (e não "Nome").
 * - O Auth precisa encontrar: ID_Usuario, Login, SenhaHash, Ativo (e Perfil).
 * - Este arquivo agora aceita aliases de header, sem exigir renomear planilha.
 */

var USUARIOS_SHEET_NAME = "Usuarios";

function handleUsuariosAction(action, payload) {
  switch (action) {
    case "Usuarios_Listar":
      return Usuarios_Listar_(payload);
    case "Usuarios_Criar":
      return Usuarios_Criar_(payload);
    case "Usuarios_Atualizar":
      return Usuarios_Atualizar_(payload);

    // ✅ NOVO: admin altera/reset senha pelo sistema
    case "Usuarios_AlterarSenha":
      return Usuarios_AlterarSenha_(payload);

    default:
      _usuariosThrow_("USUARIOS_UNKNOWN_ACTION", "Ação de usuários desconhecida: " + action, { action: action });
  }
}

/**
 * ✅ Ajuste mínimo:
 * - Se PRONTIO_getDb_ existir (DEV/PROD), usa ele.
 * - Senão, cai no SpreadsheetApp.getActiveSpreadsheet() (legado).
 */
function getUsuariosSheet_() {
  var ss;
  try {
    if (typeof PRONTIO_getDb_ === "function") ss = PRONTIO_getDb_();
    else ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (_) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  var sheet = ss.getSheetByName(USUARIOS_SHEET_NAME);
  if (!sheet) {
    _usuariosThrow_("USUARIOS_SHEET_NOT_FOUND", 'Aba de usuários não encontrada: "' + USUARIOS_SHEET_NAME + '".', null);
  }
  return sheet;
}

function gerarNovoUsuarioId_() {
  return "USR_" + Utilities.getUuid().split("-")[0].toUpperCase();
}

function hashSenha_(senha) {
  if (!senha) return "";
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(senha)
  );
  return Utilities.base64Encode(bytes);
}

function Usuarios_verifyPassword_(senha, senhaHash) {
  senha = (senha || "").toString();
  senhaHash = (senhaHash || "").toString();
  if (!senha || !senhaHash) return false;
  return hashSenha_(senha) === senhaHash;
}

function boolFromCell_(v) {
  if (v === true) return true;
  if (v === false) return false;
  var s = (v || "").toString().trim().toLowerCase();
  if (s === "true" || s === "1" || s === "sim" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "nao" || s === "não" || s === "no") return false;
  return false;
}

function _usuariosThrow_(code, message, details) {
  var err = new Error(String(message || "Erro."));
  err.code = String(code || (Errors && Errors.CODES ? Errors.CODES.INTERNAL_ERROR : "INTERNAL_ERROR"));
  err.details = (details === undefined ? null : details);
  throw err;
}

/**
 * ======================
 * Header helpers (aliases)
 * ======================
 */

function _uHeader_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (!values || !values.length) return { header: [], values: values || [] };
  var header = values[0].map(function (h) { return (h || "").toString().trim(); });
  return { header: header, values: values };
}

/**
 * Retorna índice da primeira coluna que bater com algum nome (case-sensitive no sheet, mas normalizamos trim).
 */
function _uFindCol_(header, names) {
  for (var i = 0; i < names.length; i++) {
    var idx = header.indexOf(names[i]);
    if (idx >= 0) return idx;
  }
  return -1;
}

/**
 * Mapeia índices aceitando aliases (compatível com seu schema atual).
 */
function _uBuildIdx_(header) {
  var idx = {
    // IDs
    id: _uFindCol_(header, ["ID_Usuario", "idUsuario", "id_usuario", "id"]),

    // Campos base
    nome: _uFindCol_(header, ["Nome", "NomeCompleto", "nome", "nomeCompleto"]),
    login: _uFindCol_(header, ["Login", "login", "emailLogin"]),
    email: _uFindCol_(header, ["Email", "E-mail", "email"]),
    perfil: _uFindCol_(header, ["Perfil", "perfil", "Role", "role"]),
    ativo: _uFindCol_(header, ["Ativo", "ativo", "Ativa"]),

    // Auth
    senhaHash: _uFindCol_(header, ["SenhaHash", "senhaHash", "PasswordHash", "passwordHash"]),

    // Datas
    criadoEm: _uFindCol_(header, ["CriadoEm", "criadoEm"]),
    atualizadoEm: _uFindCol_(header, ["AtualizadoEm", "atualizadoEm"]),
    ultimoLoginEm: _uFindCol_(header, ["UltimoLoginEm", "ÚltimoLoginEm", "ultimoLoginEm"]),

    // Extras (se existirem, a gente preserva)
    documentoRegistro: _uFindCol_(header, ["DocumentoRegistro", "documentoRegistro"]),
    especialidade: _uFindCol_(header, ["Especialidade", "especialidade"]),
    assinaturaDigitalBase64: _uFindCol_(header, ["AssinaturaDigitalBase64", "assinaturaDigitalBase64"]),
    corInterface: _uFindCol_(header, ["CorInterface", "corInterface"]),
    permissoesCustomizadas: _uFindCol_(header, ["PermissoesCustomizadas", "permissoesCustomizadas"])
  };

  return idx;
}

function _uGet_(row, idx) {
  if (idx < 0) return "";
  return row[idx];
}

/**
 * Lista todos os usuários (sem senha).
 */
function Usuarios_Listar_(payload) {
  var sheet = getUsuariosSheet_();
  var pack = _uHeader_(sheet);
  var values = pack.values;
  if (values.length <= 1) return [];

  var header = pack.header;
  var idx = _uBuildIdx_(header);

  if (idx.id < 0) _usuariosThrow_("USUARIOS_BAD_SCHEMA", 'Coluna de ID do usuário não encontrada (esperado: "ID_Usuario").', { header: header });

  var lista = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[idx.id]) continue;

    lista.push({
      id: String(_uGet_(row, idx.id) || ""),
      nome: idx.nome >= 0 ? String(_uGet_(row, idx.nome) || "") : "",
      login: idx.login >= 0 ? String(_uGet_(row, idx.login) || "") : "",
      email: idx.email >= 0 ? String(_uGet_(row, idx.email) || "") : "",
      perfil: idx.perfil >= 0 ? String(_uGet_(row, idx.perfil) || "") : "",
      ativo: idx.ativo >= 0 ? boolFromCell_(_uGet_(row, idx.ativo)) : false,
      criadoEm: idx.criadoEm >= 0 ? (_uGet_(row, idx.criadoEm) || "") : "",
      atualizadoEm: idx.atualizadoEm >= 0 ? (_uGet_(row, idx.atualizadoEm) || "") : "",
      ultimoLoginEm: idx.ultimoLoginEm >= 0 ? (_uGet_(row, idx.ultimoLoginEm) || "") : "",

      // extras (opcional)
      documentoRegistro: idx.documentoRegistro >= 0 ? String(_uGet_(row, idx.documentoRegistro) || "") : "",
      especialidade: idx.especialidade >= 0 ? String(_uGet_(row, idx.especialidade) || "") : "",
      assinaturaDigitalBase64: idx.assinaturaDigitalBase64 >= 0 ? String(_uGet_(row, idx.assinaturaDigitalBase64) || "") : "",
      corInterface: idx.corInterface >= 0 ? String(_uGet_(row, idx.corInterface) || "") : "",
      permissoesCustomizadas: idx.permissoesCustomizadas >= 0 ? (_uGet_(row, idx.permissoesCustomizadas) || "") : ""
    });
  }

  return lista;
}

/**
 * Busca usuário por login para autenticação (inclui senhaHash).
 */
function Usuarios_findByLoginForAuth_(login) {
  login = (login || "").toString().trim().toLowerCase();
  if (!login) return null;

  var sheet = getUsuariosSheet_();
  var pack = _uHeader_(sheet);
  var values = pack.values;
  if (values.length <= 1) return null;

  var header = pack.header;
  var idx = _uBuildIdx_(header);

  // Obrigatórios para Auth
  if (idx.id < 0 || idx.login < 0 || idx.senhaHash < 0 || idx.ativo < 0) {
    _usuariosThrow_("USUARIOS_BAD_SCHEMA", "Cabeçalho da aba Usuarios incompleto para autenticação.", {
      required: ["ID_Usuario", "Login", "SenhaHash", "Ativo"],
      header: header,
      idx: idx
    });
  }

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[idx.id]) continue;

    var rowLogin = String(_uGet_(row, idx.login) || "").trim().toLowerCase();
    if (rowLogin && rowLogin === login) {
      return {
        id: String(_uGet_(row, idx.id) || ""),
        nome: idx.nome >= 0 ? String(_uGet_(row, idx.nome) || "") : "",
        login: idx.login >= 0 ? String(_uGet_(row, idx.login) || "") : "",
        email: idx.email >= 0 ? String(_uGet_(row, idx.email) || "") : "",
        perfil: idx.perfil >= 0 ? String(_uGet_(row, idx.perfil) || "") : "",
        ativo: idx.ativo >= 0 ? boolFromCell_(_uGet_(row, idx.ativo)) : false,
        senhaHash: idx.senhaHash >= 0 ? String(_uGet_(row, idx.senhaHash) || "") : ""
      };
    }
  }

  return null;
}

/**
 * Marca UltimoLoginEm (best-effort).
 */
function Usuarios_markUltimoLogin_(id) {
  id = (id || "").toString().trim();
  if (!id) return { ok: false };

  var sheet = getUsuariosSheet_();
  var pack = _uHeader_(sheet);
  var values = pack.values;
  if (values.length <= 1) return { ok: false };

  var header = pack.header;
  var idx = _uBuildIdx_(header);

  if (idx.id < 0 || idx.ultimoLoginEm < 0) return { ok: false };

  var linha = -1;
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row[idx.id] && String(row[idx.id]) === id) {
      linha = i + 1;
      break;
    }
  }
  if (linha < 0) return { ok: false };

  sheet.getRange(linha, idx.ultimoLoginEm + 1).setValue(new Date());
  return { ok: true };
}

/**
 * Cria usuário.
 * Observação: respeita o header atual da aba (NomeCompleto, etc.)
 */
function Usuarios_Criar_(payload) {
  payload = payload || {};

  var nome = String(payload.nome || payload.nomeCompleto || "").trim();
  var login = String(payload.login || "").trim();
  var email = String(payload.email || "").trim();
  var perfil = String(payload.perfil || "").trim() || "secretaria";
  var senha = String(payload.senha || "");

  if (!nome) _usuariosThrow_("USUARIOS_NOME_OBRIGATORIO", "Nome é obrigatório.", null);
  if (!login) _usuariosThrow_("USUARIOS_LOGIN_OBRIGATORIO", "Login é obrigatório.", null);
  if (!senha) _usuariosThrow_("USUARIOS_SENHA_OBRIGATORIA", "Senha é obrigatória.", null);

  var sheet = getUsuariosSheet_();
  var pack = _uHeader_(sheet);
  var values = pack.values;
  if (values.length < 1) _usuariosThrow_("USUARIOS_BAD_SCHEMA", "Cabeçalho ausente na aba Usuarios.", null);

  var header = pack.header;
  var idx = _uBuildIdx_(header);

  if (idx.id < 0 || idx.login < 0 || idx.senhaHash < 0 || idx.ativo < 0) {
    _usuariosThrow_("USUARIOS_BAD_SCHEMA", "Cabeçalho da aba Usuarios incompleto.", { header: header, idx: idx });
  }

  // login duplicado
  var loginLower = login.toLowerCase();
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var rowLogin = String(_uGet_(row, idx.login) || "").trim().toLowerCase();
    if (rowLogin && rowLogin === loginLower) {
      _usuariosThrow_("USUARIOS_LOGIN_DUPLICADO", "Já existe um usuário com este login.", { login: login });
    }
  }

  var novoId = gerarNovoUsuarioId_();
  var agora = new Date();
  var senhaHash = hashSenha_(senha);

  var novaLinha = new Array(sheet.getLastColumn());
  // id
  novaLinha[idx.id] = novoId;

  // nome (coluna pode ser Nome ou NomeCompleto)
  if (idx.nome >= 0) novaLinha[idx.nome] = nome;

  if (idx.login >= 0) novaLinha[idx.login] = login;
  if (idx.email >= 0) novaLinha[idx.email] = email;
  if (idx.perfil >= 0) novaLinha[idx.perfil] = perfil;
  if (idx.ativo >= 0) novaLinha[idx.ativo] = true;
  if (idx.senhaHash >= 0) novaLinha[idx.senhaHash] = senhaHash;

  if (idx.criadoEm >= 0) novaLinha[idx.criadoEm] = agora;
  if (idx.atualizadoEm >= 0) novaLinha[idx.atualizadoEm] = agora;

  sheet.appendRow(novaLinha);

  return {
    id: novoId,
    nome: nome,
    login: login,
    email: email,
    perfil: perfil,
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora
  };
}

/**
 * Atualiza usuário.
 */
function Usuarios_Atualizar_(payload) {
  payload = payload || {};

  var id = String(payload.id || "").trim();
  var nome = String(payload.nome || payload.nomeCompleto || "").trim();
  var login = String(payload.login || "").trim();
  var email = String(payload.email || "").trim();
  var perfil = String(payload.perfil || "").trim() || "secretaria";

  var ativo;
  if (typeof payload.ativo === "boolean") ativo = payload.ativo;
  else ativo = boolFromCell_(payload.ativo);

  if (!id) _usuariosThrow_("USUARIOS_ID_OBRIGATORIO", "ID é obrigatório.", null);
  if (!nome) _usuariosThrow_("USUARIOS_NOME_OBRIGATORIO", "Nome é obrigatório.", null);
  if (!login) _usuariosThrow_("USUARIOS_LOGIN_OBRIGATORIO", "Login é obrigatório.", null);

  var sheet = getUsuariosSheet_();
  var pack = _uHeader_(sheet);
  var values = pack.values;
  if (values.length <= 1) _usuariosThrow_("USUARIOS_NAO_ENCONTRADO", "Usuário não encontrado.", { id: id });

  var header = pack.header;
  var idx = _uBuildIdx_(header);

  if (idx.id < 0 || idx.login < 0) _usuariosThrow_("USUARIOS_BAD_SCHEMA", "Cabeçalho da aba Usuarios incompleto.", { header: header, idx: idx });

  var linha = -1;
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row[idx.id] && String(row[idx.id]) === id) {
      linha = i + 1;
      break;
    }
  }
  if (linha === -1) _usuariosThrow_("USUARIOS_NAO_ENCONTRADO", "Usuário não encontrado.", { id: id });

  var loginLower = login.toLowerCase();
  for (var j = 1; j < values.length; j++) {
    var r = values[j];
    if (!r[idx.id]) continue;

    var idCheck = String(r[idx.id]);
    var loginCheck = String(_uGet_(r, idx.login) || "").trim().toLowerCase();

    if (idCheck !== id && loginCheck === loginLower) {
      _usuariosThrow_("USUARIOS_LOGIN_DUPLICADO", "Já existe outro usuário com este login.", { login: login });
    }
  }

  var agora = new Date();
  var rowValues = sheet.getRange(linha, 1, 1, sheet.getLastColumn()).getValues()[0];

  if (idx.nome >= 0) rowValues[idx.nome] = nome;
  if (idx.login >= 0) rowValues[idx.login] = login;
  if (idx.email >= 0) rowValues[idx.email] = email;
  if (idx.perfil >= 0) rowValues[idx.perfil] = perfil;
  if (idx.ativo >= 0) rowValues[idx.ativo] = ativo;
  if (idx.atualizadoEm >= 0) rowValues[idx.atualizadoEm] = agora;

  sheet.getRange(linha, 1, 1, rowValues.length).setValues([rowValues]);

  return {
    id: id,
    nome: nome,
    login: login,
    email: email,
    perfil: perfil,
    ativo: ativo,
    atualizadoEm: agora
  };
}

/**
 * ✅ NOVO: altera/reset senha de um usuário (admin).
 *
 * payload: { id, senha }
 */
function Usuarios_AlterarSenha_(payload) {
  payload = payload || {};

  var id = String(payload.id || "").trim();
  var senha = String(payload.senha || "");

  if (!id) _usuariosThrow_("USUARIOS_ID_OBRIGATORIO", "ID é obrigatório.", null);
  if (!senha) _usuariosThrow_("USUARIOS_SENHA_OBRIGATORIA", "Senha é obrigatória.", null);

  var sheet = getUsuariosSheet_();
  var pack = _uHeader_(sheet);
  var values = pack.values;
  if (values.length <= 1) _usuariosThrow_("USUARIOS_NAO_ENCONTRADO", "Usuário não encontrado.", { id: id });

  var header = pack.header;
  var idx = _uBuildIdx_(header);

  if (idx.id < 0 || idx.senhaHash < 0) {
    _usuariosThrow_("USUARIOS_BAD_SCHEMA", 'Cabeçalho deve conter "ID_Usuario" e "SenhaHash" (ou aliases).', { header: header, idx: idx });
  }

  var linha = -1;
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row[idx.id] && String(row[idx.id]) === id) {
      linha = i + 1;
      break;
    }
  }

  if (linha === -1) {
    _usuariosThrow_("USUARIOS_NAO_ENCONTRADO", "Usuário não encontrado.", { id: id });
  }

  var senhaHash = hashSenha_(senha);
  sheet.getRange(linha, idx.senhaHash + 1).setValue(senhaHash);

  if (idx.atualizadoEm >= 0) {
    sheet.getRange(linha, idx.atualizadoEm + 1).setValue(new Date());
  }

  return { ok: true, id: id };
}

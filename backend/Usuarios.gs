/**
 * ============================================================
 * PRONTIO - Usuarios.gs
 * ============================================================
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
    default:
      _usuariosThrow_("USUARIOS_UNKNOWN_ACTION", "Ação de usuários desconhecida: " + action, { action: action });
  }
}

function getUsuariosSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
    String(senha) // ✅ normaliza
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
 * Lista todos os usuários (sem senha).
 */
function Usuarios_Listar_(payload) {
  var sheet = getUsuariosSheet_();
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var header = values[0].map(function (h) { return (h || "").toString().trim(); });

  var idx = {
    id: header.indexOf("ID_Usuario"),
    nome: header.indexOf("Nome"),
    login: header.indexOf("Login"),
    email: header.indexOf("Email"),
    perfil: header.indexOf("Perfil"),
    ativo: header.indexOf("Ativo"),
    criadoEm: header.indexOf("CriadoEm"),
    atualizadoEm: header.indexOf("AtualizadoEm"),
    ultimoLoginEm: header.indexOf("UltimoLoginEm")
  };

  if (idx.id < 0) _usuariosThrow_("USUARIOS_BAD_SCHEMA", 'Coluna "ID_Usuario" não encontrada.', idx);

  var lista = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[idx.id]) continue;

    lista.push({
      id: row[idx.id],
      nome: idx.nome >= 0 ? (row[idx.nome] || "") : "",
      login: idx.login >= 0 ? (row[idx.login] || "") : "",
      email: idx.email >= 0 ? (row[idx.email] || "") : "",
      perfil: idx.perfil >= 0 ? (row[idx.perfil] || "") : "",
      ativo: idx.ativo >= 0 ? boolFromCell_(row[idx.ativo]) : false,
      criadoEm: idx.criadoEm >= 0 ? (row[idx.criadoEm] || "") : "",
      atualizadoEm: idx.atualizadoEm >= 0 ? (row[idx.atualizadoEm] || "") : "",
      ultimoLoginEm: idx.ultimoLoginEm >= 0 ? (row[idx.ultimoLoginEm] || "") : ""
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
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return null;

  var header = values[0].map(function (h) { return (h || "").toString().trim(); });

  var idx = {
    id: header.indexOf("ID_Usuario"),
    nome: header.indexOf("Nome"),
    login: header.indexOf("Login"),
    email: header.indexOf("Email"),
    perfil: header.indexOf("Perfil"),
    ativo: header.indexOf("Ativo"),
    senhaHash: header.indexOf("SenhaHash")
  };

  if (idx.id < 0 || idx.login < 0 || idx.senhaHash < 0 || idx.ativo < 0) {
    _usuariosThrow_("USUARIOS_BAD_SCHEMA", "Cabeçalho da aba Usuarios incompleto para autenticação.", idx);
  }

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[idx.id]) continue;

    var rowLogin = (row[idx.login] || "").toString().trim().toLowerCase();
    if (rowLogin && rowLogin === login) {
      return {
        id: (row[idx.id] || "").toString(),
        nome: idx.nome >= 0 ? (row[idx.nome] || "") : "",
        login: idx.login >= 0 ? (row[idx.login] || "") : "",
        email: idx.email >= 0 ? (row[idx.email] || "") : "",
        perfil: idx.perfil >= 0 ? (row[idx.perfil] || "") : "",
        ativo: idx.ativo >= 0 ? boolFromCell_(row[idx.ativo]) : false,
        senhaHash: idx.senhaHash >= 0 ? (row[idx.senhaHash] || "") : ""
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
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return { ok: false };

  var header = values[0].map(function (h) { return (h || "").toString().trim(); });

  var idx = {
    id: header.indexOf("ID_Usuario"),
    ultimoLoginEm: header.indexOf("UltimoLoginEm")
  };

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
 */
function Usuarios_Criar_(payload) {
  payload = payload || {};

  var nome = (payload.nome || "").trim();
  var login = (payload.login || "").trim();
  var email = (payload.email || "").trim();
  var perfil = (payload.perfil || "").trim() || "secretaria";
  var senha = payload.senha || "";

  if (!nome) _usuariosThrow_("USUARIOS_NOME_OBRIGATORIO", "Nome é obrigatório.", null);
  if (!login) _usuariosThrow_("USUARIOS_LOGIN_OBRIGATORIO", "Login é obrigatório.", null);
  if (!senha) _usuariosThrow_("USUARIOS_SENHA_OBRIGATORIA", "Senha é obrigatória.", null);

  var sheet = getUsuariosSheet_();
  var values = sheet.getDataRange().getValues();
  if (values.length < 1) _usuariosThrow_("USUARIOS_BAD_SCHEMA", "Cabeçalho ausente na aba Usuarios.", null);

  var header = values[0].map(function (h) { return (h || "").toString().trim(); });

  var idx = {
    id: header.indexOf("ID_Usuario"),
    nome: header.indexOf("Nome"),
    login: header.indexOf("Login"),
    email: header.indexOf("Email"),
    perfil: header.indexOf("Perfil"),
    ativo: header.indexOf("Ativo"),
    senhaHash: header.indexOf("SenhaHash"),
    criadoEm: header.indexOf("CriadoEm"),
    atualizadoEm: header.indexOf("AtualizadoEm")
  };

  if (idx.id < 0 || idx.login < 0 || idx.senhaHash < 0 || idx.ativo < 0) {
    _usuariosThrow_("USUARIOS_BAD_SCHEMA", "Cabeçalho da aba Usuarios incompleto.", idx);
  }

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var rowLogin = (row[idx.login] || "").toString().trim().toLowerCase();
    if (rowLogin && rowLogin === login.toLowerCase()) {
      _usuariosThrow_("USUARIOS_LOGIN_DUPLICADO", "Já existe um usuário com este login.", { login: login });
    }
  }

  var novoId = gerarNovoUsuarioId_();
  var agora = new Date();
  var senhaHash = hashSenha_(senha);

  var novaLinha = new Array(sheet.getLastColumn());
  novaLinha[idx.id] = novoId;
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

  var id = (payload.id || "").trim();
  var nome = (payload.nome || "").trim();
  var login = (payload.login || "").trim();
  var email = (payload.email || "").trim();
  var perfil = (payload.perfil || "").trim() || "secretaria";

  var ativo;
  if (typeof payload.ativo === "boolean") ativo = payload.ativo;
  else ativo = boolFromCell_(payload.ativo);

  if (!id) _usuariosThrow_("USUARIOS_ID_OBRIGATORIO", "ID é obrigatório.", null);
  if (!nome) _usuariosThrow_("USUARIOS_NOME_OBRIGATORIO", "Nome é obrigatório.", null);
  if (!login) _usuariosThrow_("USUARIOS_LOGIN_OBRIGATORIO", "Login é obrigatório.", null);

  var sheet = getUsuariosSheet_();
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) _usuariosThrow_("USUARIOS_NAO_ENCONTRADO", "Usuário não encontrado.", { id: id });

  var header = values[0].map(function (h) { return (h || "").toString().trim(); });

  var idx = {
    id: header.indexOf("ID_Usuario"),
    nome: header.indexOf("Nome"),
    login: header.indexOf("Login"),
    email: header.indexOf("Email"),
    perfil: header.indexOf("Perfil"),
    ativo: header.indexOf("Ativo"),
    atualizadoEm: header.indexOf("AtualizadoEm")
  };

  if (idx.id < 0 || idx.login < 0) _usuariosThrow_("USUARIOS_BAD_SCHEMA", "Cabeçalho da aba Usuarios incompleto.", idx);

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
    var loginCheck = (r[idx.login] || "").toString().trim().toLowerCase();

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

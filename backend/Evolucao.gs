// Evolucao.gs
// ---------------------------------------------------------------------------
// Módulo de backend para Evolução Clínica do PRONTIO.
// Compatível com:
//  - Evolucao.Criar
//  - Evolucao.Salvar
//  - Evolucao.Inativar
//  - Evolucao.ListarPorPaciente
//  - Evolucao.ListarRecentesPorPaciente
//  - ✅ Evolucao.ListarPorAgenda (usado em "Evoluções deste atendimento")
// Usa createApiResponse_() (padrão oficial da API).
// ---------------------------------------------------------------------------

var EVOLUCAO_SHEET_NAME = "Evolucao";

// Índices das colunas na linha (0-based)
var EV_COL = {
  ID_Evolucao: 0,
  ID_Paciente: 1,
  ID_Agenda: 2,
  DataHora: 3,           // "DataHora" (data/hora da evolução)
  Tipo: 4,               // TipoEvolucao / Tipo
  Texto: 5,
  Profissional: 6,
  Ativo: 7,
  DataHoraRegistro: 8    // ISO de quando foi registrada
};

/**
 * Roteador interno do módulo Evolução.
 */
function handleEvolucaoAction(action, payload) {
  try {
    if (action === "Evolucao.Criar") {
      return evolucaoSalvar_(payload, true);
    }

    if (action === "Evolucao.Salvar") {
      return evolucaoSalvar_(payload, false);
    }

    if (action === "Evolucao.Inativar") {
      return evolucaoInativar_(payload);
    }

    if (action === "Evolucao.ListarPorPaciente") {
      return evolucaoListarPorPaciente_(payload);
    }

    if (action === "Evolucao.ListarRecentesPorPaciente") {
      return evolucaoListarRecentesPorPaciente_(payload);
    }

    // ✅ NOVA AÇÃO: listar por agendamento (usada em "Evoluções deste atendimento")
    if (action === "Evolucao.ListarPorAgenda") {
      return evolucaoListarPorAgenda_(payload);
    }

    return createApiResponse_(false, null, [
      "Ação não reconhecida em Evolucao: " + action
    ]);
  } catch (e) {
    return createApiResponse_(false, null, [
      "Erro interno em Evolucao: " + e.toString()
    ]);
  }
}

/**
 * Cria a aba, se não existir.
 * Cabeçalho:
 *  ID_Evolucao | ID_Paciente | ID_Agenda | DataHora | Tipo | Texto | Profissional | Ativo | DataHoraRegistro
 */
function getEvolucaoSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(EVOLUCAO_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(EVOLUCAO_SHEET_NAME);
    var header = [
      "ID_Evolucao",
      "ID_Paciente",
      "ID_Agenda",
      "DataHora",
      "Tipo",
      "Texto",
      "Profissional",
      "Ativo",
      "DataHoraRegistro"
    ];
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  }

  return sheet;
}

/**
 * Constrói objeto Evolução a partir de uma linha.
 */
function buildEvolucaoFromRow_(row) {
  var ativoCell = row[EV_COL.Ativo];

  var ativo = true;
  if (
    ativoCell === false ||
    String(ativoCell).toUpperCase() === "FALSE" ||
    String(ativoCell).toUpperCase() === "N"
  ) {
    ativo = false;
  }

  return {
    idEvolucao: row[EV_COL.ID_Evolucao] || "",
    idPaciente: row[EV_COL.ID_Paciente] || "",
    idAgenda: row[EV_COL.ID_Agenda] || "",
    dataEvolucao: row[EV_COL.DataHora] || "",
    tipoEvolucao: row[EV_COL.Tipo] || "",
    texto: row[EV_COL.Texto] || "",
    profissional: row[EV_COL.Profissional] || "",
    ativo: ativo,
    dataHoraRegistro: row[EV_COL.DataHoraRegistro] || ""
  };
}

/**
 * Data de hoje (yyyy-MM-dd)
 */
function hojeIsoData_() {
  var hoje = new Date();
  return hoje.getFullYear() +
    "-" + ("0" + (hoje.getMonth() + 1)).slice(-2) +
    "-" + ("0" + hoje.getDate()).slice(-2);
}

/**
 * Helpers de leitura segura (ES5)
 */
function _evGetStr_(obj, key) {
  if (!obj) return "";
  var v = obj[key];
  if (v === null || typeof v === "undefined") return "";
  return String(v).trim();
}

/**
 * Criar ou atualizar evolução.
 *
 * compatCriar = true  → Evolucao.Criar  (sempre força nova evolução, data hoje)
 * compatCriar = false → Evolucao.Salvar (atualiza se idEvolucao vier preenchido)
 */
function evolucaoSalvar_(payload, compatCriar) {
  var sheet = getEvolucaoSheet_();
  payload = payload || {};

  var idPaciente   = _evGetStr_(payload, "idPaciente");
  var texto        = _evGetStr_(payload, "texto");

  var tipoEvolucao = _evGetStr_(payload, "tipoEvolucao");
  if (!tipoEvolucao) tipoEvolucao = _evGetStr_(payload, "tipo");

  var profissional = _evGetStr_(payload, "profissional");
  var idEvolucao   = _evGetStr_(payload, "idEvolucao");
  var dataEvolucao = _evGetStr_(payload, "dataEvolucao");

  var idAgenda     = _evGetStr_(payload, "idAgenda");
  if (!idAgenda) idAgenda = _evGetStr_(payload, "ID_Agenda");

  if (!idPaciente)
    return createApiResponse_(false, null, ["idPaciente é obrigatório."]);

  if (!texto)
    return createApiResponse_(false, null, ["texto é obrigatório."]);

  // Evolucao.Criar sempre cria nova evolução
  if (compatCriar) {
    idEvolucao = "";
    dataEvolucao = hojeIsoData_();
  }

  if (!dataEvolucao) {
    dataEvolucao = hojeIsoData_();
  }

  var dataHoraRegistro = new Date().toISOString();

  // ------------------------
  // NOVA EVOLUÇÃO
  // ------------------------
  if (!idEvolucao) {
    idEvolucao = Utilities.getUuid();

    var novaLinha = [];
    novaLinha[EV_COL.ID_Evolucao] = idEvolucao;
    novaLinha[EV_COL.ID_Paciente] = idPaciente;
    novaLinha[EV_COL.ID_Agenda] = idAgenda;
    novaLinha[EV_COL.DataHora] = dataEvolucao;
    novaLinha[EV_COL.Tipo] = tipoEvolucao;
    novaLinha[EV_COL.Texto] = texto;
    novaLinha[EV_COL.Profissional] = profissional;
    novaLinha[EV_COL.Ativo] = true;
    novaLinha[EV_COL.DataHoraRegistro] = dataHoraRegistro;

    sheet.appendRow(novaLinha);

    var evoObj = buildEvolucaoFromRow_(novaLinha);
    return createApiResponse_(true, { evolucao: evoObj }, []);
  }

  // ------------------------
  // ATUALIZAÇÃO
  // ------------------------
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return createApiResponse_(false, null, [
      "Nenhuma evolução encontrada para atualizar."
    ]);
  }

  var dados = values.slice(1);
  var linhaPlanilha = -1;

  for (var i = 0; i < dados.length; i++) {
    if (String(dados[i][EV_COL.ID_Evolucao]) === idEvolucao) {
      linhaPlanilha = i + 2;
      break;
    }
  }

  if (linhaPlanilha === -1) {
    return createApiResponse_(false, null, [
      "Evolução não encontrada para o ID informado."
    ]);
  }

  // Atualiza colunas
  sheet.getRange(linhaPlanilha, EV_COL.ID_Paciente + 1).setValue(idPaciente);
  sheet.getRange(linhaPlanilha, EV_COL.ID_Agenda + 1).setValue(idAgenda);
  sheet.getRange(linhaPlanilha, EV_COL.DataHora + 1).setValue(dataEvolucao);
  sheet.getRange(linhaPlanilha, EV_COL.Tipo + 1).setValue(tipoEvolucao);
  sheet.getRange(linhaPlanilha, EV_COL.Texto + 1).setValue(texto);
  sheet.getRange(linhaPlanilha, EV_COL.Profissional + 1).setValue(profissional);
  sheet.getRange(linhaPlanilha, EV_COL.Ativo + 1).setValue(true);
  sheet.getRange(linhaPlanilha, EV_COL.DataHoraRegistro + 1).setValue(dataHoraRegistro);

  var rowAtualizada = sheet.getRange(
    linhaPlanilha,
    1,
    1,
    EV_COL.DataHoraRegistro + 1
  ).getValues()[0];
  var evoObjAtual = buildEvolucaoFromRow_(rowAtualizada);

  return createApiResponse_(true, { evolucao: evoObjAtual }, []);
}

/**
 * Inativar evolução (soft delete)
 */
function evolucaoInativar_(payload) {
  payload = payload || {};
  var idEvolucao = _evGetStr_(payload, "idEvolucao");

  if (!idEvolucao)
    return createApiResponse_(false, null, ["idEvolucao é obrigatório."]);

  var sheet = getEvolucaoSheet_();
  var values = sheet.getDataRange().getValues();

  if (values.length <= 1)
    return createApiResponse_(false, null, ["Nenhuma evolução cadastrada."]);

  var dados = values.slice(1);
  var linhaPlanilha = -1;

  for (var i = 0; i < dados.length; i++) {
    if (String(dados[i][EV_COL.ID_Evolucao]) === idEvolucao) {
      linhaPlanilha = i + 2;
      break;
    }
  }

  if (linhaPlanilha === -1)
    return createApiResponse_(false, null, ["Evolução não encontrada."]);

  sheet.getRange(linhaPlanilha, EV_COL.Ativo + 1).setValue(false);

  return createApiResponse_(true, {
    idEvolucao: idEvolucao,
    inativado: true
  }, []);
}

/**
 * Listar evoluções ativas de um paciente.
 */
function evolucaoListarPorPaciente_(payload) {
  payload = payload || {};
  var idPaciente = _evGetStr_(payload, "idPaciente");

  if (!idPaciente)
    return createApiResponse_(false, null, ["idPaciente é obrigatório."]);

  // P2: Suporte a paginação com limite
  var limit = payload.limit ? Number(payload.limit) : 0;
  if (isNaN(limit) || limit < 0) limit = 0;
  if (limit > 500) limit = 500;

  var cursor = payload.cursor ? String(payload.cursor).trim() : "";

  var sheet = getEvolucaoSheet_();
  var lastRow = sheet.getLastRow();

  if (lastRow <= 1)
    return createApiResponse_(true, { evolucoes: [], hasMore: false, nextCursor: null }, []);

  // P2: Lê apenas as colunas necessárias para filtro inicial (ID_Paciente, Ativo)
  var idPacienteCol = EV_COL.ID_Paciente + 1;
  var ativoCol = EV_COL.Ativo + 1;
  var numCols = sheet.getLastColumn();

  var values = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
  var evolucoes = [];

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var rowIdPaciente = String(row[EV_COL.ID_Paciente] || "");
    var rowAtivo = row[EV_COL.Ativo];

    // Filtro rápido antes de construir objeto
    if (rowIdPaciente !== idPaciente) continue;

    var isAtivo = true;
    if (rowAtivo === false || String(rowAtivo).toUpperCase() === "FALSE" || String(rowAtivo).toUpperCase() === "N") {
      isAtivo = false;
    }
    if (!isAtivo) continue;

    var evoObj = buildEvolucaoFromRow_(row);
    evolucoes.push(evoObj);

    // P2: Se temos limite e já coletamos 3x o limite, podemos parar de iterar
    // (margem para ordenação e cursor)
    if (limit > 0 && evolucoes.length >= limit * 3) break;
  }

  // Ordenar por DataEvolucao + DataHoraRegistro (mais recentes primeiro)
  evolucoes.sort(function (a, b) {
    var keyA = (a.dataEvolucao || "") + (a.dataHoraRegistro || "");
    var keyB = (b.dataEvolucao || "") + (b.dataHoraRegistro || "");
    return keyA > keyB ? -1 : keyA < keyB ? 1 : 0;
  });

  // P2: Aplica cursor se fornecido
  if (cursor) {
    var cursorIdx = -1;
    for (var j = 0; j < evolucoes.length; j++) {
      var evKey = (evolucoes[j].dataEvolucao || "") + (evolucoes[j].dataHoraRegistro || "");
      if (evKey < cursor) {
        cursorIdx = j;
        break;
      }
    }
    if (cursorIdx > 0) {
      evolucoes = evolucoes.slice(cursorIdx);
    } else if (cursorIdx === -1 && cursor) {
      evolucoes = []; // cursor além do fim
    }
  }

  // P2: Aplica limite
  var hasMore = false;
  var nextCursor = null;
  if (limit > 0 && evolucoes.length > limit) {
    hasMore = true;
    evolucoes = evolucoes.slice(0, limit);
    if (evolucoes.length > 0) {
      var last = evolucoes[evolucoes.length - 1];
      nextCursor = (last.dataEvolucao || "") + (last.dataHoraRegistro || "");
    }
  }

  return createApiResponse_(true, { evolucoes: evolucoes, hasMore: hasMore, nextCursor: nextCursor }, []);
}

/**
 * Lista evoluções ativas ligadas a um ID_Agenda.
 */
function evolucaoListarPorAgenda_(payload) {
  payload = payload || {};
  var idAgenda = _evGetStr_(payload, "idAgenda");

  if (!idAgenda)
    return createApiResponse_(false, null, ["idAgenda é obrigatório."]);

  var sheet = getEvolucaoSheet_();
  var values = sheet.getDataRange().getValues();

  if (values.length <= 1)
    return createApiResponse_(true, { evolucoes: [] }, []);

  var dados = values.slice(1);
  var evolucoes = [];

  for (var i = 0; i < dados.length; i++) {
    var evoObj = buildEvolucaoFromRow_(dados[i]);

    if (String(evoObj.idAgenda || "") === idAgenda && evoObj.ativo) {
      evolucoes.push(evoObj);
    }
  }

  // Ordena por data/hora de registro
  evolucoes.sort(function (a, b) {
    var da = a.dataHoraRegistro || "";
    var db = b.dataHoraRegistro || "";
    if (da < db) return -1;
    if (da > db) return 1;
    return 0;
  });

  return createApiResponse_(true, { evolucoes: evolucoes }, []);
}

/**
 * Lista apenas as N últimas evoluções ativas de um paciente.
 */
function evolucaoListarRecentesPorPaciente_(payload) {
  var limite = (payload && payload.limite) || 5;

  var baseResp = evolucaoListarPorPaciente_(payload);
  if (!baseResp || baseResp.success === false) {
    return baseResp;
  }

  var evolucoes = (baseResp.data && baseResp.data.evolucoes) || [];

  if (limite > 0 && evolucoes.length > limite) {
    evolucoes = evolucoes.slice(0, limite);
  }

  return createApiResponse_(true, { evolucoes: evolucoes }, []);
}

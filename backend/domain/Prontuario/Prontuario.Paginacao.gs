function _prontuarioEvolucaoListarPorPacientePaged_(payload) {
  var idPaciente = String(payload.idPaciente || "").trim();

  var limit = payload && payload.limit ? Number(payload.limit) : 40;
  if (!limit || isNaN(limit) || limit < 1) limit = 40;
  if (limit > 200) limit = 200;

  var cursorRaw = payload && payload.cursor ? String(payload.cursor) : "";
  cursorRaw = cursorRaw ? cursorRaw.trim() : "";

  // P2: Delega paginação diretamente para Evolucao.gs
  var resp = _prontuarioDelegarEvolucao_("Evolucao.ListarPorPaciente", {
    idPaciente: idPaciente,
    limit: limit,
    cursor: cursorRaw
  }) || {};

  // Extrai dados - pode vir em resp.data (createApiResponse_) ou resp (direto)
  var dados = (resp && resp.data) ? resp.data : resp;
  var lista = (dados && dados.evolucoes) || [];
  var hasMore = !!(dados && dados.hasMore);
  var nextCursor = (dados && dados.nextCursor) || null;

  // Se o backend não suportar paginação (legado), faz fallback local
  if (!dados.hasOwnProperty("hasMore")) {
    lista = (dados && (dados.evolucoes || dados.lista)) ||
      (Array.isArray(dados) ? dados : []) ||
      [];

    var cursorMs = cursorRaw ? _prontuarioParseDateMs_(cursorRaw) : null;

    lista = (lista || []).slice().sort(function (a, b) {
      var ta = (a && (a.dataHoraRegistro || a.dataHora || a.data || a.criadoEm)) || "";
      var tb = (b && (b.dataHoraRegistro || b.dataHora || b.data || b.criadoEm)) || "";
      return _prontuarioParseDateMs_(tb) - _prontuarioParseDateMs_(ta);
    });

    if (cursorMs !== null && !isNaN(cursorMs)) {
      var filtered = [];
      for (var i = 0; i < lista.length; i++) {
        var ts = (lista[i] && (lista[i].dataHoraRegistro || lista[i].dataHora || lista[i].data || lista[i].criadoEm)) || "";
        var ms = _prontuarioParseDateMs_(ts);
        if (ms < cursorMs) filtered.push(lista[i]);
      }
      lista = filtered;
    }

    hasMore = lista.length > limit;
    lista = lista.slice(0, limit);

    if (lista.length) {
      var last = lista[lista.length - 1];
      nextCursor = String((last && (last.dataHoraRegistro || last.dataHora || last.data || last.criadoEm)) || "").trim() || null;
    }
  }

  return {
    idPaciente: idPaciente,
    limit: limit,
    cursor: cursorRaw || null,
    nextCursor: nextCursor,
    hasMore: !!(hasMore && nextCursor),
    items: lista
  };
}

function _prontuarioReceitaListarPorPacientePaged_(payload) {
  var idPaciente = String(payload.idPaciente || "").trim();

  var limit = payload && payload.limit ? Number(payload.limit) : 25;
  if (!limit || isNaN(limit) || limit < 1) limit = 25;
  if (limit > 150) limit = 150;

  var cursorRaw = payload && payload.cursor ? String(payload.cursor) : "";
  cursorRaw = cursorRaw ? cursorRaw.trim() : "";

  // P2: Delega paginação diretamente para Receita.gs
  var resp = _prontuarioDelegarReceita_("Receita.ListarPorPaciente", {
    idPaciente: idPaciente,
    limit: limit,
    cursor: cursorRaw
  }) || {};

  // Extrai dados - pode vir em resp.data (createApiResponse_) ou resp (direto)
  var dados = (resp && resp.data) ? resp.data : resp;
  var lista = (dados && dados.receitas) || [];
  var hasMore = !!(dados && dados.hasMore);
  var nextCursor = (dados && dados.nextCursor) || null;

  // Se o backend não suportar paginação (legado), faz fallback local
  if (!dados.hasOwnProperty("hasMore")) {
    lista = (dados && (dados.receitas || dados.lista)) ||
      (Array.isArray(dados) ? dados : []) ||
      [];

    var cursorMs = cursorRaw ? _prontuarioParseDateMs_(cursorRaw) : null;

    lista = (lista || []).slice().sort(function (a, b) {
      var ta = (a && (a.dataHoraCriacao || a.dataHora || a.data || a.criadoEm)) || "";
      var tb = (b && (b.dataHoraCriacao || b.dataHora || b.data || b.criadoEm)) || "";
      return _prontuarioParseDateMs_(tb) - _prontuarioParseDateMs_(ta);
    });

    if (cursorMs !== null && !isNaN(cursorMs)) {
      var filtered = [];
      for (var i = 0; i < lista.length; i++) {
        var ts = (lista[i] && (lista[i].dataHoraCriacao || lista[i].dataHora || lista[i].data || lista[i].criadoEm)) || "";
        var ms = _prontuarioParseDateMs_(ts);
        if (ms < cursorMs) filtered.push(lista[i]);
      }
      lista = filtered;
    }

    hasMore = lista.length > limit;
    lista = lista.slice(0, limit);

    if (lista.length) {
      var last = lista[lista.length - 1];
      nextCursor = String((last && (last.dataHoraCriacao || last.dataHora || last.data || last.criadoEm)) || "").trim() || null;
    }
  }

  return {
    idPaciente: idPaciente,
    limit: limit,
    cursor: cursorRaw || null,
    nextCursor: nextCursor,
    hasMore: !!(hasMore && nextCursor),
    items: lista
  };
}

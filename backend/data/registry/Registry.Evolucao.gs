function Registry_RegisterEvolucao_(map) {
  function _evolucaoHandler_(actionName) {
    return function (ctx, payload) {
      if (typeof handleEvolucaoAction !== "function") {
        var e = new Error("handleEvolucaoAction não disponível.");
        e.code = "INTERNAL_ERROR";
        e.details = { action: actionName };
        throw e;
      }
      return handleEvolucaoAction(actionName, payload || {});
    };
  }

  // ===================== ESCRITA (com lock) ===================
  map["Evolucao.Criar"] = {
    action: "Evolucao.Criar",
    handler: _evolucaoHandler_("Evolucao.Criar"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "EVOLUCAO"
  };

  map["Evolucao.Salvar"] = {
    action: "Evolucao.Salvar",
    handler: _evolucaoHandler_("Evolucao.Salvar"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "EVOLUCAO"
  };

  map["Evolucao.Inativar"] = {
    action: "Evolucao.Inativar",
    handler: _evolucaoHandler_("Evolucao.Inativar"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "EVOLUCAO"
  };

  // ===================== LEITURA ==============================
  map["Evolucao.ListarPorPaciente"] = {
    action: "Evolucao.ListarPorPaciente",
    handler: _evolucaoHandler_("Evolucao.ListarPorPaciente"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["Evolucao.ListarRecentesPorPaciente"] = {
    action: "Evolucao.ListarRecentesPorPaciente",
    handler: _evolucaoHandler_("Evolucao.ListarRecentesPorPaciente"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["Evolucao.ListarPorAgenda"] = {
    action: "Evolucao.ListarPorAgenda",
    handler: _evolucaoHandler_("Evolucao.ListarPorAgenda"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  // ===================== ALIASES UNDERSCORE ===================
  map["Evolucao_Criar"] = {
    action: "Evolucao_Criar",
    handler: map["Evolucao.Criar"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "EVOLUCAO"
  };

  map["Evolucao_Salvar"] = {
    action: "Evolucao_Salvar",
    handler: map["Evolucao.Salvar"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "EVOLUCAO"
  };

  map["Evolucao_Inativar"] = {
    action: "Evolucao_Inativar",
    handler: map["Evolucao.Inativar"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "EVOLUCAO"
  };

  map["Evolucao_ListarPorPaciente"] = {
    action: "Evolucao_ListarPorPaciente",
    handler: map["Evolucao.ListarPorPaciente"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["Evolucao_ListarRecentesPorPaciente"] = {
    action: "Evolucao_ListarRecentesPorPaciente",
    handler: map["Evolucao.ListarRecentesPorPaciente"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["Evolucao_ListarPorAgenda"] = {
    action: "Evolucao_ListarPorAgenda",
    handler: map["Evolucao.ListarPorAgenda"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };
}

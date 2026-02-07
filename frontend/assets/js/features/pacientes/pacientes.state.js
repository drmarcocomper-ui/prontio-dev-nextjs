// frontend/assets/js/features/pacientes/pacientes.state.js
/**
 * PRONTIO — Pacientes State (Front)
 * ------------------------------------------------------------
 * Factory que cria e gerencia o estado do módulo Pacientes.
 * Centraliza todas as variáveis de estado.
 */

(function (global) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.features = PRONTIO.features || {};
  PRONTIO.features.pacientes = PRONTIO.features.pacientes || {};

  // ========================================
  // Cache Local (stale-while-revalidate)
  // ========================================
  const CACHE_KEY = "prontio.pacientes.cache";
  const CACHE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutos (P1: aumentado de 5 para 10)

  function getPacientesFromCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;

      const cached = JSON.parse(raw);
      if (!cached || !cached.timestamp || !Array.isArray(cached.items)) return null;

      const age = Date.now() - cached.timestamp;
      if (age > CACHE_MAX_AGE_MS) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return cached.items;
    } catch (_) {
      return null;
    }
  }

  function savePacientesToCache(items) {
    try {
      const cached = {
        timestamp: Date.now(),
        items: items || []
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch (_) {
      // localStorage cheio ou indisponível
    }
  }

  // ========================================
  // Colunas visíveis por padrão
  // ========================================
  const DEFAULT_VISIBLE_COLS = {
    dataCadastro: false,
    dataNascimento: false,
    sexo: false,
    cpf: true,
    rg: false,
    telefone1: true,
    telefone2: false,
    email: false,
    enderecoBairro: false,
    enderecoCidade: false,
    enderecoUf: false,
    obsImportantes: false,
    planoSaude: false,
    numeroCarteirinha: false,
    ativo: true,
    nomeSocial: false,
    estadoCivil: false,
    rgOrgaoEmissor: false,
    cep: false,
    logradouro: false,
    numero: false,
    complemento: false,
    observacoesClinicas: false,
    observacoesAdministrativas: false
  };

  // ========================================
  // Factory
  // ========================================
  function createPacientesState() {
    return {
      // Paciente selecionado na tabela
      pacienteSelecionadoId: null,
      pacienteSelecionadoNomeCompleto: null,
      pacienteSelecionadoAtivo: null,

      // Cache local de pacientes carregados
      pacientesCache: [],

      // Modo de edição
      modoEdicao: false,
      idEmEdicao: null,

      // Ordenação
      criterioOrdenacao: "dataCadastroDesc",

      // Controles
      debounceTimer: null,
      carregando: false,

      // Paginação
      usarPaginacao: false,
      pageAtual: 1,
      pageSizeAtual: 50,
      lastPaging: null,

      // Modal de confirmação
      confirmacaoCallback: null,

      // Modal de visualização
      pacienteVisualizandoId: null,

      // Referência para DOM
      dom: null
    };
  }

  // ========================================
  // Export
  // ========================================
  PRONTIO.features.pacientes.state = {
    createPacientesState,
    getPacientesFromCache,
    savePacientesToCache,
    DEFAULT_VISIBLE_COLS
  };

})(window);

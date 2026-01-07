// =====================================
// PRONTIO - pages/page-configuracoes.js
// Página de Configurações do PRONTIO
//
// ✅ Alinhado ao Registry.gs:
// - AgendaConfig: AgendaConfig.Obter / AgendaConfig.Salvar (com fallback underscore)
// - Clínica: Clinica_Get / Clinica_Update
//
// Observações de compat:
// - Se o usuário não tiver role admin, Clinica_Update pode retornar PERMISSION_DENIED.
//   Nesse caso, a página ainda salva AgendaConfig, e mostra aviso para Clínica.
// =====================================

(function (global, document) {
  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  const api = PRONTIO.api || {};

  const callApiData =
    typeof api.callApiData === "function"
      ? api.callApiData
      : typeof global.callApiData === "function"
      ? global.callApiData
      : null;

  // Widgets de mensagem (toast) – se disponíveis
  const widgets = (PRONTIO.widgets = PRONTIO.widgets || {});
  const toastWidget = widgets.toast || null;
  const pageMessages =
    toastWidget && typeof toastWidget.createPageMessages === "function"
      ? toastWidget.createPageMessages("#mensagemConfig")
      : null;

  // -----------------------------------------
  // Helpers de mensagem
  // -----------------------------------------
  function mostrarMensagemConfig(texto, tipo) {
    if (pageMessages) {
      const opts =
        tipo === "sucesso"
          ? { autoHide: true, autoHideDelay: 3500 }
          : { autoHide: false };

      switch (tipo) {
        case "sucesso":
          pageMessages.sucesso(texto, opts);
          return;
        case "erro":
          pageMessages.erro(texto, opts);
          return;
        case "aviso":
          pageMessages.aviso(texto, opts);
          return;
        default:
          pageMessages.info(texto, opts);
          return;
      }
    }

    const div = document.getElementById("mensagemConfig");
    if (!div) return;

    if (!texto) {
      div.style.display = "none";
      div.textContent = "";
      div.className = "mensagem";
      return;
    }

    div.style.display = "block";
    div.textContent = texto;
    div.className = "mensagem";

    switch (tipo) {
      case "sucesso":
        div.classList.add("mensagem-sucesso");
        break;
      case "erro":
        div.classList.add("mensagem-erro");
        break;
      case "aviso":
        div.classList.add("mensagem-aviso");
        break;
      default:
        div.classList.add("mensagem-info");
        break;
    }
  }

  function limparMensagemConfig() {
    if (pageMessages) {
      pageMessages.clear();
      return;
    }
    const div = document.getElementById("mensagemConfig");
    if (!div) return;
    div.style.display = "none";
    div.textContent = "";
    div.className = "mensagem";
  }

  // -----------------------------------------
  // Helpers de formulário (dias da semana)
  // -----------------------------------------
  function obterDiasAtivosDoFormulario() {
    const chks = document.querySelectorAll(".chk-dia-ativo");
    const dias = [];
    chks.forEach((chk) => {
      if (chk.checked) dias.push(chk.value);
    });
    return dias;
  }

  function aplicarDiasAtivosNoFormulario(dias) {
    const chks = document.querySelectorAll(".chk-dia-ativo");
    const setDias = new Set(dias || []);
    chks.forEach((chk) => {
      chk.checked = setDias.has(chk.value);
    });
  }

  // -----------------------------------------
  // API helpers
  // -----------------------------------------
  async function callWithFallback_(actionDot, actionUnderscore, payload) {
    if (!callApiData) {
      const err = new Error("API não disponível no front (callApiData indefinido).");
      err.code = "CLIENT_NO_API";
      throw err;
    }

    try {
      return await callApiData({ action: actionDot, payload: payload || {} });
    } catch (e) {
      if (actionUnderscore) {
        return await callApiData({ action: actionUnderscore, payload: payload || {} });
      }
      throw e;
    }
  }

  async function callDirect_(action, payload) {
    if (!callApiData) {
      const err = new Error("API não disponível no front (callApiData indefinido).");
      err.code = "CLIENT_NO_API";
      throw err;
    }
    return await callApiData({ action: action, payload: payload || {} });
  }

  // -----------------------------------------
  // Mapeamento UI <-> Data
  // -----------------------------------------
  function readForm_() {
    const medicoNomeCompletoEl = document.getElementById("medicoNomeCompleto");
    const medicoCrmEl = document.getElementById("medicoCRM");
    const medicoEspEl = document.getElementById("medicoEspecialidade");

    const clinicaNomeEl = document.getElementById("clinicaNome");
    const clinicaEnderecoEl = document.getElementById("clinicaEndereco");
    const clinicaTelefoneEl = document.getElementById("clinicaTelefone");
    const clinicaEmailEl = document.getElementById("clinicaEmail");
    const clinicaLogoUrlEl = document.getElementById("clinicaLogoUrl");

    const horaIniEl = document.getElementById("agendaHoraInicioPadrao");
    const horaFimEl = document.getElementById("agendaHoraFimPadrao");
    const intervaloEl = document.getElementById("agendaIntervaloMinutos");

    const medicoNomeCompleto = (medicoNomeCompletoEl && medicoNomeCompletoEl.value ? medicoNomeCompletoEl.value : "").trim();
    const medicoCRM = (medicoCrmEl && medicoCrmEl.value ? medicoCrmEl.value : "").trim();
    const medicoEspecialidade = (medicoEspEl && medicoEspEl.value ? medicoEspEl.value : "").trim();

    const clinicaNome = (clinicaNomeEl && clinicaNomeEl.value ? clinicaNomeEl.value : "").trim();
    const clinicaEndereco = (clinicaEnderecoEl && clinicaEnderecoEl.value ? clinicaEnderecoEl.value : "").trim();
    const clinicaTelefone = (clinicaTelefoneEl && clinicaTelefoneEl.value ? clinicaTelefoneEl.value : "").trim();
    const clinicaEmail = (clinicaEmailEl && clinicaEmailEl.value ? clinicaEmailEl.value : "").trim();
    const logoUrl = (clinicaLogoUrlEl && clinicaLogoUrlEl.value ? clinicaLogoUrlEl.value : "").trim();

    const agendaHoraInicioPadrao = horaIniEl ? String(horaIniEl.value || "").trim() : "";
    const agendaHoraFimPadrao = horaFimEl ? String(horaFimEl.value || "").trim() : "";
    const agendaIntervaloMinutos = intervaloEl ? String(intervaloEl.value || "").trim() : "";

    const agendaDiasAtivos = obterDiasAtivosDoFormulario();

    return {
      medico: {
        medicoNomeCompleto,
        medicoCRM,
        medicoEspecialidade
      },
      clinica: {
        clinicaNome,
        clinicaEndereco,
        clinicaTelefone,
        clinicaEmail,
        logoUrl
      },
      agenda: {
        hora_inicio_padrao: agendaHoraInicioPadrao,
        hora_fim_padrao: agendaHoraFimPadrao,
        duracao_grade_minutos: Number(agendaIntervaloMinutos || 30),
        dias_ativos: agendaDiasAtivos
      }
    };
  }

  function applyAgendaConfigToForm_(configData) {
    const medicoNomeEl = document.getElementById("medicoNomeCompleto");
    const medicoCrmEl = document.getElementById("medicoCRM");
    const medicoEspEl = document.getElementById("medicoEspecialidade");

    if (medicoNomeEl) medicoNomeEl.value = configData.medicoNomeCompleto || "";
    if (medicoCrmEl) medicoCrmEl.value = configData.medicoCRM || "";
    if (medicoEspEl) medicoEspEl.value = configData.medicoEspecialidade || "";

    const horaIniEl = document.getElementById("agendaHoraInicioPadrao");
    const horaFimEl = document.getElementById("agendaHoraFimPadrao");
    const intervaloEl = document.getElementById("agendaIntervaloMinutos");

    if (horaIniEl) horaIniEl.value = configData.hora_inicio_padrao || "";
    if (horaFimEl) horaFimEl.value = configData.hora_fim_padrao || "";
    if (intervaloEl) {
      intervaloEl.value =
        configData.duracao_grade_minutos != null ? String(configData.duracao_grade_minutos) : "";
    }

    aplicarDiasAtivosNoFormulario(configData.dias_ativos || []);
  }

  function applyClinicaToForm_(clinicaData) {
    const clinicaNomeEl = document.getElementById("clinicaNome");
    const clinicaEnderecoEl = document.getElementById("clinicaEndereco");
    const clinicaTelefoneEl = document.getElementById("clinicaTelefone");
    const clinicaEmailEl = document.getElementById("clinicaEmail");
    const clinicaLogoUrlEl = document.getElementById("clinicaLogoUrl");

    if (clinicaNomeEl) clinicaNomeEl.value = clinicaData.clinicaNome || clinicaData.nome || "";
    if (clinicaEnderecoEl) clinicaEnderecoEl.value = clinicaData.clinicaEndereco || clinicaData.endereco || "";
    if (clinicaTelefoneEl) clinicaTelefoneEl.value = clinicaData.clinicaTelefone || clinicaData.telefone || "";
    if (clinicaEmailEl) clinicaEmailEl.value = clinicaData.clinicaEmail || clinicaData.email || "";

    const logoUrl = clinicaData.logoUrl || clinicaData.clinicaLogoUrl || clinicaData.logo || "";
    if (clinicaLogoUrlEl) clinicaLogoUrlEl.value = logoUrl || "";
  }

  // -----------------------------------------
  // Load (AgendaConfig + Clínica)
  // -----------------------------------------
  async function carregarConfiguracoes() {
    if (!callApiData) {
      mostrarMensagemConfig("Erro interno: API não disponível no front (callApiData).", "erro");
      return;
    }

    limparMensagemConfig();
    mostrarMensagemConfig("Carregando configurações...", "info");

    // Carrega em paralelo (best-effort)
    const results = await Promise.allSettled([
      // AgendaConfig (dot + fallback underscore)
      callWithFallback_("AgendaConfig.Obter", "AgendaConfig_Obter", {}),
      // Clínica (actions do Registry)
      callDirect_("Clinica_Get", {})
    ]);

    const rAgenda = results[0];
    const rClinica = results[1];

    let okAgenda = false;
    let okClinica = false;

    if (rAgenda.status === "fulfilled") {
      const cfg = rAgenda.value || {};
      applyAgendaConfigToForm_(cfg);
      okAgenda = true;
    }

    if (rClinica.status === "fulfilled") {
      const clin = rClinica.value || {};
      applyClinicaToForm_(clin);
      okClinica = true;
    }

    if (okAgenda && okClinica) {
      mostrarMensagemConfig("Configurações carregadas com sucesso.", "sucesso");
      return;
    }

    if (okAgenda && !okClinica) {
      const reason = rClinica.reason;
      const msg = (reason && reason.message) ? String(reason.message) : "Falha ao carregar dados da clínica.";
      mostrarMensagemConfig("Agenda carregada. Clínica: " + msg, "aviso");
      return;
    }

    if (!okAgenda && okClinica) {
      const reason = rAgenda.reason;
      const msg = (reason && reason.message) ? String(reason.message) : "Falha ao carregar configuração da agenda.";
      mostrarMensagemConfig("Clínica carregada. Agenda: " + msg, "aviso");
      return;
    }

    // ambos falharam
    {
      const msgA = (rAgenda.reason && rAgenda.reason.message) ? String(rAgenda.reason.message) : "AgendaConfig.Obter falhou.";
      const msgC = (rClinica.reason && rClinica.reason.message) ? String(rClinica.reason.message) : "Clinica_Get falhou.";
      mostrarMensagemConfig("Falha ao carregar: " + msgA + " | " + msgC, "erro");
    }
  }

  // -----------------------------------------
  // Save (AgendaConfig + Clínica)
  // -----------------------------------------
  async function salvarConfiguracoes() {
    const formData = readForm_();

    // Validações mínimas (mantidas)
    if (!formData.medico.medicoNomeCompleto) {
      mostrarMensagemConfig("Informe o nome completo do médico.", "erro");
      return;
    }
    if (!formData.medico.medicoCRM) {
      mostrarMensagemConfig("Informe o CRM.", "erro");
      return;
    }

    mostrarMensagemConfig("Salvando configurações...", "info");

    // 1) Salva AgendaConfig (dot + fallback underscore)
    const payloadAgendaConfig = {
      medicoNomeCompleto: formData.medico.medicoNomeCompleto,
      medicoCRM: formData.medico.medicoCRM,
      medicoEspecialidade: formData.medico.medicoEspecialidade,
      hora_inicio_padrao: formData.agenda.hora_inicio_padrao,
      hora_fim_padrao: formData.agenda.hora_fim_padrao,
      duracao_grade_minutos: formData.agenda.duracao_grade_minutos,
      dias_ativos: formData.agenda.dias_ativos
    };

    // 2) Salva Clínica (Clinica_Update)
    // NOTE: Registry indica roles:["admin"] para Clinica_Update
    const payloadClinica = {
      clinicaNome: formData.clinica.clinicaNome,
      clinicaEndereco: formData.clinica.clinicaEndereco,
      clinicaTelefone: formData.clinica.clinicaTelefone,
      clinicaEmail: formData.clinica.clinicaEmail,
      logoUrl: formData.clinica.logoUrl
    };

    const results = await Promise.allSettled([
      callWithFallback_("AgendaConfig.Salvar", "AgendaConfig_Salvar", payloadAgendaConfig),
      callDirect_("Clinica_Update", payloadClinica)
    ]);

    const rAgenda = results[0];
    const rClinica = results[1];

    const okAgenda = rAgenda.status === "fulfilled";
    const okClinica = rClinica.status === "fulfilled";

    if (okAgenda && okClinica) {
      mostrarMensagemConfig("Configurações salvas com sucesso.", "sucesso");
      return;
    }

    if (okAgenda && !okClinica) {
      const reason = rClinica.reason;
      const code = reason && reason.code ? String(reason.code) : "";
      const msg = (reason && reason.message) ? String(reason.message) : "Falha ao salvar clínica.";
      // Se não for admin, isso é esperado pelo contrato do Registry.
      if (code === "PERMISSION_DENIED") {
        mostrarMensagemConfig("Agenda salva. Clínica não salva (permissão admin necessária).", "aviso");
      } else {
        mostrarMensagemConfig("Agenda salva. Clínica: " + msg, "aviso");
      }
      return;
    }

    if (!okAgenda && okClinica) {
      const reason = rAgenda.reason;
      const msg = (reason && reason.message) ? String(reason.message) : "Falha ao salvar agenda.";
      mostrarMensagemConfig("Clínica salva. Agenda: " + msg, "aviso");
      return;
    }

    // ambos falharam
    {
      const msgA = (rAgenda.reason && rAgenda.reason.message) ? String(rAgenda.reason.message) : "AgendaConfig.Salvar falhou.";
      const msgC = (rClinica.reason && rClinica.reason.message) ? String(rClinica.reason.message) : "Clinica_Update falhou.";
      mostrarMensagemConfig("Falha ao salvar: " + msgA + " | " + msgC, "erro");
    }
  }

  // -----------------------------------------
  // Inicializador da página
  // -----------------------------------------
  function initConfiguracoesPage() {
    const form = document.getElementById("formConfiguracoes");
    const btnRecarregar = document.getElementById("btnRecarregarConfig");

    if (!callApiData) {
      mostrarMensagemConfig("Erro interno: API não disponível no front (callApiData).", "erro");
      return;
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        salvarConfiguracoes();
      });
    }

    if (btnRecarregar) {
      btnRecarregar.addEventListener("click", function () {
        carregarConfiguracoes();
      });
    }

    carregarConfiguracoes();
  }

  // -----------------------------------------
  // Registro no PRONTIO (para main.js)
  // -----------------------------------------
  PRONTIO.pages = PRONTIO.pages || {};
  PRONTIO.pages.configuracoes = PRONTIO.pages.configuracoes || {};
  PRONTIO.pages.configuracoes.init = initConfiguracoesPage;

})(window, document);

/* PRONTIO - Agenda Forms (new.js)
 * - modais: novo, editar, bloqueio
 * - typeahead
 * - pré-validação
 * - payload canônico
 */
(function () {
  "use strict";

  const root = (window.PRONTIO = window.PRONTIO || {});
  root.Agenda = root.Agenda || {};

  const forms = {
    _ctx: null,

    // DOM refs (modais)
    modalNovo: null,
    formNovo: null,
    msgNovo: null,
    btnFecharNovo: null,
    btnCancelarNovo: null,
    btnSubmitNovo: null,

    inputHoraInicio: null,
    inputDuracao: null,
    inputNomePaciente: null,
    inputTelefone: null,
    inputTipo: null,
    inputMotivo: null,
    inputOrigem: null,
    inputCanal: null,
    chkNovoPermiteEncaixe: null,

    modalEditar: null,
    formEditar: null,
    msgEditar: null,
    btnFecharEditar: null,
    btnCancelarEditar: null,
    btnSubmitEditar: null,

    inputEditIdAgenda: null,
    inputEditData: null,
    inputEditHoraInicio: null,
    inputEditDuracao: null,
    inputEditNomePaciente: null,
    inputEditTipo: null,
    inputEditMotivo: null,
    inputEditOrigem: null,
    inputEditCanal: null,
    chkEditPermiteEncaixe: null,

    modalBloq: null,
    formBloq: null,
    msgBloq: null,
    btnFecharBloq: null,
    btnCancelarBloq: null,
    btnSubmitBloq: null,
    inputBloqHoraInicio: null,
    inputBloqDuracao: null,

    // estado
    pacienteSelecionado: null,
    pacienteSelecionadoEditar: null,
    agendamentoEmEdicao: null
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function init(ctx) {
    forms._ctx = ctx || null;

    const modals = ctx.modals;

    // Novo
    forms.modalNovo = byId("modal-novo-agendamento");
    forms.formNovo = byId("form-novo-agendamento");
    forms.msgNovo = byId("novo-agendamento-mensagem");
    forms.btnFecharNovo = byId("btn-fechar-modal");
    forms.btnCancelarNovo = byId("btn-cancelar-modal");
    forms.btnSubmitNovo = byId("btn-submit-novo");

    forms.inputHoraInicio = byId("novo-hora-inicio");
    forms.inputDuracao = byId("novo-duracao");
    forms.inputNomePaciente = byId("novo-nome-paciente");
    forms.inputTelefone = byId("novo-telefone");
    forms.inputTipo = byId("novo-tipo");
    forms.inputMotivo = byId("novo-motivo");
    forms.inputOrigem = byId("novo-origem");
    forms.inputCanal = byId("novo-canal");
    forms.chkNovoPermiteEncaixe = byId("novo-permite-encaixe");

    // Editar
    forms.modalEditar = byId("modal-editar-agendamento");
    forms.formEditar = byId("form-editar-agendamento");
    forms.msgEditar = byId("editar-agendamento-mensagem");
    forms.btnFecharEditar = byId("btn-fechar-modal-editar");
    forms.btnCancelarEditar = byId("btn-cancelar-editar");
    forms.btnSubmitEditar = byId("btn-submit-editar");

    forms.inputEditIdAgenda = byId("edit-id-agenda");
    forms.inputEditData = byId("edit-data");
    forms.inputEditHoraInicio = byId("edit-hora-inicio");
    forms.inputEditDuracao = byId("edit-duracao");
    forms.inputEditNomePaciente = byId("edit-nome-paciente");
    forms.inputEditTipo = byId("edit-tipo");
    forms.inputEditMotivo = byId("edit-motivo");
    forms.inputEditOrigem = byId("edit-origem");
    forms.inputEditCanal = byId("edit-canal");
    forms.chkEditPermiteEncaixe = byId("edit-permite-encaixe");

    // Bloqueio
    forms.modalBloq = byId("modal-bloqueio");
    forms.formBloq = byId("form-bloqueio");
    forms.msgBloq = byId("bloqueio-mensagem");
    forms.btnFecharBloq = byId("btn-fechar-modal-bloqueio");
    forms.btnCancelarBloq = byId("btn-cancelar-bloqueio");
    forms.btnSubmitBloq = byId("btn-submit-bloqueio");
    forms.inputBloqHoraInicio = byId("bloq-hora-inicio");
    forms.inputBloqDuracao = byId("bloq-duracao");

    // listeners modais
    if (forms.btnFecharNovo) forms.btnFecharNovo.addEventListener("click", () => closeNovo(ctx));
    if (forms.btnCancelarNovo) forms.btnCancelarNovo.addEventListener("click", () => closeNovo(ctx));
    if (forms.modalNovo) forms.modalNovo.addEventListener("click", (e) => { if (e.target === forms.modalNovo) closeNovo(ctx); });
    if (forms.formNovo) forms.formNovo.addEventListener("submit", (e) => salvarNovo(ctx, e));

    if (forms.btnFecharEditar) forms.btnFecharEditar.addEventListener("click", () => closeEditar(ctx));
    if (forms.btnCancelarEditar) forms.btnCancelarEditar.addEventListener("click", () => closeEditar(ctx));
    if (forms.modalEditar) forms.modalEditar.addEventListener("click", (e) => { if (e.target === forms.modalEditar) closeEditar(ctx); });
    if (forms.formEditar) forms.formEditar.addEventListener("submit", (e) => salvarEditar(ctx, e));

    if (forms.btnFecharBloq) forms.btnFecharBloq.addEventListener("click", () => closeBloqueio(ctx));
    if (forms.btnCancelarBloq) forms.btnCancelarBloq.addEventListener("click", () => closeBloqueio(ctx));
    if (forms.modalBloq) forms.modalBloq.addEventListener("click", (e) => { if (e.target === forms.modalBloq) closeBloqueio(ctx); });
    if (forms.formBloq) forms.formBloq.addEventListener("submit", (e) => salvarBloqueio(ctx, e));

    // typeahead
    const ta = root.Agenda.patientsTypeahead;
    if (ta && typeof ta.attach === "function") {
      ta.attach(ctx, {
        inputEl: forms.inputNomePaciente,
        getSelected: () => forms.pacienteSelecionado,
        setSelected: (p) => { forms.pacienteSelecionado = p; updateSubmitNovo(ctx); },
        onSelected: (p) => {
          if (p && p.telefone && forms.inputTelefone && !String(forms.inputTelefone.value || "").trim()) {
            forms.inputTelefone.value = p.telefone;
          }
          updateSubmitNovo(ctx);
        },
        onManualTyping: () => { forms.pacienteSelecionado = null; updateSubmitNovo(ctx); }
      });

      ta.attach(ctx, {
        inputEl: forms.inputEditNomePaciente,
        getSelected: () => forms.pacienteSelecionadoEditar,
        setSelected: (p) => { forms.pacienteSelecionadoEditar = p; updateSubmitEditar(ctx); },
        onSelected: () => updateSubmitEditar(ctx),
        onManualTyping: () => { forms.pacienteSelecionadoEditar = null; updateSubmitEditar(ctx); }
      });
    }

    // estado inicial buttons
    updateSubmitNovo(ctx);
    updateSubmitEditar(ctx);

    // expõe no ctx (para day/week chamarem openEditar/openNovo)
    ctx.AgendaNew = { openNovo, openEditar, openBloqueio };
  }

  function updateSubmitNovo(ctx) {
    const ok = forms.pacienteSelecionado && String(forms.pacienteSelecionado.ID_Paciente || "").trim() !== "";
    ctx.modals.safeDisable(forms.btnSubmitNovo, !ok);
  }

  function updateSubmitEditar(ctx) {
    const ok = forms.pacienteSelecionadoEditar && String(forms.pacienteSelecionadoEditar.ID_Paciente || "").trim() !== "";
    ctx.modals.safeDisable(forms.btnSubmitEditar, !ok);
  }

  function openNovo(ctx, horaPre) {
    if (horaPre && forms.inputHoraInicio) forms.inputHoraInicio.value = horaPre;
    else if (forms.inputHoraInicio && !forms.inputHoraInicio.value) forms.inputHoraInicio.value = "14:00";

    ctx.modals.setFormMsg(forms.msgNovo, "", "");
    if (forms.chkNovoPermiteEncaixe) forms.chkNovoPermiteEncaixe.checked = false;

    updateSubmitNovo(ctx);
    ctx.modals.open(forms.modalNovo, forms.inputHoraInicio || forms.inputNomePaciente);
  }

  function closeNovo(ctx) {
    ctx.modals.close(forms.modalNovo);
    if (forms.formNovo) forms.formNovo.reset();
    if (forms.inputDuracao) forms.inputDuracao.value = 15;
    ctx.modals.setFormMsg(forms.msgNovo, "", "");
    forms.pacienteSelecionado = null;
    ctx.utils.setPacienteIdOnInput(forms.inputNomePaciente, null);
    ctx.modals.safeDisable(forms.btnSubmitNovo, false);
  }

  async function salvarNovo(ctx, event) {
    event.preventDefault();
    updateSubmitNovo(ctx);

    const dataStr = ctx.dom.inputData ? ctx.dom.inputData.value : "";
    const horaStr = forms.inputHoraInicio ? forms.inputHoraInicio.value : "";
    const duracao = parseInt((forms.inputDuracao ? forms.inputDuracao.value : "0") || "0", 10);

    if (!dataStr || !horaStr || !duracao) {
      ctx.modals.setFormMsg(forms.msgNovo, "Preencha data, hora inicial e duração.", "erro");
      ctx.modals.safeDisable(forms.btnSubmitNovo, false);
      return;
    }

    if (!forms.pacienteSelecionado || !forms.pacienteSelecionado.ID_Paciente) {
      ctx.modals.setFormMsg(forms.msgNovo, "Selecione um paciente da lista para agendar.", "erro");
      ctx.modals.safeDisable(forms.btnSubmitNovo, false);
      return;
    }

    const permiteEncaixeUI = forms.chkNovoPermiteEncaixe ? forms.chkNovoPermiteEncaixe.checked === true : false;

    ctx.modals.setFormMsg(forms.msgNovo, "Validando horário...", "info");
    const v = await ctx.api.validarConflito({
      data: dataStr,
      hora_inicio: horaStr,
      duracao_minutos: duracao,
      ignoreIdAgenda: "",
      permite_encaixe: permiteEncaixeUI
    });

    if (v && v.ok !== true) {
      const conflitos = Array.isArray(v.conflitos) ? v.conflitos : [];
      const hasBloq = conflitos.some((c) => c && c.bloqueio === true);

      const msg = (function () {
        if (!conflitos.length) return v.erro || "Conflito de horário.";
        const top = conflitos.slice(0, 2).map((c) => {
          const tipo = c.bloqueio ? "Bloqueio" : "Consulta";
          return `${tipo} ${c.hora_inicio || "?"}–${c.hora_fim || "?"}`;
        });
        const extra = conflitos.length > 2 ? ` (+${conflitos.length - 2})` : "";
        return `Conflito no horário. ${top.join(" | ")}${extra}`;
      })();

      if (hasBloq) {
        ctx.modals.setFormMsg(forms.msgNovo, msg, "erro");
        ctx.modals.safeDisable(forms.btnSubmitNovo, false);
        return;
      }

      if (!permiteEncaixeUI) {
        ctx.modals.setFormMsg(forms.msgNovo, msg + " Marque “Permitir encaixe” para salvar mesmo com conflito de consultas.", "erro");
        ctx.modals.safeDisable(forms.btnSubmitNovo, false);
        return;
      }
    }

    const payload = {
      data: dataStr,
      hora_inicio: horaStr,
      duracao_minutos: duracao,
      ID_Paciente: forms.pacienteSelecionado.ID_Paciente,
      tipo: forms.inputTipo ? (forms.inputTipo.value || "CONSULTA") : "CONSULTA",
      motivo: forms.inputMotivo ? (forms.inputMotivo.value || "") : "",
      origem: ctx.utils.normalizeOrigemCanonic(forms.inputOrigem ? (forms.inputOrigem.value || "RECEPCAO") : "RECEPCAO"),
      permitirEncaixe: permiteEncaixeUI,
      permite_encaixe: permiteEncaixeUI
    };

    setTimeout(() => ctx.modals.setFormMsg(forms.msgNovo, "Salvando...", "info"), 120);

    try {
      await ctx.api.criar(payload);
      ctx.modals.setFormMsg(forms.msgNovo, "Agendamento criado com sucesso!", "sucesso");
      await ctx.AgendaDayReload(ctx);
      setTimeout(() => closeNovo(ctx), 650);
    } catch (e) {
      ctx.modals.setFormMsg(forms.msgNovo, "Erro ao salvar: " + (e && e.message ? e.message : String(e)), "erro");
      ctx.modals.safeDisable(forms.btnSubmitNovo, false);
    }
  }

  function openEditar(ctx, ag) {
    forms.agendamentoEmEdicao = ag || null;

    forms.pacienteSelecionadoEditar = null;
    if (ag && ag.ID_Paciente) {
      forms.pacienteSelecionadoEditar = {
        ID_Paciente: ag.ID_Paciente,
        nome: ag.nome_paciente || "",
        documento: ag.documento_paciente || "",
        telefone: ag.telefone_paciente || ""
      };
    }

    if (forms.inputEditIdAgenda) forms.inputEditIdAgenda.value = ag ? (ag.ID_Agenda || "") : "";
    if (forms.inputEditData) forms.inputEditData.value = ag ? (ag.data || (ctx.dom.inputData ? ctx.dom.inputData.value : "")) : (ctx.dom.inputData ? ctx.dom.inputData.value : "");
    if (forms.inputEditHoraInicio) forms.inputEditHoraInicio.value = ag ? (ag.hora_inicio || "") : "";
    if (forms.inputEditDuracao) forms.inputEditDuracao.value = ag ? (ag.duracao_minutos || 15) : 15;

    if (forms.inputEditNomePaciente) forms.inputEditNomePaciente.value = ag ? (ag.nome_paciente || "") : "";
    ctx.utils.setPacienteIdOnInput(forms.inputEditNomePaciente, forms.pacienteSelecionadoEditar);

    if (forms.inputEditTipo) forms.inputEditTipo.value = ag ? (ag.tipo || "") : "";
    if (forms.inputEditMotivo) forms.inputEditMotivo.value = ag ? (ag.motivo || "") : "";
    if (forms.inputEditOrigem) forms.inputEditOrigem.value = ag ? (ag.origem || "") : "";
    if (forms.inputEditCanal) forms.inputEditCanal.value = ag ? (ag.canal || "") : "";

    if (forms.chkEditPermiteEncaixe) forms.chkEditPermiteEncaixe.checked = ag && ag.permite_encaixe === true;

    ctx.modals.setFormMsg(forms.msgEditar, "", "");
    ctx.modals.safeDisable(forms.btnSubmitEditar, false);
    updateSubmitEditar(ctx);

    ctx.modals.open(forms.modalEditar, forms.inputEditHoraInicio || forms.inputEditNomePaciente);
  }

  function closeEditar(ctx) {
    ctx.modals.close(forms.modalEditar);
    if (forms.formEditar) forms.formEditar.reset();
    forms.agendamentoEmEdicao = null;
    forms.pacienteSelecionadoEditar = null;
    ctx.modals.setFormMsg(forms.msgEditar, "", "");
    ctx.modals.safeDisable(forms.btnSubmitEditar, false);
    ctx.utils.setPacienteIdOnInput(forms.inputEditNomePaciente, null);
  }

  async function salvarEditar(ctx, event) {
    event.preventDefault();
    ctx.modals.safeDisable(forms.btnSubmitEditar, true);

    const idAgenda = forms.inputEditIdAgenda ? (forms.inputEditIdAgenda.value || "") : "";
    if (!idAgenda) {
      ctx.modals.setFormMsg(forms.msgEditar, "Agendamento inválido para edição.", "erro");
      ctx.modals.safeDisable(forms.btnSubmitEditar, false);
      return;
    }

    const dataStr = forms.inputEditData ? forms.inputEditData.value : "";
    const horaStr = forms.inputEditHoraInicio ? forms.inputEditHoraInicio.value : "";
    const duracao = parseInt((forms.inputEditDuracao ? forms.inputEditDuracao.value : "0") || "0", 10);

    if (!dataStr || !horaStr || !duracao) {
      ctx.modals.setFormMsg(forms.msgEditar, "Preencha data, hora inicial e duração.", "erro");
      ctx.modals.safeDisable(forms.btnSubmitEditar, false);
      return;
    }

    const permiteEncaixeUI = forms.chkEditPermiteEncaixe ? forms.chkEditPermiteEncaixe.checked === true : false;

    ctx.modals.setFormMsg(forms.msgEditar, "Validando horário...", "info");
    const v = await ctx.api.validarConflito({
      data: dataStr,
      hora_inicio: horaStr,
      duracao_minutos: duracao,
      ignoreIdAgenda: idAgenda,
      permite_encaixe: permiteEncaixeUI
    });

    if (v && v.ok !== true) {
      const conflitos = Array.isArray(v.conflitos) ? v.conflitos : [];
      const hasBloq = conflitos.some((c) => c && c.bloqueio === true);

      const msg = (function () {
        if (!conflitos.length) return v.erro || "Conflito de horário.";
        const top = conflitos.slice(0, 2).map((c) => {
          const tipo = c.bloqueio ? "Bloqueio" : "Consulta";
          return `${tipo} ${c.hora_inicio || "?"}–${c.hora_fim || "?"}`;
        });
        const extra = conflitos.length > 2 ? ` (+${conflitos.length - 2})` : "";
        return `Conflito no horário. ${top.join(" | ")}${extra}`;
      })();

      if (hasBloq) {
        ctx.modals.setFormMsg(forms.msgEditar, msg, "erro");
        ctx.modals.safeDisable(forms.btnSubmitEditar, false);
        return;
      }

      if (!permiteEncaixeUI) {
        ctx.modals.setFormMsg(forms.msgEditar, msg + " Marque “Permitir encaixe” para salvar mesmo com conflito de consultas.", "erro");
        ctx.modals.safeDisable(forms.btnSubmitEditar, false);
        return;
      }
    }

    const idSelecionado = (forms.pacienteSelecionadoEditar && forms.pacienteSelecionadoEditar.ID_Paciente)
      ? String(forms.pacienteSelecionadoEditar.ID_Paciente)
      : ctx.utils.getPacienteIdFromInput(forms.inputEditNomePaciente);

    const vinculado = !!idSelecionado;
    const nomeLivre = String(forms.inputEditNomePaciente ? forms.inputEditNomePaciente.value : "").trim();

    const notasBase = forms.agendamentoEmEdicao && forms.agendamentoEmEdicao.notas ? forms.agendamentoEmEdicao.notas : "";
    const notas = ctx.utils.buildNotasJson(notasBase, {
      nome_paciente: vinculado ? (forms.pacienteSelecionadoEditar?.nome || nomeLivre) : nomeLivre,
      canal: forms.inputEditCanal ? (forms.inputEditCanal.value || "") : "",
      motivo: forms.inputEditMotivo ? (forms.inputEditMotivo.value || "") : "",
      tipo_ui: forms.inputEditTipo ? (forms.inputEditTipo.value || "") : ""
    });

    const payload = {
      idAgenda: idAgenda,
      data: dataStr,
      hora_inicio: horaStr,
      duracao_minutos: duracao,
      ID_Paciente: vinculado ? idSelecionado : "",
      tipo: forms.inputEditTipo ? (forms.inputEditTipo.value || "CONSULTA") : "CONSULTA",
      motivo: forms.inputEditMotivo ? (forms.inputEditMotivo.value || "") : "",
      origem: ctx.utils.normalizeOrigemCanonic(forms.inputEditOrigem ? (forms.inputEditOrigem.value || "RECEPCAO") : "RECEPCAO"),
      permitirEncaixe: permiteEncaixeUI,
      permite_encaixe: permiteEncaixeUI,
      notas: notas
    };

    setTimeout(() => ctx.modals.setFormMsg(forms.msgEditar, "Salvando alterações...", "info"), 120);

    try {
      await ctx.api.atualizar(payload);
      ctx.modals.setFormMsg(forms.msgEditar, "Agendamento atualizado com sucesso!", "sucesso");
      await ctx.AgendaDayReload(ctx);
      setTimeout(() => closeEditar(ctx), 650);
    } catch (e) {
      ctx.modals.setFormMsg(forms.msgEditar, "Erro ao atualizar: " + (e && e.message ? e.message : String(e)), "erro");
      ctx.modals.safeDisable(forms.btnSubmitEditar, false);
    }
  }

  function openBloqueio(ctx, horaPre) {
    if (horaPre && forms.inputBloqHoraInicio) forms.inputBloqHoraInicio.value = horaPre;
    else if (forms.inputBloqHoraInicio && !forms.inputBloqHoraInicio.value) forms.inputBloqHoraInicio.value = "12:00";

    ctx.modals.setFormMsg(forms.msgBloq, "", "");
    ctx.modals.safeDisable(forms.btnSubmitBloq, false);
    ctx.modals.open(forms.modalBloq, forms.inputBloqHoraInicio);
  }

  function closeBloqueio(ctx) {
    ctx.modals.close(forms.modalBloq);
    if (forms.formBloq) forms.formBloq.reset();
    if (forms.inputBloqDuracao) forms.inputBloqDuracao.value = 60;
    ctx.modals.setFormMsg(forms.msgBloq, "", "");
    ctx.modals.safeDisable(forms.btnSubmitBloq, false);
  }

  async function salvarBloqueio(ctx, event) {
    event.preventDefault();
    ctx.modals.safeDisable(forms.btnSubmitBloq, true);

    const dataStr = ctx.dom.inputData ? ctx.dom.inputData.value : "";
    const horaStr = forms.inputBloqHoraInicio ? forms.inputBloqHoraInicio.value : "";
    const duracao = parseInt((forms.inputBloqDuracao ? forms.inputBloqDuracao.value : "0") || "0", 10);

    if (!dataStr || !horaStr || !duracao) {
      ctx.modals.setFormMsg(forms.msgBloq, "Preencha hora inicial e duração.", "erro");
      ctx.modals.safeDisable(forms.btnSubmitBloq, false);
      return;
    }

    ctx.modals.setFormMsg(forms.msgBloq, "Validando horário...", "info");
    const v = await ctx.api.validarConflito({
      data: dataStr,
      hora_inicio: horaStr,
      duracao_minutos: duracao,
      ignoreIdAgenda: "",
      permite_encaixe: false
    });

    if (v && v.ok !== true) {
      ctx.modals.setFormMsg(forms.msgBloq, (v.erro || "Conflito de horário."), "erro");
      ctx.modals.safeDisable(forms.btnSubmitBloq, false);
      return;
    }

    const notas = ctx.utils.buildNotasJson("", { descricao_bloqueio: "Bloqueio de horário" });

    const payload = {
      data: dataStr,
      hora_inicio: horaStr,
      duracao_minutos: duracao,
      tipo: "BLOQUEIO",
      motivo: "BLOQUEIO",
      origem: "SISTEMA",
      permitirEncaixe: false,
      permite_encaixe: false,
      notas: notas
    };

    ctx.modals.setFormMsg(forms.msgBloq, "Salvando bloqueio...", "info");

    try {
      await ctx.api.criar(payload);
      ctx.modals.setFormMsg(forms.msgBloq, "Horário bloqueado com sucesso!", "sucesso");
      await ctx.AgendaDayReload(ctx);
      setTimeout(() => closeBloqueio(ctx), 650);
    } catch (e) {
      ctx.modals.setFormMsg(forms.msgBloq, "Erro ao salvar bloqueio: " + (e && e.message ? e.message : String(e)), "erro");
      ctx.modals.safeDisable(forms.btnSubmitBloq, false);
    }
  }

  function onEsc(ctx) {
    if (ctx.modals.isVisible(forms.modalBloq)) return closeBloqueio(ctx);
    if (ctx.modals.isVisible(forms.modalEditar)) return closeEditar(ctx);
    if (ctx.modals.isVisible(forms.modalNovo)) return closeNovo(ctx);
  }

  // Ponte: para recarregar sem depender do módulo day diretamente aqui
  async function dayReloadBridge(ctx) {
    if (root.Agenda && root.Agenda.day && typeof root.Agenda.day.reload === "function") {
      return root.Agenda.day.reload(ctx);
    }
  }

  // injeta funções bridge no ctx
  function bindBridges(ctx) {
    ctx.AgendaDayReload = dayReloadBridge;
  }

  // Export
  root.Agenda.new = {
    init: function (ctx) { bindBridges(ctx); init(ctx); },
    openNovo,
    openEditar,
    openBloqueio,
    onEsc
  };
})();

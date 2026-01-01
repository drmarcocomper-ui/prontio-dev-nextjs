/* PRONTIO - Agenda Day (day.js)
 * - carrega config se necessário
 * - carrega dia
 * - aplica filtros
 * - renderiza slots + cards
 * - ações: status, remover bloqueio, abrir prontuário, abrir editar
 */
(function () {
  "use strict";

  const root = (window.PRONTIO = window.PRONTIO || {});
  root.Agenda = root.Agenda || {};

  function init(ctx) {
    // nada a fazer aqui; usamos ctx em chamadas
  }

  async function ensureConfig(ctx) {
    const state = ctx.state;
    if (state.isConfigLoaded()) return;

    try {
      const data = await ctx.api.obterConfig();
      if (data && typeof data === "object") {
        const dur = parseInt(String(data.duracao_grade_minutos || ""), 10);
        state.setConfig({
          hora_inicio_padrao: data.hora_inicio_padrao || state.get("agendaConfig").hora_inicio_padrao,
          hora_fim_padrao: data.hora_fim_padrao || state.get("agendaConfig").hora_fim_padrao,
          duracao_grade_minutos: isFinite(dur) && dur > 0 ? dur : state.get("agendaConfig").duracao_grade_minutos
        });
      }
    } catch (e) {
      console.warn("[PRONTIO][Agenda][Day] erro ao carregar config; usando defaults.", e);
    } finally {
      state.markConfigLoaded();
    }
  }

  function getSlotsByConfig(ctx) {
    const cfg = ctx.state.get("agendaConfig");
    const inicioMin = ctx.utils.timeToMinutes(cfg.hora_inicio_padrao) ?? 8 * 60;
    const fimMin = ctx.utils.timeToMinutes(cfg.hora_fim_padrao) ?? 18 * 60;
    const passo = parseInt(String(cfg.duracao_grade_minutos || 15), 10) || 15;

    const slots = [];
    for (let t = inicioMin; t <= fimMin; t += passo) slots.push(ctx.utils.minutesToTime(t));
    return { slots, inicioMin, fimMin, passo };
  }

  function getNowSlot(ctx) {
    const now = new Date();
    const dataStr = ctx.utils.formatDateToInput(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const { slots, inicioMin, fimMin, passo } = getSlotsByConfig(ctx);
    if (nowMin < inicioMin || nowMin > fimMin) return { dataStr, hhmm: null };
    const idx = ctx.utils.clamp(Math.floor((nowMin - inicioMin) / passo), 0, slots.length - 1);
    return { dataStr, hhmm: slots[idx] || null };
  }

  function limparLista(ctx) {
    if (ctx.dom.listaHorariosEl) ctx.dom.listaHorariosEl.innerHTML = "";
  }

  function showLoading(ctx) {
    if (!ctx.dom.listaHorariosEl) return;
    ctx.dom.listaHorariosEl.classList.add("loading");
    ctx.dom.listaHorariosEl.innerHTML = '<div class="agenda-loading">Carregando agenda...</div>';
  }

  function hideLoading(ctx) {
    if (!ctx.dom.listaHorariosEl) return;
    ctx.dom.listaHorariosEl.classList.remove("loading");
  }

  function showErro(ctx, msg) {
    if (!ctx.dom.listaHorariosEl) return;
    ctx.dom.listaHorariosEl.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "agenda-erro";
    wrap.textContent = String(msg || "Erro.");
    ctx.dom.listaHorariosEl.appendChild(wrap);
  }

  function atualizarResumo(ctx, resumo) {
    if (ctx.dom.resumoTotalEl) ctx.dom.resumoTotalEl.textContent = resumo?.total ?? 0;
    if (ctx.dom.resumoConfirmadosEl) ctx.dom.resumoConfirmadosEl.textContent = resumo?.confirmados ?? 0;
    if (ctx.dom.resumoFaltasEl) ctx.dom.resumoFaltasEl.textContent = resumo?.faltas ?? 0;
    if (ctx.dom.resumoCanceladosEl) ctx.dom.resumoCanceladosEl.textContent = resumo?.cancelados ?? 0;
    if (ctx.dom.resumoConcluidosEl) ctx.dom.resumoConcluidosEl.textContent = resumo?.concluidos ?? 0;
    if (ctx.dom.resumoEmAtendimentoEl) ctx.dom.resumoEmAtendimentoEl.textContent = resumo?.em_atendimento ?? 0;
  }

  function getFiltrosNormalized(ctx) {
    const prefs = ctx.pref.load();
    const termo = ctx.utils.stripAccents(prefs.filtros.nome || "").toLowerCase().trim();
    const statusFiltro = ctx.utils.stripAccents(prefs.filtros.status || "").toLowerCase().trim();
    return { termo, statusFiltro };
  }

  function matchesFiltroStatus(ctx, statusValue, statusFiltro) {
    if (!statusFiltro) return true;
    const s = ctx.utils.stripAccents(String(statusValue || "")).toLowerCase();

    if (statusFiltro.includes("concl")) return s.includes("concl") || s.includes("atendid");
    if (statusFiltro.includes("agend")) return s.includes("agend") || s.includes("marc");
    if (statusFiltro.includes("em atendimento") || statusFiltro.includes("em_atend") || statusFiltro.includes("atend")) {
      return s.includes("em_atend") || s.includes("em atend") || (s.includes("atend") && !s.includes("atendid"));
    }
    return s.includes(statusFiltro);
  }

  function matchesFiltro(ctx, ag, termo, statusFiltro) {
    if (!ag) return false;
    if (termo) {
      const nome = ctx.utils.stripAccents(String(ag.nome_paciente || "")).toLowerCase();
      if (!nome.includes(termo)) return false;
    }
    if (statusFiltro) {
      if (!matchesFiltroStatus(ctx, ag.status, statusFiltro)) return false;
    }
    return true;
  }

  async function reload(ctx) {
    const inputData = ctx.dom.inputData;
    if (!inputData || !inputData.value) return;

    const dataStr = inputData.value;
    const mySeq = ctx.state.bumpSeqDia();

    await ensureConfig(ctx);
    limparLista(ctx);
    showLoading(ctx);

    try {
      const data = await ctx.api.listarDia(dataStr);
      if (mySeq !== ctx.state.get("reqSeqDia")) return;

      const horarios = data && data.horarios ? data.horarios : [];
      const flat = [];
      horarios.forEach((h) => {
        const arr = h && h.agendamentos ? h.agendamentos : [];
        arr.forEach((ag) => {
          const ui = ctx.utils.normalizeUiAg(ag);
          if (ui) flat.push(ui);
        });
      });

      const onlyDay = flat.filter((ag) => ag && ag.data === dataStr);
      ctx.state.set("agendamentosOriginaisDia", onlyDay);

      atualizarResumo(ctx, ctx.utils.computeResumoDia(onlyDay));
      applyFilters(ctx);
    } catch (e) {
      if (mySeq !== ctx.state.get("reqSeqDia")) return;
      showErro(ctx, "Não foi possível carregar a agenda do dia: " + (e && e.message ? e.message : String(e)));
    } finally {
      if (mySeq === ctx.state.get("reqSeqDia")) hideLoading(ctx);
    }
  }

  function applyFilters(ctx) {
    const { termo, statusFiltro } = getFiltrosNormalized(ctx);
    const { slots } = getSlotsByConfig(ctx);

    const ags = ctx.state.get("agendamentosOriginaisDia") || [];
    const map = new Map();

    ags.forEach((ag) => {
      const hora = ctx.utils.normalizeHora(ag.hora_inicio);
      if (!hora) return;
      if (!matchesFiltro(ctx, ag, termo, statusFiltro)) return;
      if (!map.has(hora)) map.set(hora, []);
      map.get(hora).push(ag);
    });

    const slotsRender = slots.map((hora) => ({ hora, agendamentos: map.get(hora) || [] }));
    renderSlots(ctx, slotsRender);
  }

  function abrirProntuario(ctx, ag) {
    if (!ag.ID_Paciente) {
      alert("Este agendamento não está vinculado a um paciente cadastrado.\n\nSelecione um paciente da lista para vincular ao prontuário.");
      return;
    }

    const coreState = root.core && root.core.state ? root.core.state : null;

    try {
      if (coreState && typeof coreState.setPacienteAtual === "function") coreState.setPacienteAtual(String(ag.ID_Paciente));
      else if (coreState && typeof coreState.set === "function") coreState.set("pacienteAtualId", String(ag.ID_Paciente));

      if (ag.ID_Agenda) {
        if (coreState && typeof coreState.setAgendaAtual === "function") coreState.setAgendaAtual(String(ag.ID_Agenda));
        else if (coreState && typeof coreState.set === "function") coreState.set("agendaAtualId", String(ag.ID_Agenda));
      }
    } catch (_) {}

    // legado
    const infoPaciente = { ID_Paciente: ag.ID_Paciente, nome: ag.nome_paciente || "", documento: ag.documento_paciente || "", telefone: ag.telefone_paciente || "" };
    try { localStorage.setItem("prontio.pacienteSelecionado", JSON.stringify(infoPaciente)); } catch (_) {}

    const contexto = {
      ID_Paciente: ag.ID_Paciente,
      nome_paciente: ag.nome_paciente || "",
      documento_paciente: ag.documento_paciente || "",
      telefone_paciente: ag.telefone_paciente || "",
      ID_Agenda: ag.ID_Agenda || "",
      data: ag.data || "",
      hora_inicio: ag.hora_inicio || "",
      status: ag.status || "",
      tipo: ag.tipo || ""
    };
    try { localStorage.setItem("prontio.prontuarioContexto", JSON.stringify(contexto)); } catch (_) {}

    const params = new URLSearchParams();
    params.set("idPaciente", ag.ID_Paciente);
    if (ag.ID_Agenda) params.set("idAgenda", ag.ID_Agenda);
    window.location.href = "prontuario.html?" + params.toString();
  }

  async function mudarStatus(ctx, ID_Agenda, novoLabel, cardEl) {
    if (!ID_Agenda) return;

    const inFlight = ctx.state.get("inFlight");
    if (inFlight.statusById.has(ID_Agenda)) return;

    inFlight.statusById.add(ID_Agenda);
    if (cardEl) cardEl.classList.add("agendamento-atualizando");

    try {
      const backendStatus = ctx.utils.mapStatusToBackend(novoLabel);

      if (backendStatus === "CANCELADO") {
        await ctx.api.cancelar({ idAgenda: ID_Agenda, motivo: "Cancelado pela agenda" });
      } else {
        await ctx.api.atualizar({ idAgenda: ID_Agenda, patch: { status: backendStatus } });
      }

      await reload(ctx);
    } catch (e) {
      ctx.bus.emit("agenda:toast", { kind: "error", message: "Erro ao mudar status: " + (e && e.message ? e.message : String(e)) });
      if (cardEl) cardEl.classList.remove("agendamento-atualizando");
    } finally {
      inFlight.statusById.delete(ID_Agenda);
    }
  }

  async function removerBloqueio(ctx, ID_Agenda, cardEl) {
    if (!ID_Agenda) return;

    const inFlight = ctx.state.get("inFlight");
    if (inFlight.removerBloqById.has(ID_Agenda)) return;

    if (!confirm("Deseja realmente remover este bloqueio de horário?")) return;

    inFlight.removerBloqById.add(ID_Agenda);
    if (cardEl) cardEl.classList.add("agendamento-atualizando");

    try {
      await ctx.api.cancelar({ idAgenda: ID_Agenda, motivo: "Bloqueio removido" });
      await reload(ctx);
    } catch (e) {
      ctx.bus.emit("agenda:toast", { kind: "error", message: "Erro ao remover bloqueio: " + (e && e.message ? e.message : String(e)) });
      if (cardEl) cardEl.classList.remove("agendamento-atualizando");
    } finally {
      inFlight.removerBloqById.delete(ID_Agenda);
    }
  }

  function criarCartaoAgendamento(ctx, ag) {
    const card = document.createElement("div");
    card.className = "agendamento-card";
    card.classList.add(ctx.utils.getStatusClass(ag.status));

    const linhaPrincipal = document.createElement("div");
    linhaPrincipal.className = "agendamento-linha-principal";

    const nomeWrap = document.createElement("div");
    nomeWrap.className = "agendamento-nome-wrap";

    const nome = document.createElement("span");
    nome.className = "agendamento-nome";
    nome.textContent = ag.nome_paciente || "(sem nome)";
    nomeWrap.appendChild(nome);

    const tipo = document.createElement("span");
    tipo.className = "agendamento-tipo";
    tipo.textContent = ag.tipo || "";

    linhaPrincipal.appendChild(nomeWrap);
    if (tipo.textContent) linhaPrincipal.appendChild(tipo);

    const linhaSec = document.createElement("div");
    linhaSec.className = "agendamento-linha-secundaria";

    const statusSelect = document.createElement("select");
    statusSelect.className = "agendamento-status-select";
    statusSelect.setAttribute("aria-label", "Alterar status do agendamento");

    ctx.utils.STATUS_OPTIONS.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
      statusSelect.appendChild(o);
    });

    statusSelect.value = ctx.utils.normalizeStatusLabel(ag.status);
    statusSelect.addEventListener("change", async () => {
      await mudarStatus(ctx, ag.ID_Agenda, statusSelect.value, card);
    });

    const canal = document.createElement("span");
    canal.className = "agendamento-canal";
    canal.textContent = ag.canal || "";

    linhaSec.appendChild(statusSelect);
    if (canal.textContent) linhaSec.appendChild(canal);

    const motivo = document.createElement("div");
    motivo.className = "agendamento-motivo";
    motivo.textContent = ag.motivo || "";

    card.appendChild(linhaPrincipal);
    card.appendChild(linhaSec);
    if (motivo.textContent) card.appendChild(motivo);

    const acoes = document.createElement("div");
    acoes.className = "agendamento-acoes";

    const btnAtender = document.createElement("button");
    btnAtender.type = "button";
    btnAtender.className = "btn-status btn-status-atender";
    btnAtender.textContent = "Atender";
    btnAtender.addEventListener("click", () => abrirProntuario(ctx, ag));

    const btnEditar = document.createElement("button");
    btnEditar.type = "button";
    btnEditar.className = "btn-status btn-status-editar";
    btnEditar.textContent = "Editar";
    btnEditar.addEventListener("click", () => ctx.AgendaNew.openEditar(ctx, ag));

    acoes.appendChild(btnAtender);
    acoes.appendChild(btnEditar);
    card.appendChild(acoes);

    return card;
  }

  function criarCartaoBloqueio(ctx, ag) {
    const card = document.createElement("div");
    card.className = "agendamento-card bloqueio-card";

    const linhaPrincipal = document.createElement("div");
    linhaPrincipal.className = "agendamento-linha-principal";

    const label = document.createElement("span");
    label.className = "bloqueio-label";
    label.textContent = "Horário bloqueado";
    linhaPrincipal.appendChild(label);
    card.appendChild(linhaPrincipal);

    const info = document.createElement("div");
    info.className = "agendamento-motivo";
    info.textContent = `Das ${ag.hora_inicio} às ${ag.hora_fim}`;
    card.appendChild(info);

    const acoes = document.createElement("div");
    acoes.className = "agendamento-acoes";

    const btnRemover = document.createElement("button");
    btnRemover.type = "button";
    btnRemover.className = "btn-status btn-status-remover-bloqueio";
    btnRemover.textContent = "Remover bloqueio";
    btnRemover.addEventListener("click", () => removerBloqueio(ctx, ag.ID_Agenda, card));

    acoes.appendChild(btnRemover);
    card.appendChild(acoes);

    return card;
  }

  function renderSlots(ctx, horarios) {
    limparLista(ctx);
    const lista = ctx.dom.listaHorariosEl;
    if (!lista) return;

    if (!horarios || !horarios.length) {
      lista.innerHTML = '<div class="agenda-vazia">Nenhum horário para exibir.</div>';
      return;
    }

    let slotParaFoco = null;
    const now = getNowSlot(ctx);
    const isHoje = now.dataStr === (ctx.dom.inputData ? ctx.dom.inputData.value : "");
    const hhNow = now.hhmm;

    horarios.forEach((slot) => {
      const hora = slot.hora;
      const ags = slot.agendamentos || [];

      const slotEl = document.createElement("div");
      slotEl.className = "agenda-slot";
      slotEl.dataset.hora = hora;
      if (isHoje && hhNow && hora === hhNow) slotEl.classList.add("slot-now");

      const horaEl = document.createElement("div");
      horaEl.className = "agenda-slot-hora";
      horaEl.textContent = hora;

      const conteudoEl = document.createElement("div");
      conteudoEl.className = "agenda-slot-conteudo";

      if (!ags.length) {
        const vazioEl = document.createElement("div");
        vazioEl.className = "agenda-slot-vazio";
        vazioEl.textContent = "Horário livre";
        conteudoEl.appendChild(vazioEl);

        const actionsEl = document.createElement("div");
        actionsEl.className = "agenda-slot-actions";

        const btnNovo = document.createElement("button");
        btnNovo.type = "button";
        btnNovo.className = "btn-status btn-status-atender agenda-slot-action-btn";
        btnNovo.textContent = "Novo";
        btnNovo.addEventListener("click", () => ctx.AgendaNew.openNovo(ctx, hora));

        const btnBloq = document.createElement("button");
        btnBloq.type = "button";
        btnBloq.className = "btn-status btn-status-cancelar agenda-slot-action-btn";
        btnBloq.textContent = "Bloquear";
        btnBloq.addEventListener("click", () => ctx.AgendaNew.openBloqueio(ctx, hora));

        actionsEl.appendChild(btnNovo);
        actionsEl.appendChild(btnBloq);
        conteudoEl.appendChild(actionsEl);

        slotEl.addEventListener("dblclick", () => ctx.AgendaNew.openNovo(ctx, hora));
      } else {
        ags.forEach((ag) => {
          const el = ag.bloqueio ? criarCartaoBloqueio(ctx, ag) : criarCartaoAgendamento(ctx, ag);
          conteudoEl.appendChild(el);
        });
      }

      slotEl.appendChild(horaEl);
      slotEl.appendChild(conteudoEl);
      lista.appendChild(slotEl);

      const foco = ctx.state.get("horaFocoDia");
      if (foco && foco === hora && !slotParaFoco) slotParaFoco = slotEl;
    });

    if (slotParaFoco) slotParaFoco.scrollIntoView({ block: "start", behavior: "smooth" });
    else if (isHoje && hhNow) {
      const elNow = lista.querySelector(`.agenda-slot[data-hora="${hhNow}"]`);
      if (elNow) elNow.scrollIntoView({ block: "start", behavior: "smooth" });
    }

    ctx.state.set("horaFocoDia", null);
  }

  function scrollToNow(ctx) {
    const now = getNowSlot(ctx);
    if (!now.hhmm) return;

    if (!ctx.dom.inputData) return;

    if (ctx.dom.inputData.value !== now.dataStr) {
      ctx.dom.inputData.value = now.dataStr;
      ctx.state.set("horaFocoDia", now.hhmm);
      reload(ctx);
      return;
    }

    const lista = ctx.dom.listaHorariosEl;
    if (!lista) return;
    const elNow = lista.querySelector(`.agenda-slot[data-hora="${now.hhmm}"]`);
    if (elNow) elNow.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  root.Agenda.day = { init, reload, applyFilters, scrollToNow };
})();

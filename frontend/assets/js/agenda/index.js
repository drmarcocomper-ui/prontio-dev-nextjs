/* PRONTIO - Agenda Orchestrator (index.js)
 * Responsável por:
 * - montar contexto (bus, state, pref, api, utils)
 * - inicializar módulos (day/week/new/typeahead)
 * - aplicar listeners da página (navegação, filtros, visão)
 */
(function () {
  "use strict";

  const root = (window.PRONTIO = window.PRONTIO || {});
  root.Agenda = root.Agenda || {};

  const LOG_PREFIX = "[PRONTIO][Agenda]";
  const log = (...a) => console.log(LOG_PREFIX, ...a);
  const warn = (...a) => console.warn(LOG_PREFIX, ...a);
  const error = (...a) => console.error(LOG_PREFIX, ...a);

  function createBus() {
    const listeners = new Map();
    function on(evt, fn) {
      if (!evt || typeof fn !== "function") return () => {};
      if (!listeners.has(evt)) listeners.set(evt, new Set());
      listeners.get(evt).add(fn);
      return () => off(evt, fn);
    }
    function off(evt, fn) {
      const set = listeners.get(evt);
      if (!set) return;
      set.delete(fn);
      if (!set.size) listeners.delete(evt);
    }
    function emit(evt, payload) {
      const set = listeners.get(evt);
      if (!set) return;
      [...set].forEach((fn) => {
        try { fn(payload); } catch (e) { error("bus handler erro", evt, e); }
      });
    }
    return { on, off, emit };
  }

  function getCoreToast() {
    const core = root.core || {};
    return (
      (core.ui && core.ui.toast) ||
      (root.ui && root.ui.toast) ||
      (window.UI && window.UI.toast) ||
      null
    );
  }

  function byId(id) {
    const el = document.getElementById(id);
    if (!el) warn(`Elemento #${id} não encontrado no DOM.`);
    return el;
  }

  function initPage() {
    const bus = createBus();
    const toast = getCoreToast();

    const state = root.Agenda.state;
    const pref = root.Agenda.pref;
    const utils = root.Agenda.utils;
    const api = root.Agenda.api;
    const modals = root.Agenda.modalsNew;
    const day = root.Agenda.day;
    const week = root.Agenda.week;
    const forms = root.Agenda.new;

    if (!state || !pref || !utils || !api || !modals || !day || !week || !forms) {
      error("Módulos da Agenda faltando:", {
        state: !!state, pref: !!pref, utils: !!utils, api: !!api,
        modals: !!modals, day: !!day, week: !!week, forms: !!forms
      });
      alert("Agenda incompleta: verifique carregamento dos scripts em /assets/js/agenda/.");
      return;
    }

    // contexto compartilhado
    const ctx = {
      bus,
      toast,
      state,
      pref,
      utils,
      api,
      modals,
      dom: {
        inputData: byId("input-data"),
        btnHoje: byId("btn-hoje"),
        btnAgora: byId("btn-agora"),
        btnDiaAnterior: byId("btn-dia-anterior"),
        btnDiaPosterior: byId("btn-dia-posterior"),
        btnVisaoDia: byId("btn-visao-dia"),
        btnVisaoSemana: byId("btn-visao-semana"),
        secDia: document.querySelector(".agenda-dia"),
        secSemana: document.getElementById("agenda-semana"),
        listaHorariosEl: byId("agenda-lista-horarios"),
        semanaGridEl: byId("agenda-semana-grid"),
        // resumo
        resumoTotalEl: byId("resumo-total"),
        resumoConfirmadosEl: byId("resumo-confirmados"),
        resumoFaltasEl: byId("resumo-faltas"),
        resumoCanceladosEl: byId("resumo-cancelados"),
        resumoConcluidosEl: byId("resumo-concluidos"),
        resumoEmAtendimentoEl: byId("resumo-em-atendimento"),
        // filtros
        inputFiltroNome: byId("filtro-nome"),
        selectFiltroStatus: byId("filtro-status"),
        btnLimparFiltros: byId("btn-limpar-filtros"),
        // botões topo
        btnNovoAgendamento: byId("btn-novo-agendamento"),
        btnBloquearHorario: byId("btn-bloquear-horario")
      }
    };

    // Eventos padrão
    bus.on("agenda:toast", (p) => {
      const msg = (p && p.message) || "";
      if (!msg) return;
      const kind = (p && p.kind) || "info";
      if (toast) {
        const fn = toast[kind] || toast.info;
        if (typeof fn === "function") return fn(msg);
      }
      if (kind === "error") alert(msg);
      else log("toast:", kind, msg);
    });

    bus.on("agenda:error", (p) => {
      const msg = (p && p.message) || "Ocorreu um erro na Agenda.";
      error("agenda:error", p);
      bus.emit("agenda:toast", { kind: "error", message: msg });
    });

    // init módulos base
    state.init(ctx);
    pref.init(ctx);
    api.init(ctx);
    utils.init(ctx);
    modals.init(ctx);
    forms.init(ctx);
    day.init(ctx);
    week.init(ctx);

    // aplica prefs iniciais na UI
    pref.applyToUI(ctx);

    // data default
    if (ctx.dom.inputData && !ctx.dom.inputData.value) {
      ctx.dom.inputData.value = utils.formatDateToInput(new Date());
    }

    // visão inicial
    const prefs = pref.load();
    state.set("modoVisao", prefs.modoVisao);

    function setVisao(modo) {
      if (modo !== "dia" && modo !== "semana") return;

      state.set("modoVisao", modo);
      pref.save({ modoVisao: modo });

      if (modo === "dia") {
        ctx.dom.secDia && ctx.dom.secDia.classList.remove("hidden");
        ctx.dom.secSemana && ctx.dom.secSemana.classList.add("hidden");
        ctx.dom.btnVisaoDia && ctx.dom.btnVisaoDia.classList.add("view-active");
        ctx.dom.btnVisaoSemana && ctx.dom.btnVisaoSemana.classList.remove("view-active");
        day.reload(ctx);
      } else {
        ctx.dom.secDia && ctx.dom.secDia.classList.add("hidden");
        ctx.dom.secSemana && ctx.dom.secSemana.classList.remove("hidden");
        ctx.dom.btnVisaoDia && ctx.dom.btnVisaoDia.classList.remove("view-active");
        ctx.dom.btnVisaoSemana && ctx.dom.btnVisaoSemana.classList.add("view-active");
        week.reload(ctx);
      }
    }

    // listeners página
    ctx.dom.inputData && ctx.dom.inputData.addEventListener("change", () => {
      const modo = state.get("modoVisao");
      if (modo === "dia") day.reload(ctx);
      else week.reload(ctx);
    });

    ctx.dom.btnHoje && ctx.dom.btnHoje.addEventListener("click", () => {
      if (!ctx.dom.inputData) return;
      ctx.dom.inputData.value = utils.formatDateToInput(new Date());
      const modo = state.get("modoVisao");
      if (modo === "dia") day.reload(ctx);
      else week.reload(ctx);
    });

    ctx.dom.btnAgora && ctx.dom.btnAgora.addEventListener("click", () => {
      const modo = state.get("modoVisao");
      if (modo === "dia") day.scrollToNow(ctx);
      else week.scrollToNow(ctx);
    });

    ctx.dom.btnDiaAnterior && ctx.dom.btnDiaAnterior.addEventListener("click", () => {
      if (!ctx.dom.inputData || !ctx.dom.inputData.value) return;
      const d = utils.parseInputDate(ctx.dom.inputData.value);
      const modo = state.get("modoVisao");
      d.setDate(d.getDate() - (modo === "semana" ? 7 : 1));
      ctx.dom.inputData.value = utils.formatDateToInput(d);
      if (modo === "dia") day.reload(ctx);
      else week.reload(ctx);
    });

    ctx.dom.btnDiaPosterior && ctx.dom.btnDiaPosterior.addEventListener("click", () => {
      if (!ctx.dom.inputData || !ctx.dom.inputData.value) return;
      const d = utils.parseInputDate(ctx.dom.inputData.value);
      const modo = state.get("modoVisao");
      d.setDate(d.getDate() + (modo === "semana" ? 7 : 1));
      ctx.dom.inputData.value = utils.formatDateToInput(d);
      if (modo === "dia") day.reload(ctx);
      else week.reload(ctx);
    });

    ctx.dom.btnVisaoDia && ctx.dom.btnVisaoDia.addEventListener("click", () => setVisao("dia"));
    ctx.dom.btnVisaoSemana && ctx.dom.btnVisaoSemana.addEventListener("click", () => setVisao("semana"));

    // filtros
    let filtroDebounce = null;
    function onFiltrosChanged() {
      if (filtroDebounce) clearTimeout(filtroDebounce);
      filtroDebounce = setTimeout(() => {
        const modo = state.get("modoVisao");
        if (modo === "dia") day.applyFilters(ctx);
        else week.reload(ctx);
      }, 120);
    }

    ctx.dom.inputFiltroNome && ctx.dom.inputFiltroNome.addEventListener("input", () => {
      pref.setFiltros({
        nome: ctx.dom.inputFiltroNome.value,
        status: ctx.dom.selectFiltroStatus ? ctx.dom.selectFiltroStatus.value : ""
      });
      onFiltrosChanged();
    });

    ctx.dom.selectFiltroStatus && ctx.dom.selectFiltroStatus.addEventListener("change", () => {
      pref.setFiltros({
        nome: ctx.dom.inputFiltroNome ? ctx.dom.inputFiltroNome.value : "",
        status: ctx.dom.selectFiltroStatus.value
      });
      onFiltrosChanged();
    });

    ctx.dom.btnLimparFiltros && ctx.dom.btnLimparFiltros.addEventListener("click", () => {
      pref.setFiltros({ nome: "", status: "" });
      pref.applyToUI(ctx);
      const modo = state.get("modoVisao");
      if (modo === "dia") day.applyFilters(ctx);
      else week.reload(ctx);
    });

    // botões "novo" / "bloquear"
    ctx.dom.btnNovoAgendamento && ctx.dom.btnNovoAgendamento.addEventListener("click", () => {
      forms.openNovo(ctx, null);
    });

    ctx.dom.btnBloquearHorario && ctx.dom.btnBloquearHorario.addEventListener("click", () => {
      forms.openBloqueio(ctx, null);
    });

    // ESC fecha modais (central)
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      forms.onEsc(ctx);
    });

    // start
    setVisao(state.get("modoVisao") || "dia");
    bus.emit("agenda:ready", { at: new Date().toISOString() });
    log("Página Agenda pronta.");
  }

  root.Agenda.initPage = initPage;
})();

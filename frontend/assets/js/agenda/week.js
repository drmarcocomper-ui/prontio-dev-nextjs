/* PRONTIO - Agenda Week (week.js)
 * - carrega semana
 * - renderiza grid
 * Obs: usa o mesmo config e filtros do pref
 */
(function () {
  "use strict";

  const root = (window.PRONTIO = window.PRONTIO || {});
  root.Agenda = root.Agenda || {};

  function init(ctx) {}

  async function ensureConfig(ctx) {
    // reaproveita lógica do day: se já carregou, ok
    if (ctx.state.isConfigLoaded()) return;
    // força carregar via api (igual day)
    try {
      const data = await ctx.api.obterConfig();
      if (data && typeof data === "object") {
        const dur = parseInt(String(data.duracao_grade_minutos || ""), 10);
        ctx.state.setConfig({
          hora_inicio_padrao: data.hora_inicio_padrao || ctx.state.get("agendaConfig").hora_inicio_padrao,
          hora_fim_padrao: data.hora_fim_padrao || ctx.state.get("agendaConfig").hora_fim_padrao,
          duracao_grade_minutos: isFinite(dur) && dur > 0 ? dur : ctx.state.get("agendaConfig").duracao_grade_minutos
        });
      }
    } catch (e) {
      console.warn("[PRONTIO][Agenda][Week] erro ao carregar config; usando defaults.", e);
    } finally {
      ctx.state.markConfigLoaded();
    }
  }

  function getSlots(ctx) {
    const cfg = ctx.state.get("agendaConfig");
    const inicioMin = ctx.utils.timeToMinutes(cfg.hora_inicio_padrao) ?? 8 * 60;
    const fimMin = ctx.utils.timeToMinutes(cfg.hora_fim_padrao) ?? 18 * 60;
    const passo = parseInt(String(cfg.duracao_grade_minutos || 15), 10) || 15;

    const slots = [];
    for (let t = inicioMin; t <= fimMin; t += passo) slots.push(ctx.utils.minutesToTime(t));
    return { slots };
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
    if (!ctx.dom.inputData || !ctx.dom.inputData.value) return;
    const dataStr = ctx.dom.inputData.value;

    const mySeq = ctx.state.bumpSeqSemana();
    if (ctx.dom.semanaGridEl) ctx.dom.semanaGridEl.innerHTML = '<div class="agenda-loading">Carregando semana...</div>';

    try {
      await ensureConfig(ctx);

      const data = await ctx.api.listarSemana(dataStr);
      if (mySeq !== ctx.state.get("reqSeqSemana")) return;

      const diasResp = data && data.dias ? data.dias : [];
      const agsUi = [];
      const byDayHour = {};

      diasResp.forEach((dia) => {
        const ds = dia && dia.data ? String(dia.data) : "";
        const horarios = dia && dia.horarios ? dia.horarios : [];
        if (!ds) return;

        horarios.forEach((h) => {
          const hh = h && h.hora ? String(h.hora) : "";
          const arr = h && h.agendamentos ? h.agendamentos : [];

          arr.forEach((ag) => {
            const ui = ctx.utils.normalizeUiAg(ag);
            if (!ui) return;

            if (!ui.data) ui.data = ds;
            if (!ui.hora_inicio && hh) ui.hora_inicio = hh;

            agsUi.push(ui);

            const horaNorm = ctx.utils.normalizeHora(ui.hora_inicio);
            if (!horaNorm) return;
            if (!byDayHour[ui.data]) byDayHour[ui.data] = {};
            if (!byDayHour[ui.data][horaNorm]) byDayHour[ui.data][horaNorm] = [];
            byDayHour[ui.data][horaNorm].push({ ...ui, __hora_norm: horaNorm });
          });
        });
      });

      ctx.state.set("agendamentosOriginaisSemana", agsUi);

      const dias = diasResp.map((d) => String(d.data || "")).filter(Boolean);
      const { slots } = getSlots(ctx);
      renderGrid(ctx, { dias, slots, byDayHour });
    } catch (e) {
      if (mySeq !== ctx.state.get("reqSeqSemana")) return;
      if (ctx.dom.semanaGridEl) {
        ctx.dom.semanaGridEl.innerHTML = "";
        const wrap = document.createElement("div");
        wrap.className = "agenda-erro";
        wrap.textContent = "Não foi possível carregar a semana: " + (e && e.message ? e.message : String(e));
        ctx.dom.semanaGridEl.appendChild(wrap);
      }
    }
  }

  function getNowSlot(ctx) {
    const now = new Date();
    const dataStr = ctx.utils.formatDateToInput(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const cfg = ctx.state.get("agendaConfig");
    const inicioMin = ctx.utils.timeToMinutes(cfg.hora_inicio_padrao) ?? 8 * 60;
    const fimMin = ctx.utils.timeToMinutes(cfg.hora_fim_padrao) ?? 18 * 60;
    const passo = parseInt(String(cfg.duracao_grade_minutos || 15), 10) || 15;

    if (nowMin < inicioMin || nowMin > fimMin) return { dataStr, hhmm: null };
    const idx = ctx.utils.clamp(Math.floor((nowMin - inicioMin) / passo), 0, Math.floor((fimMin - inicioMin) / passo));
    const hhmm = ctx.utils.minutesToTime(inicioMin + idx * passo);
    return { dataStr, hhmm };
  }

  function renderGrid(ctx, grid) {
    const el = ctx.dom.semanaGridEl;
    if (!el) return;

    el.innerHTML = "";

    const dias = grid.dias || [];
    const slots = grid.slots || [];
    const byDayHour = grid.byDayHour || {};

    if (!dias.length || !slots.length) {
      el.innerHTML = '<div class="agenda-vazia">Nenhum horário configurado para exibir.</div>';
      return;
    }

    const now = getNowSlot(ctx);
    const { termo, statusFiltro } = getFiltrosNormalized(ctx);

    const headerRow = document.createElement("div");
    headerRow.className = "semana-row semana-header-row semana-sticky";
    headerRow.dataset.hora = "__header__";

    const corner = document.createElement("div");
    corner.className = "semana-cell semana-corner-cell semana-sticky-cell";
    corner.textContent = "";
    headerRow.appendChild(corner);

    dias.slice(0, 6).forEach((ds) => {
      const cell = document.createElement("div");
      cell.className = "semana-cell semana-header-cell semana-sticky-cell";
      cell.innerHTML = `
        <div class="semana-header-dia">${ctx.utils.getDiaSemanaLabel(ds)}</div>
        <div class="semana-header-data">${ctx.utils.formatDataBonita(ds)}</div>
      `;
      if (ds === now.dataStr) cell.classList.add("semana-header-today");
      headerRow.appendChild(cell);
    });

    el.appendChild(headerRow);

    slots.forEach((hora) => {
      const row = document.createElement("div");
      row.className = "semana-row";
      row.dataset.hora = hora;
      if (now.hhmm && hora === now.hhmm) row.classList.add("semana-row-now");

      const horaCell = document.createElement("div");
      horaCell.className = "semana-cell semana-hora-cell semana-sticky-col";
      horaCell.textContent = hora;
      row.appendChild(horaCell);

      dias.slice(0, 6).forEach((ds) => {
        const cell = document.createElement("div");
        cell.className = "semana-cell semana-slot-cell";
        if (ds === now.dataStr && now.hhmm && hora === now.hhmm) cell.classList.add("semana-slot-now");

        const agsNoHorario = ((byDayHour[ds] && byDayHour[ds][hora]) ? byDayHour[ds][hora] : [])
          .filter((ag) => matchesFiltro(ctx, ag, termo, statusFiltro));

        if (agsNoHorario.length) {
          agsNoHorario.forEach((ag) => {
            const item = document.createElement("div");
            item.classList.add("semana-agenda-item");

            if (ag.bloqueio) {
              item.classList.add("semana-bloqueio-item");
              item.textContent = "Bloqueado";
            } else {
              const nome = ag.nome_paciente || "(sem nome)";
              const status = ag.status || "";
              const tipo = ag.tipo || "";
              const parts = [nome];
              if (tipo) parts.push(tipo);
              if (status) parts.push(status);
              item.textContent = parts.join(" • ");

              item.addEventListener("click", () => {
                ctx.state.set("horaFocoDia", hora);
                if (ctx.dom.inputData) ctx.dom.inputData.value = ds;
                // troca para dia reaproveitando o orquestrador via clique no botão
                ctx.dom.btnVisaoDia && ctx.dom.btnVisaoDia.click();
              });
            }

            cell.appendChild(item);
          });
        } else {
          cell.classList.add("semana-slot-empty");
          cell.addEventListener("dblclick", () => {
            if (ctx.dom.inputData) ctx.dom.inputData.value = ds;
            ctx.dom.btnVisaoDia && ctx.dom.btnVisaoDia.click();
            setTimeout(() => ctx.AgendaNew.openNovo(ctx, hora), 50);
          });
        }

        row.appendChild(cell);
      });

      el.appendChild(row);
    });
  }

  function scrollToNow(ctx) {
    const now = getNowSlot(ctx);
    if (!now.hhmm) return;

    if (!ctx.dom.inputData) return;

    if (ctx.dom.inputData.value !== now.dataStr) {
      ctx.dom.inputData.value = now.dataStr;
      reload(ctx);
      return;
    }

    const marker = ctx.dom.semanaGridEl && ctx.dom.semanaGridEl.querySelector(`.semana-row[data-hora="${now.hhmm}"]`);
    if (marker) marker.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  root.Agenda.week = { init, reload, scrollToNow };
})();

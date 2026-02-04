// frontend/assets/js/pages/page-laudo.js
// =====================================
// PRONTIO - Página de LAUDO (script padrão, SEM ES Modules)
// Usa paciente atual do PRONTIO.core.state (fallback legacy localStorage)
// Ações de API (tentativas por compat):
//  - Laudos.Criar / Laudos_Criar
//  - Laudos.ListarPorPaciente / Laudos_ListarPorPaciente
//  - Laudos.GerarPdf / Laudos.GerarPDF / Laudos_GerarPdf / Laudos_GerarPDF
//
// ✅ Padrão main.js:
// - PRONTIO.pages.laudo.init = init
// - Fallback DOMContentLoaded só se main.js não rodar
// =====================================

(function (global, document) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.pages = PRONTIO.pages || {};
  PRONTIO.pages.laudo = PRONTIO.pages.laudo || {};
  PRONTIO._pageInited = PRONTIO._pageInited || {};

  // Guard: só roda na página laudo
  try {
    const body = document && document.body;
    const pageId = body && body.dataset ? String(body.dataset.pageId || body.getAttribute("data-page-id") || "") : "";
    if (pageId && pageId !== "laudo") return;
  } catch (_) {}

  const callApiData =
    (PRONTIO.api && typeof PRONTIO.api.callApiData === "function")
      ? PRONTIO.api.callApiData
      : (typeof global.callApiData === "function")
      ? global.callApiData
      : null;

  function getPacienteAtual_() {
    try {
      if (PRONTIO.core && PRONTIO.core.state && typeof PRONTIO.core.state.getPacienteAtual === "function") {
        return PRONTIO.core.state.getPacienteAtual();
      }
    } catch (_) {}
    return null;
  }

  function createPageMessages_(selector) {
    const el = document.querySelector(selector);
    function set(text, cls) {
      if (!el) return;
      el.style.display = text ? "" : "none";
      el.textContent = text || "";
      el.className = "mensagem " + (cls ? ("mensagem-" + cls) : "");
    }
    return {
      info: (t) => set(t, "info"),
      erro: (t) => set(t, "erro"),
      sucesso: (t) => set(t, "sucesso"),
      clear: () => set("", "")
    };
  }

  const msgs = createPageMessages_("#mensagemLaudo");

  function mostrarMensagemLaudo(texto, tipo) {
    if (!texto) {
      msgs.clear();
      return;
    }
    const t = String(tipo || "info");
    if (t === "erro") msgs.erro(texto);
    else if (t === "sucesso") msgs.sucesso(texto);
    else msgs.info(texto);
  }

  async function callApiDataTry_(actions, payload) {
    if (!callApiData) {
      const err = new Error("API não disponível (callApiData indefinido).");
      err.code = "CLIENT_NO_API";
      throw err;
    }

    const list = Array.isArray(actions) ? actions : [actions];
    let lastErr = null;

    for (let i = 0; i < list.length; i++) {
      const action = String(list[i] || "").trim();
      if (!action) continue;
      try {
        return await callApiData({ action, payload: payload || {} });
      } catch (e) {
        lastErr = e;
      }
    }

    throw lastErr || new Error("Falha ao chamar API (todas as actions falharam).");
  }

  function getPacienteContexto_() {
    const st = getPacienteAtual_();
    if (st && st.id) {
      return { idPaciente: String(st.id), nomePaciente: String(st.nome || "") };
    }

    let idPaciente = "";
    let nomePaciente = "";
    try { idPaciente = localStorage.getItem("prontio_pacienteAtualId") || ""; } catch (_) {}
    try { nomePaciente = localStorage.getItem("prontio_pacienteAtualNome") || ""; } catch (_) {}

    return { idPaciente: String(idPaciente || ""), nomePaciente: String(nomePaciente || "") };
  }

  function setDisabledAllForm_(formEl, disabled) {
    if (!formEl) return;
    try {
      Array.from(formEl.elements || []).forEach((el) => {
        el.disabled = !!disabled;
      });
    } catch (_) {}
  }

  function limparCamposLaudo() {
    const titulo = document.getElementById("laudoTitulo");
    const tipo = document.getElementById("laudoTipo");
    const texto = document.getElementById("laudoTexto");
    const obs = document.getElementById("laudoObservacoes");

    if (titulo) titulo.value = "";
    if (tipo) tipo.value = "";
    if (texto) texto.value = "";
    if (obs) obs.value = "";

    mostrarMensagemLaudo("Campos do laudo limpos.", "info");
  }

  function formatarDataHoraBRLaudo(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);

    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");

    return `${dia}/${mes}/${ano} ${hh}:${mm}`;
  }

  async function salvarLaudo(idPaciente) {
    if (!idPaciente) {
      mostrarMensagemLaudo("Nenhum paciente selecionado. Não é possível salvar laudo.", "erro");
      return;
    }

    const titulo = (document.getElementById("laudoTitulo")?.value || "").trim();
    const tipo = (document.getElementById("laudoTipo")?.value || "").trim();
    const texto = (document.getElementById("laudoTexto")?.value || "").trim();
    const observacoes = (document.getElementById("laudoObservacoes")?.value || "").trim();

    if (!titulo) {
      mostrarMensagemLaudo("Informe o título do laudo.", "erro");
      return;
    }
    if (!texto) {
      mostrarMensagemLaudo("Informe o texto do laudo.", "erro");
      return;
    }

    mostrarMensagemLaudo("Salvando laudo...", "info");

    try {
      await callApiDataTry_(
        ["Laudos.Criar", "Laudos_Criar", "Laudo.Criar", "Laudo_Criar"],
        { idPaciente, titulo, tipo, texto, observacoes }
      );

      mostrarMensagemLaudo("Laudo salvo com sucesso.", "sucesso");
      limparCamposLaudo();
      await carregarLaudos(idPaciente);
    } catch (e) {
      mostrarMensagemLaudo((e && e.message) ? e.message : "Erro ao salvar laudo.", "erro");
      console.error("Erro Laudos.Criar:", e);
    }
  }

  async function carregarLaudos(idPaciente) {
    if (!idPaciente) return;

    const tbody = document.getElementById("tabelaLaudosBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    try {
      const data = await callApiDataTry_(
        ["Laudos.ListarPorPaciente", "Laudos_ListarPorPaciente", "Laudo.ListarPorPaciente", "Laudo_ListarPorPaciente"],
        { idPaciente }
      );

      const laudos = (data && (data.laudos || data.items || data.lista)) ? (data.laudos || data.items || data.lista) : [];
      const arr = Array.isArray(laudos) ? laudos : [];

      if (!arr.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 5;
        td.textContent = "Nenhum laudo registrado para este paciente.";
        // ✅ P4: Usa classe CSS em vez de inline styles
        td.className = "tabela-laudos-vazio";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
      }

      arr.forEach((laudo) => {
        const tr = document.createElement("tr");
        tr.dataset.idLaudo = laudo.idLaudo || "";

        const tdData = document.createElement("td");
        tdData.className = "col-laudo-data";
        tdData.textContent = formatarDataHoraBRLaudo(laudo.dataHoraCriacao || "");
        tr.appendChild(tdData);

        const tdTitulo = document.createElement("td");
        tdTitulo.textContent = laudo.titulo || "";
        tr.appendChild(tdTitulo);

        const tdTipo = document.createElement("td");
        tdTipo.className = "col-laudo-tipo";
        tdTipo.textContent = laudo.tipo || "";
        tr.appendChild(tdTipo);

        const tdObs = document.createElement("td");
        tdObs.textContent = laudo.observacoes || "";
        tr.appendChild(tdObs);

        const tdAcoes = document.createElement("td");
        tdAcoes.className = "col-laudo-acoes";

        const divAcoes = document.createElement("div");
        divAcoes.className = "acoes-laudo-lista";

        const btnPdf = document.createElement("button");
        btnPdf.type = "button";
        btnPdf.textContent = "PDF";
        btnPdf.className = "btn secundario";
        btnPdf.addEventListener("click", async () => {
          const idLaudo = laudo.idLaudo;
          if (!idLaudo) {
            // ✅ P1: Usa mostrarMensagemLaudo em vez de alert()
            mostrarMensagemLaudo("ID do laudo não encontrado.", "erro");
            return;
          }
          await gerarPdfLaudo(idLaudo);
        });

        const btnModelo = document.createElement("button");
        btnModelo.type = "button";
        btnModelo.textContent = "Usar como modelo";
        btnModelo.className = "btn primario";
        btnModelo.addEventListener("click", () => {
          aplicarLaudoComoModelo(laudo);
        });

        divAcoes.appendChild(btnPdf);
        divAcoes.appendChild(btnModelo);
        tdAcoes.appendChild(divAcoes);
        tr.appendChild(tdAcoes);

        tbody.appendChild(tr);
      });

    } catch (e) {
      mostrarMensagemLaudo((e && e.message) ? e.message : "Erro ao carregar laudos do paciente.", "erro");
      console.error("Erro Laudos.ListarPorPaciente:", e);
    }
  }

  function aplicarLaudoComoModelo(laudo) {
    const titulo = document.getElementById("laudoTitulo");
    const tipo = document.getElementById("laudoTipo");
    const texto = document.getElementById("laudoTexto");
    const obs = document.getElementById("laudoObservacoes");

    if (titulo) titulo.value = laudo.titulo || "";
    if (tipo) tipo.value = laudo.tipo || "";
    if (texto) texto.value = laudo.texto || "";
    if (obs) obs.value = laudo.observacoes || "";

    mostrarMensagemLaudo("Laudo carregado no formulário para edição.", "info");
    if (texto) texto.focus();
  }

  async function gerarPdfLaudo(idLaudo) {
    mostrarMensagemLaudo("Gerando laudo em PDF...", "info");

    try {
      const data = await callApiDataTry_(
        ["Laudos.GerarPdf", "Laudos.GerarPDF", "Laudos_GerarPdf", "Laudos_GerarPDF", "Laudo.GerarPdf", "Laudo_GerarPdf"],
        { idLaudo }
      );

      const html = data && data.html ? data.html : null;
      if (!html) {
        mostrarMensagemLaudo("PDF gerado, mas o HTML do laudo não foi retornado.", "erro");
        return;
      }

      mostrarMensagemLaudo("Laudo gerado com sucesso. Abrindo em nova aba...", "sucesso");

      const win = global.open("", "_blank");
      if (!win) {
        // ✅ P1: Usa mostrarMensagemLaudo em vez de alert()
        mostrarMensagemLaudo("Não foi possível abrir a nova aba. Verifique se o bloqueador de pop-up está ativo.", "erro");
        return;
      }

      win.document.open();
      win.document.write(html + "<script>setTimeout(function(){window.print();},500);<\/script>");
      win.document.close();
    } catch (e) {
      mostrarMensagemLaudo((e && e.message) ? e.message : "Erro ao gerar PDF do laudo.", "erro");
      console.error("Erro Laudos.GerarPdf:", e);
    }
  }

  async function inicializarLaudo() {
    const ctx = getPacienteContexto_();
    const idPaciente = ctx.idPaciente;
    const nomePaciente = ctx.nomePaciente;

    const spanId = document.getElementById("laudoPacienteId");
    const spanNome = document.getElementById("laudoPacienteNome");
    const topbarSubtitle = document.getElementById("topbar-subtitle");
    const form = document.getElementById("formLaudo");
    const btnLimpar = document.getElementById("btnLimparLaudo");

    if (!idPaciente) {
      if (spanId) spanId.textContent = "-";
      if (spanNome) spanNome.textContent = "-";
      if (topbarSubtitle) topbarSubtitle.textContent = "Nenhum paciente selecionado.";

      mostrarMensagemLaudo(
        "Nenhum paciente selecionado. Volte à lista de pacientes, selecione um e depois abra Laudos.",
        "erro"
      );

      setDisabledAllForm_(form, true);
      return;
    }

    if (spanId) spanId.textContent = idPaciente;
    if (spanNome) spanNome.textContent = nomePaciente || "";
    if (topbarSubtitle) {
      topbarSubtitle.textContent = nomePaciente
        ? `Paciente: ${nomePaciente}`
        : `Paciente ID: ${idPaciente}`;
    }

    if (form) {
      if (form.dataset.boundSubmit !== "1") {
        form.dataset.boundSubmit = "1";
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          await salvarLaudo(idPaciente);
        });
      }
    }

    if (btnLimpar && btnLimpar.dataset.boundClick !== "1") {
      btnLimpar.dataset.boundClick = "1";
      btnLimpar.addEventListener("click", () => {
        limparCamposLaudo();
      });
    }

    mostrarMensagemLaudo("Carregando laudos do paciente...", "info");
    await carregarLaudos(idPaciente);
    mostrarMensagemLaudo("", "info");
  }

  function init() {
    if (PRONTIO._pageInited.laudo === true) return;
    PRONTIO._pageInited.laudo = true;

    inicializarLaudo().catch((e) => {
      console.error("[PRONTIO.laudo] erro:", e);
      mostrarMensagemLaudo("Erro ao inicializar Laudos.", "erro");
    });
  }

  // ✅ padrão main.js
  PRONTIO.pages.laudo.init = init;

  // ✅ fallback: só se main.js não rodar
  if (!PRONTIO._mainBootstrapped) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }

})(window, document);

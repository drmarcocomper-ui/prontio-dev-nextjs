// frontend/assets/js/features/pacientes/pacientes.actions.js
/**
 * PRONTIO — Pacientes Actions (Front)
 * ------------------------------------------------------------
 * Responsabilidades:
 * - Lógica de negócio
 * - CRUD de pacientes
 * - Gerenciamento de formulário
 * - Exportação CSV
 */

(function (global) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.features = PRONTIO.features || {};
  PRONTIO.features.pacientes = PRONTIO.features.pacientes || {};

  function createPacientesActions(ctx) {
    const { state, view, api, document: doc } = ctx || {};
    const document = doc || global.document;

    const stateModule = PRONTIO.features.pacientes.state || {};
    const getPacientesFromCache = stateModule.getPacientesFromCache || function () { return null; };
    const savePacientesToCache = stateModule.savePacientesToCache || function () {};
    const DEFAULT_VISIBLE_COLS = stateModule.DEFAULT_VISIBLE_COLS || {};

    // ========================================
    // Helpers
    // ========================================
    function normalizeToISODateString(valor) {
      if (!valor) return "";
      if (typeof valor === "string") {
        const s = valor.trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
          const parts = s.split("/");
          return parts[2] + "-" + parts[1] + "-" + parts[0];
        }
        return "";
      }
      const d = new Date(valor);
      if (isNaN(d.getTime())) return "";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return y + "-" + m + "-" + day;
    }

    function setPacienteAtualGlobal(id, nomeCompleto) {
      const nome = String(nomeCompleto || "").trim();
      const info = {
        origem: "pacientes",
        id: id,
        idPaciente: id,
        ID_Paciente: id,
        nomeCompleto: nome,
        nome: nome
      };

      try {
        if (PRONTIO.core && PRONTIO.core.state && typeof PRONTIO.core.state.setPacienteAtual === "function") {
          PRONTIO.core.state.setPacienteAtual(info);
        } else if (PRONTIO.state && typeof PRONTIO.state.setPacienteAtual === "function") {
          PRONTIO.state.setPacienteAtual(info);
        } else if (typeof global.setPacienteAtual === "function") {
          global.setPacienteAtual(info);
        }
      } catch (e) {
        console.warn("[Pacientes] Erro ao setPacienteAtualGlobal:", e);
      }
    }

    function clearPacienteAtualGlobal() {
      try {
        if (PRONTIO.core && PRONTIO.core.state && typeof PRONTIO.core.state.clearPacienteAtual === "function") {
          PRONTIO.core.state.clearPacienteAtual();
        } else if (PRONTIO.state && typeof PRONTIO.state.clearPacienteAtual === "function") {
          PRONTIO.state.clearPacienteAtual();
        } else if (typeof global.clearPacienteAtual === "function") {
          global.clearPacienteAtual();
        }
      } catch (e) {
        console.warn("[Pacientes] Erro ao clearPacienteAtualGlobal:", e);
      }
    }

    // ========================================
    // Loading State
    // ========================================
    function setLoading(isLoading) {
      state.carregando = !!isLoading;

      try {
        document.body.classList.toggle("is-loading", state.carregando);
      } catch (_) {}

      try {
        const wrap = document.querySelector(".tabela-wrapper");
        if (wrap) wrap.setAttribute("aria-busy", state.carregando ? "true" : "false");
      } catch (_) {}

      const disableIds = [
        "btnCarregarPacientes", "btnNovoPaciente", "btnSalvarPaciente",
        "btnCancelarEdicao", "btnEditar", "btnInativar", "btnReativar",
        "btnIrProntuario", "btnCopiarDadosPaciente", "btnPaginaAnterior",
        "btnPaginaProxima", "chkUsarPaginacao", "selectPageSize",
        "btnConfigColunas", "btnExportarCsv"
      ];

      if (state.carregando) {
        disableIds.forEach(function (id) {
          const el = document.getElementById(id);
          if (el) el.disabled = true;
        });

        try {
          const filtro = document.getElementById("filtroTexto");
          if (filtro) filtro.disabled = true;
          const ativos = document.getElementById("chkSomenteAtivos");
          if (ativos) ativos.disabled = true;
          const orden = document.getElementById("selectOrdenacao");
          if (orden) orden.disabled = true;
        } catch (_) {}
      } else {
        reabilitarControles_();
      }
    }

    function reabilitarControles_() {
      try {
        const filtro = document.getElementById("filtroTexto");
        if (filtro) filtro.disabled = false;
        const ativos = document.getElementById("chkSomenteAtivos");
        if (ativos) ativos.disabled = false;
        const orden = document.getElementById("selectOrdenacao");
        if (orden) orden.disabled = false;
        const btnCols = document.getElementById("btnConfigColunas");
        if (btnCols) btnCols.disabled = false;

        const chkPag = document.getElementById("chkUsarPaginacao");
        if (chkPag) chkPag.disabled = false;

        const selPage = document.getElementById("selectPageSize");
        if (selPage) selPage.disabled = !state.usarPaginacao;

        const btnPrev = document.getElementById("btnPaginaAnterior");
        const btnNext = document.getElementById("btnPaginaProxima");
        if (btnPrev) btnPrev.disabled = !(state.usarPaginacao && state.lastPaging && state.lastPaging.hasPrev);
        if (btnNext) btnNext.disabled = !(state.usarPaginacao && state.lastPaging && state.lastPaging.hasNext);

        const hasSel = !!state.pacienteSelecionadoId;
        const btnIr = document.getElementById("btnIrProntuario");
        const btnEd = document.getElementById("btnEditar");
        const btnIn = document.getElementById("btnInativar");
        const btnRe = document.getElementById("btnReativar");
        const btnCp = document.getElementById("btnCopiarDadosPaciente");

        if (btnIr) btnIr.disabled = !hasSel;
        if (btnEd) btnEd.disabled = !hasSel;
        if (btnCp) btnCp.disabled = !hasSel;

        if (btnIn && btnRe) {
          if (!hasSel) {
            btnIn.disabled = true;
            btnRe.disabled = true;
          } else {
            if (state.pacienteSelecionadoAtivo) {
              btnIn.disabled = false;
              btnRe.disabled = true;
            } else {
              btnIn.disabled = true;
              btnRe.disabled = false;
            }
          }
        }

        const btnSalvar = document.getElementById("btnSalvarPaciente");
        const btnCancelar = document.getElementById("btnCancelarEdicao");
        if (btnSalvar) btnSalvar.disabled = false;
        if (btnCancelar) btnCancelar.disabled = !state.modoEdicao;

        const btnNovo = document.getElementById("btnNovoPaciente");
        if (btnNovo) btnNovo.disabled = false;

        const btnCar = document.getElementById("btnCarregarPacientes");
        if (btnCar) btnCar.disabled = false;

        const btnExport = document.getElementById("btnExportarCsv");
        if (btnExport) btnExport.disabled = false;
      } catch (_) {}
    }

    // ========================================
    // Formulário
    // ========================================
    function obterDadosFormulario() {
      const getValue = function (id) {
        const el = document.getElementById(id);
        return (el && el.value ? el.value : "").trim();
      };

      const obsImportantes = getValue("obsImportantes");
      const obsClinicas = getValue("observacoesClinicas");
      const obsAdministrativas = getValue("observacoesAdministrativas");
      const obsAdmFinal = obsAdministrativas || obsImportantes;

      return {
        nomeCompleto: getValue("nomeCompleto"),
        nomeSocial: getValue("nomeSocial"),
        dataNascimento: (document.getElementById("dataNascimento") || {}).value || "",
        sexo: (document.getElementById("sexo") || {}).value || "",
        estadoCivil: getValue("estadoCivil"),
        cpf: getValue("cpf"),
        rg: getValue("rg"),
        rgOrgaoEmissor: getValue("rgOrgaoEmissor"),
        telefone1: getValue("telefone1"),
        telefone2: getValue("telefone2"),
        email: getValue("email"),
        cep: getValue("cep"),
        logradouro: getValue("logradouro"),
        numero: getValue("numero"),
        complemento: getValue("complemento"),
        enderecoBairro: getValue("enderecoBairro"),
        enderecoCidade: getValue("enderecoCidade"),
        enderecoUf: getValue("enderecoUf"),
        planoSaude: getValue("planoSaude"),
        numeroCarteirinha: getValue("numeroCarteirinha"),
        observacoesClinicas: obsClinicas,
        observacoesAdministrativas: obsAdmFinal,
        obsImportantes: obsImportantes
      };
    }

    function preencherFormulario(p) {
      const setValue = function (id, v) {
        const el = document.getElementById(id);
        if (el) el.value = v || "";
      };

      setValue("nomeCompleto", p.nomeCompleto || p.nome || "");
      setValue("nomeSocial", p.nomeSocial || "");
      setValue("dataNascimento", normalizeToISODateString(p.dataNascimento || ""));
      setValue("sexo", p.sexo || "");
      setValue("estadoCivil", p.estadoCivil || "");
      setValue("cpf", p.cpf || "");
      setValue("rg", p.rg || "");
      setValue("rgOrgaoEmissor", p.rgOrgaoEmissor || "");
      setValue("telefone1", p.telefone1 || p.telefone || "");
      setValue("telefone2", p.telefone2 || "");
      setValue("email", p.email || "");
      setValue("cep", p.cep || "");
      setValue("logradouro", p.logradouro || "");
      setValue("numero", p.numero || "");
      setValue("complemento", p.complemento || "");
      setValue("enderecoBairro", p.enderecoBairro || p.bairro || "");
      setValue("enderecoCidade", p.enderecoCidade || p.cidade || "");
      setValue("enderecoUf", p.enderecoUf || "");
      setValue("planoSaude", p.planoSaude || "");
      setValue("numeroCarteirinha", p.numeroCarteirinha || "");
      setValue("observacoesClinicas", p.observacoesClinicas || "");
      setValue("observacoesAdministrativas", p.observacoesAdministrativas || "");
      setValue("obsImportantes", p.obsImportantes || p.observacoesAdministrativas || "");
    }

    function limparFormulario() {
      const form = document.getElementById("formPaciente");
      if (form) form.reset();
    }

    // ========================================
    // CRUD
    // ========================================
    async function salvarPaciente() {
      if (state.carregando) return;

      const dados = obterDadosFormulario();

      if (!dados.nomeCompleto) {
        view.mostrarMensagem("Nome completo é obrigatório.", "erro");
        return;
      }

      const estaEditando = state.modoEdicao && state.idEmEdicao;

      view.mostrarMensagem(estaEditando ? "Atualizando paciente..." : "Salvando paciente...", "info");
      setLoading(true);

      const payload = estaEditando ? Object.assign({ idPaciente: state.idEmEdicao }, dados) : dados;

      let resp;
      try {
        if (api) {
          resp = estaEditando ? await api.atualizar(payload) : await api.criar(payload);
        } else {
          throw new Error("API não disponível");
        }
      } catch (err) {
        const msg = (err && err.message) || "Erro ao salvar/atualizar paciente.";
        console.error("PRONTIO: erro em salvarPaciente:", err);
        view.mostrarMensagem(msg, "erro");
        setLoading(false);
        return;
      }

      await carregarPacientes();

      view.mostrarMensagem(estaEditando ? "Paciente atualizado com sucesso!" : "Paciente salvo com sucesso!", "sucesso");

      limparFormulario();
      if (estaEditando) sairModoEdicao(false);
      view.mostrarSecaoCadastro(false);

      setLoading(false);
    }

    async function carregarPacientes() {
      if (state.carregando) return;

      const prevSelectedId = state.pacienteSelecionadoId ? String(state.pacienteSelecionadoId) : null;
      const prevEditId = (state.modoEdicao && state.idEmEdicao) ? String(state.idEmEdicao) : null;

      const filtroTextoEl = document.getElementById("filtroTexto");
      const chkSomenteAtivos = document.getElementById("chkSomenteAtivos");

      const termo = filtroTextoEl ? (filtroTextoEl.value || "").trim() : "";
      const somenteAtivos = chkSomenteAtivos ? !!chkSomenteAtivos.checked : false;

      const payload = {
        q: termo,
        termo: termo,
        somenteAtivos: somenteAtivos,
        ordenacao: state.criterioOrdenacao
      };

      if (state.usarPaginacao) {
        payload.page = state.pageAtual;
        payload.pageSize = state.pageSizeAtual;
      }

      // Stale-while-revalidate
      const usandoFiltros = termo || somenteAtivos || state.usarPaginacao;
      const cachedItems = !usandoFiltros ? getPacientesFromCache() : null;

      if (cachedItems && cachedItems.length > 0) {
        state.pacientesCache = cachedItems;
        renderizarLista();
        view.mostrarMensagem("Carregando dados atualizados...", "info");
      } else {
        setLoading(true);
      }

      let data;
      try {
        if (api && typeof api.listar === "function") {
          data = await api.listar(payload);
        } else {
          throw new Error("API não disponível");
        }
      } catch (err) {
        const msg = (err && err.message) || "Erro ao carregar pacientes.";
        console.error("PRONTIO: erro em carregarPacientes:", err);

        if (!cachedItems) {
          view.mostrarMensagem(msg, "erro");
        } else {
          view.mostrarMensagem("Usando dados em cache (falha ao atualizar).", "info");
        }
        setLoading(false);
        return;
      }

      const freshItems = (data && (data.pacientes || data.lista || data.items)) || [];

      if (!usandoFiltros && freshItems.length > 0) {
        savePacientesToCache(freshItems);
      }

      state.pacientesCache = freshItems;
      renderizarLista();

      if (state.usarPaginacao) {
        state.lastPaging = data && data.paging ? data.paging : null;
        view.atualizarUIPaginacao(state.usarPaginacao, state.pageAtual, state.lastPaging);
      } else {
        state.lastPaging = null;
        view.atualizarUIPaginacao(false, 1, null);
      }

      view.mostrarMensagem("Pacientes carregados: " + state.pacientesCache.length, "sucesso");

      if (state.pacientesCache.length === 0) {
        atualizarSelecao(null, null, null);
        if (state.modoEdicao) sairModoEdicao(false);
        setLoading(false);
        return;
      }

      // Restaurar seleção anterior
      if (prevSelectedId) {
        const pSel = state.pacientesCache.find(function (p) {
          return String(p.idPaciente || p.ID_Paciente || p.id || "") === prevSelectedId;
        });

        if (pSel) {
          const id = String(pSel.idPaciente || pSel.ID_Paciente || pSel.id || "");
          const nome = String(pSel.nomeCompleto || pSel.nome || "");
          const ativo = typeof pSel.ativo === "boolean"
            ? pSel.ativo
            : String(pSel.ativo || "").toUpperCase() === "SIM" || String(pSel.ativo || "").toLowerCase() === "true";

          atualizarSelecao(id, nome, ativo);
          view.marcarLinhaSelecionada(id);
        } else {
          atualizarSelecao(null, null, null);
        }
      }

      // Restaurar edição anterior
      if (prevEditId) {
        const pEdit = state.pacientesCache.find(function (p) {
          return String(p.idPaciente || p.ID_Paciente || p.id || "") === prevEditId;
        });

        if (pEdit) {
          state.modoEdicao = true;
          state.idEmEdicao = prevEditId;
          preencherFormulario(pEdit);
          view.atualizarUIEdicao(true);
          view.mostrarSecaoCadastro(true);
        } else {
          state.modoEdicao = false;
          state.idEmEdicao = null;
          view.atualizarUIEdicao(false);
        }
      }

      setLoading(false);
    }

    function renderizarLista() {
      view.renderizarTabela(state.pacientesCache, {
        onSelect: function (tr, id, nome, ativo) {
          selecionarPaciente(tr, id, nome, ativo);
        },
        onDoubleClick: function (paciente) {
          view.abrirModalVisualizacao(paciente);
        }
      });
      aplicarColunasVisiveis();
    }

    async function alterarStatusPaciente(ativoDesejado) {
      if (state.carregando) return;

      if (!state.pacienteSelecionadoId) {
        view.mostrarMensagem("Selecione um paciente na lista primeiro.", "info");
        return;
      }

      const acaoTexto = ativoDesejado ? "reativar" : "inativar";
      const nomePaciente = state.pacienteSelecionadoNomeCompleto || "este paciente";

      view.abrirModalConfirmacao(
        "Tem certeza que deseja " + acaoTexto + " " + nomePaciente + "?",
        async function () {
          view.mostrarMensagem("Alterando status do paciente (" + acaoTexto + ")...", "info");
          setLoading(true);

          try {
            if (api && typeof api.alterarStatusAtivo === "function") {
              await api.alterarStatusAtivo({ idPaciente: state.pacienteSelecionadoId, ativo: ativoDesejado });
            } else {
              throw new Error("API não disponível");
            }
          } catch (err) {
            const msg = (err && err.message) || "Erro ao alterar status do paciente.";
            console.error("PRONTIO: erro em alterarStatusPaciente:", err);
            view.mostrarMensagem(msg, "erro");
            setLoading(false);
            return;
          }

          view.mostrarMensagem("Status do paciente atualizado com sucesso.", "sucesso");
          await carregarPacientes();
          setLoading(false);
        }
      );
    }

    // ========================================
    // Seleção
    // ========================================
    function selecionarPaciente(tr, id, nome, ativo) {
      view.marcarLinhaSelecionada(id);
      atualizarSelecao(id, nome, ativo);

      if (state.modoEdicao && id) {
        const p = state.pacientesCache.find(function (px) {
          return String(px.idPaciente || px.ID_Paciente || px.id || "") === id;
        });
        if (p) {
          preencherFormulario(p);
          state.idEmEdicao = id;
        }
      }
    }

    function atualizarSelecao(id, nomeCompleto, ativo) {
      state.pacienteSelecionadoId = id;
      state.pacienteSelecionadoNomeCompleto = nomeCompleto;
      state.pacienteSelecionadoAtivo = ativo;

      view.atualizarUISelecao(id, nomeCompleto, ativo);

      if (id) {
        setPacienteAtualGlobal(id, nomeCompleto);
      } else {
        clearPacienteAtualGlobal();
      }
    }

    // ========================================
    // Edição
    // ========================================
    function entrarModoEdicao() {
      if (!state.pacienteSelecionadoId) {
        view.mostrarMensagem("Selecione um paciente na lista primeiro.", "info");
        return;
      }

      const p = state.pacientesCache.find(function (px) {
        return String(px.idPaciente || px.ID_Paciente || px.id || "") === String(state.pacienteSelecionadoId);
      });

      if (!p) {
        view.mostrarMensagem("Paciente selecionado não encontrado na lista carregada.", "erro");
        return;
      }

      state.modoEdicao = true;
      state.idEmEdicao = state.pacienteSelecionadoId;
      preencherFormulario(p);
      view.atualizarUIEdicao(true);
      view.scrollToForm();
      view.mostrarMensagem("Editando paciente: " + (p.nomeCompleto || p.nome || ""), "info");
    }

    function sairModoEdicao(limparMensagem) {
      if (limparMensagem === undefined) limparMensagem = true;

      state.modoEdicao = false;
      state.idEmEdicao = null;
      limparFormulario();
      view.atualizarUIEdicao(false);
      view.mostrarSecaoCadastro(false);
      if (limparMensagem) view.mostrarMensagem("Edição cancelada.", "info");
    }

    function abrirNovoPaciente() {
      sairModoEdicao(false);
      view.mostrarSecaoCadastro(true);
      view.scrollToForm();
      const nomeInput = document.getElementById("nomeCompleto");
      if (nomeInput) setTimeout(function () { nomeInput.focus(); }, 100);
      view.mostrarMensagem("Novo paciente: preencha os dados e salve.", "info");
    }

    // ========================================
    // Navegação
    // ========================================
    function irParaProntuario() {
      if (!state.pacienteSelecionadoId) {
        view.mostrarMensagem("Selecione um paciente na lista primeiro.", "info");
        return;
      }

      setPacienteAtualGlobal(state.pacienteSelecionadoId, state.pacienteSelecionadoNomeCompleto || "");

      try {
        global.localStorage.setItem(
          "prontio.prontuarioContexto",
          JSON.stringify({
            origem: "pacientes",
            ID_Paciente: state.pacienteSelecionadoId,
            idPaciente: state.pacienteSelecionadoId,
            nomeCompleto: state.pacienteSelecionadoNomeCompleto || "",
            nome: state.pacienteSelecionadoNomeCompleto || ""
          })
        );
      } catch (e) {
        console.warn("[Pacientes] Não foi possível salvar prontio.prontuarioContexto:", e);
      }

      const params = new URLSearchParams();
      params.set("idPaciente", state.pacienteSelecionadoId);
      global.location.href = "prontuario.html?" + params.toString();
    }

    // ========================================
    // Colunas
    // ========================================
    function carregarConfigColunas() {
      try {
        const json = global.localStorage.getItem("prontio_pacientes_cols_visiveis");
        let cfg;

        if (json) {
          cfg = JSON.parse(json);
        } else {
          cfg = DEFAULT_VISIBLE_COLS;
        }

        const checkboxes = document.querySelectorAll(".chk-coluna");
        checkboxes.forEach(function (cb) {
          const col = cb.dataset.col;
          if (Object.prototype.hasOwnProperty.call(cfg, col)) {
            cb.checked = !!cfg[col];
          }
        });

        aplicarColunasVisiveis();
      } catch (e) {
        console.warn("Erro ao carregar configuração de colunas:", e);
      }
    }

    function aplicarColunasVisiveis() {
      const checkboxes = document.querySelectorAll(".chk-coluna");
      const cfg = {};

      checkboxes.forEach(function (cb) {
        const col = cb.dataset.col;
        cfg[col] = cb.checked;
      });

      view.aplicarVisibilidadeColunas(cfg);

      try {
        global.localStorage.setItem("prontio_pacientes_cols_visiveis", JSON.stringify(cfg));
      } catch (e) {
        console.warn("Erro ao salvar configuração de colunas:", e);
      }
    }

    // ========================================
    // Paginação
    // ========================================
    function salvarPreferenciasPaginacao() {
      try {
        global.localStorage.setItem("prontio_pacientes_paginacao", JSON.stringify({
          enabled: !!state.usarPaginacao,
          pageSize: state.pageSizeAtual
        }));
      } catch (_) {}
    }

    function carregarPreferenciasPaginacao() {
      const chk = document.getElementById("chkUsarPaginacao");
      const select = document.getElementById("selectPageSize");
      const controles = document.getElementById("paginacaoControles");

      try {
        const json = global.localStorage.getItem("prontio_pacientes_paginacao");
        if (json) {
          const cfg = JSON.parse(json);
          state.usarPaginacao = !!cfg.enabled;
          if (cfg.pageSize) state.pageSizeAtual = parseInt(cfg.pageSize, 10) || state.pageSizeAtual;
        }
      } catch (_) {}

      if (chk) chk.checked = !!state.usarPaginacao;
      if (select) select.value = String(state.pageSizeAtual);
      if (controles) controles.style.display = state.usarPaginacao ? "flex" : "none";
    }

    // ========================================
    // Exportação CSV
    // ========================================
    function escapeCsvValue(val) {
      if (val == null) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }

    function exportarCsv() {
      if (state.pacientesCache.length === 0) {
        view.mostrarMensagem("Nenhum paciente para exportar.", "info");
        return;
      }

      const colunas = [
        { key: "idPaciente", label: "ID" },
        { key: "nomeCompleto", label: "Nome Completo" },
        { key: "nomeSocial", label: "Nome Social" },
        { key: "cpf", label: "CPF" },
        { key: "rg", label: "RG" },
        { key: "dataNascimento", label: "Data Nascimento" },
        { key: "sexo", label: "Sexo" },
        { key: "estadoCivil", label: "Estado Civil" },
        { key: "telefone1", label: "Telefone 1" },
        { key: "telefone2", label: "Telefone 2" },
        { key: "email", label: "E-mail" },
        { key: "cep", label: "CEP" },
        { key: "logradouro", label: "Logradouro" },
        { key: "numero", label: "Número" },
        { key: "complemento", label: "Complemento" },
        { key: "enderecoBairro", label: "Bairro" },
        { key: "enderecoCidade", label: "Cidade" },
        { key: "enderecoUf", label: "UF" },
        { key: "planoSaude", label: "Plano de Saúde" },
        { key: "numeroCarteirinha", label: "Nº Carteirinha" },
        { key: "observacoesClinicas", label: "Obs. Clínicas" },
        { key: "observacoesAdministrativas", label: "Obs. Administrativas" },
        { key: "ativo", label: "Ativo" },
        { key: "dataCadastro", label: "Data Cadastro" }
      ];

      const header = colunas.map(function (c) { return escapeCsvValue(c.label); }).join(",");

      const linhas = state.pacientesCache.map(function (p) {
        return colunas.map(function (c) {
          let val = p[c.key];

          if (c.key === "idPaciente") {
            val = p.idPaciente || p.ID_Paciente || p.id || "";
          } else if (c.key === "nomeCompleto") {
            val = p.nomeCompleto || p.nome || "";
          } else if (c.key === "dataNascimento" || c.key === "dataCadastro") {
            val = view.formatarDataParaBR(val || p.criadoEm || p.CriadoEm || "");
          } else if (c.key === "ativo") {
            const ativoBool = typeof p.ativo === "boolean"
              ? p.ativo
              : String(p.ativo || "").toLowerCase() === "true" || String(p.ativo || "").toUpperCase() === "SIM";
            val = ativoBool ? "SIM" : "NÃO";
          } else if (c.key === "enderecoBairro") {
            val = p.enderecoBairro || p.bairro || "";
          } else if (c.key === "enderecoCidade") {
            val = p.enderecoCidade || p.cidade || "";
          }

          return escapeCsvValue(val || "");
        }).join(",");
      });

      const bom = "\uFEFF";
      const csvContent = bom + header + "\n" + linhas.join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);

      const hoje = new Date();
      const dataStr = hoje.getFullYear() + "-" +
        String(hoje.getMonth() + 1).padStart(2, "0") + "-" +
        String(hoje.getDate()).padStart(2, "0");
      link.setAttribute("download", "pacientes_" + dataStr + ".csv");

      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      view.mostrarMensagem("Exportação concluída: " + state.pacientesCache.length + " paciente(s).", "sucesso");
    }

    // ========================================
    // Copiar Dados
    // ========================================
    async function copiarDadosPaciente() {
      if (!state.pacienteSelecionadoId) {
        view.mostrarMensagem("Selecione um paciente primeiro.", "info");
        return;
      }

      const p = state.pacientesCache.find(function (px) {
        return String(px.idPaciente || px.ID_Paciente || px.id || "") === String(state.pacienteSelecionadoId);
      });

      if (!p) {
        view.mostrarMensagem("Paciente não encontrado na lista carregada.", "erro");
        return;
      }

      const texto = montarResumoPaciente(p);
      const ok = await copiarParaClipboard(texto);

      if (ok) {
        view.mostrarMensagem("Dados do paciente copiados para a área de transferência.", "sucesso");
      } else {
        view.mostrarMensagem("Não foi possível copiar automaticamente. Selecione e copie manualmente.", "info");
      }
    }

    function montarResumoPaciente(p) {
      const id = String(p.idPaciente || p.ID_Paciente || p.id || "");
      const nome = String(p.nomeCompleto || p.nomeExibicao || p.nome || "");
      const cpf = String(p.cpf || "");
      const tel = String(p.telefonePrincipal || p.telefone1 || p.telefone || "");
      const email = String(p.email || "");
      const plano = String(p.planoSaude || "");
      return [
        "PRONTIO — Dados do paciente",
        "ID: " + id,
        "Nome: " + nome,
        cpf ? ("CPF: " + cpf) : "",
        tel ? ("Telefone: " + tel) : "",
        email ? ("E-mail: " + email) : "",
        plano ? ("Plano: " + plano) : ""
      ].filter(Boolean).join("\n");
    }

    async function copiarParaClipboard(texto) {
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          await navigator.clipboard.writeText(texto);
          return true;
        }
      } catch (_) {}

      try {
        const ta = document.createElement("textarea");
        ta.value = texto;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return !!ok;
      } catch (_) {
        return false;
      }
    }

    // ========================================
    // Export
    // ========================================
    return {
      setLoading,
      salvarPaciente,
      carregarPacientes,
      alterarStatusPaciente,
      selecionarPaciente,
      atualizarSelecao,
      entrarModoEdicao,
      sairModoEdicao,
      abrirNovoPaciente,
      irParaProntuario,
      carregarConfigColunas,
      aplicarColunasVisiveis,
      salvarPreferenciasPaginacao,
      carregarPreferenciasPaginacao,
      exportarCsv,
      copiarDadosPaciente,
      preencherFormulario,
      limparFormulario
    };
  }

  PRONTIO.features.pacientes.actions = { createPacientesActions };

})(window);

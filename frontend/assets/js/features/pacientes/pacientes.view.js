// frontend/assets/js/features/pacientes/pacientes.view.js
/**
 * PRONTIO — Pacientes View (Front)
 * ------------------------------------------------------------
 * Responsabilidades:
 * - Manipulação de DOM
 * - Renderização de tabela
 * - Gerenciamento de modais
 * - Mensagens e feedback visual
 */

(function (global) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.features = PRONTIO.features || {};
  PRONTIO.features.pacientes = PRONTIO.features.pacientes || {};

  function createPacientesView(ctx) {
    const { state, document: doc } = ctx || {};
    const document = doc || global.document;

    // ========================================
    // Mensagens
    // ========================================
    function createLocalPageMessages(selector) {
      const el = document.querySelector(selector);
      if (!el) {
        return {
          info: function () {},
          sucesso: function () {},
          erro: function () {},
          clear: function () {}
        };
      }

      function clear() {
        el.textContent = "";
        el.style.display = "none";
        el.classList.remove("msg-info", "msg-sucesso", "msg-erro");
      }

      function show(texto, tipo) {
        if (!texto) {
          clear();
          return;
        }
        el.textContent = texto;
        el.style.display = "block";
        el.classList.remove("msg-info", "msg-sucesso", "msg-erro");
        if (tipo === "erro") el.classList.add("msg-erro");
        else if (tipo === "sucesso") el.classList.add("msg-sucesso");
        else el.classList.add("msg-info");
      }

      return {
        info: function (t) { show(t, "info"); },
        sucesso: function (t) { show(t, "sucesso"); },
        erro: function (t) { show(t, "erro"); },
        clear: clear
      };
    }

    const msgs = createLocalPageMessages("#mensagem");

    function mostrarMensagem(texto, tipo) {
      if (!texto) {
        msgs.clear();
        return;
      }
      if (tipo === "erro") msgs.erro(texto);
      else if (tipo === "sucesso") msgs.sucesso(texto);
      else msgs.info(texto);
    }

    // ========================================
    // Utilitários
    // ========================================
    function escapeHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function formatarDataParaBR(valor) {
      if (!valor) return "";
      if (typeof valor === "string") {
        const s = valor.trim();
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
        const soData = s.substring(0, 10);
        const partes = soData.split("-");
        if (partes.length === 3) {
          const ano = partes[0];
          const mes = partes[1];
          const dia = partes[2];
          return dia.padStart(2, "0") + "/" + mes.padStart(2, "0") + "/" + ano;
        }
        return s;
      }
      const d = new Date(valor);
      if (isNaN(d.getTime())) return "";
      const ano = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, "0");
      const dia = String(d.getDate()).padStart(2, "0");
      return dia + "/" + mes + "/" + ano;
    }

    // ========================================
    // Seção de Cadastro
    // ========================================
    function mostrarSecaoCadastro(visivel) {
      const sec = document.getElementById("secCadastroPaciente");
      if (!sec) return;
      if (visivel) sec.classList.remove("oculto");
      else sec.classList.add("oculto");
    }

    function scrollToForm() {
      const sec = document.getElementById("secCadastroPaciente");
      if (sec) {
        sec.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    // ========================================
    // UI de Edição
    // ========================================
    function atualizarUIEdicao(modoEdicao) {
      const btnSalvar = document.getElementById("btnSalvarPaciente");
      const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");

      if (!btnSalvar || !btnCancelarEdicao) return;

      if (modoEdicao) {
        btnSalvar.textContent = "Atualizar paciente";
        btnCancelarEdicao.classList.remove("oculto");
        mostrarSecaoCadastro(true);
      } else {
        btnSalvar.textContent = "Salvar paciente";
        btnCancelarEdicao.classList.add("oculto");
      }
    }

    // ========================================
    // Seleção de Paciente
    // ========================================
    function atualizarUISelecao(id, nomeCompleto, ativo) {
      const infoDiv = document.getElementById("pacienteSelecionadoInfo");
      const btnIrProntuario = document.getElementById("btnIrProntuario");
      const btnInativar = document.getElementById("btnInativar");
      const btnReativar = document.getElementById("btnReativar");
      const btnEditar = document.getElementById("btnEditar");
      const btnCopiar = document.getElementById("btnCopiarDadosPaciente");

      if (!id) {
        if (infoDiv) infoDiv.textContent = "Nenhum paciente selecionado.";
        if (btnIrProntuario) btnIrProntuario.disabled = true;
        if (btnInativar) btnInativar.disabled = true;
        if (btnReativar) btnReativar.disabled = true;
        if (btnEditar) btnEditar.disabled = true;
        if (btnCopiar) btnCopiar.disabled = true;
        return;
      }

      if (infoDiv) infoDiv.textContent = "Paciente selecionado: " + nomeCompleto + " (ID: " + id + ")";
      if (btnIrProntuario) btnIrProntuario.disabled = false;
      if (btnEditar) btnEditar.disabled = false;
      if (btnCopiar) btnCopiar.disabled = false;

      if (btnInativar && btnReativar) {
        if (ativo) {
          btnInativar.disabled = false;
          btnReativar.disabled = true;
        } else {
          btnInativar.disabled = true;
          btnReativar.disabled = false;
        }
      }
    }

    // ========================================
    // Paginação
    // ========================================
    function atualizarUIPaginacao(usarPaginacao, pageAtual, paging) {
      const btnPrev = document.getElementById("btnPaginaAnterior");
      const btnNext = document.getElementById("btnPaginaProxima");
      const info = document.getElementById("paginacaoInfo");
      const controles = document.getElementById("paginacaoControles");

      if (!usarPaginacao) {
        if (controles) controles.style.display = "none";
        return;
      }

      if (controles) controles.style.display = "flex";

      const total = paging && typeof paging.total === "number" ? paging.total : null;
      const totalPages = paging && typeof paging.totalPages === "number" ? paging.totalPages : null;

      if (info) {
        if (total != null && totalPages != null) {
          info.textContent = "Página " + pageAtual + " de " + totalPages + " — " + total + " registro(s)";
        } else {
          info.textContent = "Página " + pageAtual;
        }
      }

      if (btnPrev) btnPrev.disabled = !(paging && paging.hasPrev);
      if (btnNext) btnNext.disabled = !(paging && paging.hasNext);
    }

    // ========================================
    // Tabela (Otimizada)
    // ========================================

    // Cache de colunas visíveis para evitar queries repetidas
    let colunasVisiveisCache = null;
    let pacientesIndexado = {};
    let tabelaCallbacks = null;

    // Definição de todas as colunas (ordem fixa)
    const TODAS_COLUNAS = [
      "nome", "dataCadastro", "dataNascimento", "sexo", "cpf", "rg",
      "telefone1", "telefone2", "email", "enderecoBairro", "enderecoCidade",
      "enderecoUf", "obsImportantes", "planoSaude", "numeroCarteirinha",
      "ativo", "nomeSocial", "estadoCivil", "rgOrgaoEmissor", "cep",
      "logradouro", "numero", "complemento", "observacoesClinicas",
      "observacoesAdministrativas"
    ];

    function getColunasVisiveis() {
      if (colunasVisiveisCache) return colunasVisiveisCache;

      const cfg = {};
      const checkboxes = document.querySelectorAll(".chk-coluna");
      checkboxes.forEach(function (cb) {
        cfg[cb.dataset.col] = cb.checked;
      });
      // Nome sempre visível
      cfg.nome = true;
      colunasVisiveisCache = cfg;
      return cfg;
    }

    function invalidarCacheColunasVisiveis() {
      colunasVisiveisCache = null;
    }

    function getValorColuna(p, col, ativoBool) {
      switch (col) {
        case "nome": return p.nomeCompleto || p.nome || "";
        case "dataCadastro": return formatarDataParaBR(p.dataCadastro || p.criadoEm || p.CriadoEm || "");
        case "dataNascimento": return formatarDataParaBR(p.dataNascimento || "");
        case "sexo": return p.sexo || "";
        case "cpf": return p.cpf || "";
        case "rg": return p.rg || "";
        case "telefone1": return p.telefone1 || p.telefone || "";
        case "telefone2": return p.telefone2 || "";
        case "email": return p.email || "";
        case "enderecoBairro": return p.enderecoBairro || p.bairro || "";
        case "enderecoCidade": return p.enderecoCidade || p.cidade || "";
        case "enderecoUf": return p.enderecoUf || "";
        case "obsImportantes": return p.obsImportantes || "";
        case "planoSaude": return p.planoSaude || "";
        case "numeroCarteirinha": return p.numeroCarteirinha || "";
        case "ativo": return ativoBool ? "SIM" : "NAO";
        case "nomeSocial": return p.nomeSocial || "";
        case "estadoCivil": return p.estadoCivil || "";
        case "rgOrgaoEmissor": return p.rgOrgaoEmissor || "";
        case "cep": return p.cep || "";
        case "logradouro": return p.logradouro || "";
        case "numero": return p.numero || "";
        case "complemento": return p.complemento || "";
        case "observacoesClinicas": return p.observacoesClinicas || "";
        case "observacoesAdministrativas": return p.observacoesAdministrativas || "";
        default: return "";
      }
    }

    function renderizarTabela(pacientes, callbacks) {
      const tbody = document.getElementById("tabelaPacientesBody");
      if (!tbody) return;

      // Guarda callbacks para event delegation
      tabelaCallbacks = callbacks;

      // Indexa pacientes por ID para lookup rápido
      pacientesIndexado = {};
      pacientes.forEach(function (p) {
        const id = String(p.idPaciente || p.ID_Paciente || p.id || "");
        pacientesIndexado[id] = p;
      });

      // Pega apenas colunas visíveis
      const colVisiveis = getColunasVisiveis();
      const colunasParaRenderizar = TODAS_COLUNAS.filter(function (col) {
        return colVisiveis[col] !== false;
      });

      // Usa DocumentFragment para batch insert
      const fragment = document.createDocumentFragment();

      pacientes.forEach(function (p) {
        const id = String(p.idPaciente || p.ID_Paciente || p.id || "");
        const nome = String(p.nomeCompleto || p.nome || "");
        const ativoBool =
          typeof p.ativo === "boolean"
            ? p.ativo
            : String(p.ativo || "").toLowerCase() === "true" || String(p.ativo || "").toUpperCase() === "SIM";

        const tr = document.createElement("tr");
        tr.dataset.idPaciente = id;
        tr.dataset.nomeCompleto = nome;
        tr.dataset.ativo = ativoBool ? "SIM" : "NAO";
        tr.title = "Duplo clique para ver detalhes";

        if (!ativoBool) tr.classList.add("linha-inativa");
        if (state && state.pacienteSelecionadoId && id === state.pacienteSelecionadoId) {
          tr.classList.add("linha-selecionada");
        }

        // Renderiza apenas colunas visíveis
        colunasParaRenderizar.forEach(function (col) {
          const td = document.createElement("td");
          td.textContent = getValorColuna(p, col, ativoBool);
          td.dataset.col = col;
          tr.appendChild(td);
        });

        fragment.appendChild(tr);
      });

      // Limpa e insere tudo de uma vez
      tbody.innerHTML = "";
      tbody.appendChild(fragment);
    }

    // Event delegation - configurar uma vez
    function setupTabelaEventDelegation() {
      const tbody = document.getElementById("tabelaPacientesBody");
      if (!tbody || tbody.dataset.delegationSetup === "1") return;

      tbody.dataset.delegationSetup = "1";

      tbody.addEventListener("click", function (e) {
        const tr = e.target.closest("tr");
        if (!tr || !tabelaCallbacks || !tabelaCallbacks.onSelect) return;

        const id = tr.dataset.idPaciente;
        const nome = tr.dataset.nomeCompleto;
        const ativo = tr.dataset.ativo === "SIM";
        tabelaCallbacks.onSelect(tr, id, nome, ativo);
      });

      tbody.addEventListener("dblclick", function (e) {
        const tr = e.target.closest("tr");
        if (!tr || !tabelaCallbacks || !tabelaCallbacks.onDoubleClick) return;

        const id = tr.dataset.idPaciente;
        const paciente = pacientesIndexado[id];
        if (paciente) {
          tabelaCallbacks.onDoubleClick(paciente);
        }
      });
    }

    function marcarLinhaSelecionada(id) {
      const tbody = document.getElementById("tabelaPacientesBody");
      if (!tbody) return;

      // Remove seleção anterior (apenas da linha que tem a classe)
      const linhaSelecionada = tbody.querySelector("tr.linha-selecionada");
      if (linhaSelecionada) {
        linhaSelecionada.classList.remove("linha-selecionada");
      }

      // Adiciona à nova linha
      if (id) {
        const novaLinha = tbody.querySelector('tr[data-id-paciente="' + id + '"]');
        if (novaLinha) {
          novaLinha.classList.add("linha-selecionada");
        }
      }
    }

    // ========================================
    // Colunas (Otimizada)
    // ========================================
    function aplicarVisibilidadeColunas(cfg) {
      // Invalida cache para próximo render usar novas configurações
      invalidarCacheColunasVisiveis();

      // Aplica apenas no header (tbody será re-renderizado)
      const thead = document.querySelector("#tabelaPacientes thead");
      if (!thead) return;

      const headerCells = thead.querySelectorAll("th[data-col]");
      headerCells.forEach(function (th) {
        const col = th.dataset.col;
        const visivel = cfg && Object.prototype.hasOwnProperty.call(cfg, col) ? cfg[col] : true;
        if (visivel) th.classList.remove("oculto-col");
        else th.classList.add("oculto-col");
      });
    }

    // ========================================
    // Modal de Confirmação
    // ========================================
    function abrirModalConfirmacao(texto, onConfirm) {
      const modal = document.getElementById("modalConfirmacao");
      const textoEl = document.getElementById("modalConfirmacaoTexto");
      if (!modal) return;

      if (textoEl) textoEl.textContent = texto;
      if (state) state.confirmacaoCallback = onConfirm;

      modal.classList.remove("hidden");
      modal.classList.add("visible");
    }

    function fecharModalConfirmacao() {
      const modal = document.getElementById("modalConfirmacao");
      if (!modal) return;

      modal.classList.add("hidden");
      modal.classList.remove("visible");
      if (state) state.confirmacaoCallback = null;
    }

    // ========================================
    // Modal de Visualização
    // ========================================
    function abrirModalVisualizacao(paciente) {
      const modal = document.getElementById("modalVisualizacao");
      const conteudo = document.getElementById("modalVisualizacaoConteudo");
      const titulo = document.getElementById("modalVisualizacaoTitulo");
      if (!modal || !conteudo) return;

      if (state) {
        state.pacienteVisualizandoId = String(paciente.idPaciente || paciente.ID_Paciente || paciente.id || "");
      }

      if (titulo) {
        titulo.textContent = paciente.nomeCompleto || paciente.nome || "Detalhes do Paciente";
      }

      const ativoBool = typeof paciente.ativo === "boolean"
        ? paciente.ativo
        : String(paciente.ativo || "").toLowerCase() === "true" || String(paciente.ativo || "").toUpperCase() === "SIM";

      const statusClass = ativoBool ? "paciente-detalhes__status--ativo" : "paciente-detalhes__status--inativo";
      const statusText = ativoBool ? "Ativo" : "Inativo";

      const val = function (v) {
        if (!v) return '<span class="paciente-detalhes__value paciente-detalhes__value--empty">—</span>';
        return '<span class="paciente-detalhes__value">' + escapeHtml(v) + '</span>';
      };

      conteudo.innerHTML = `
        <div class="paciente-detalhes__section paciente-detalhes__section--full">
          <h4 class="paciente-detalhes__section-title">Dados Pessoais</h4>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">Nome:</span>
            ${val(paciente.nomeCompleto || paciente.nome)}
          </div>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">Nome Social:</span>
            ${val(paciente.nomeSocial)}
          </div>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">Nascimento:</span>
            ${val(formatarDataParaBR(paciente.dataNascimento))}
          </div>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">Sexo:</span>
            ${val(paciente.sexo)}
          </div>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">Estado Civil:</span>
            ${val(paciente.estadoCivil)}
          </div>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">CPF:</span>
            ${val(paciente.cpf)}
          </div>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">RG:</span>
            ${val(paciente.rg)} ${paciente.rgOrgaoEmissor ? '(' + escapeHtml(paciente.rgOrgaoEmissor) + ')' : ''}
          </div>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">Status:</span>
            <span class="paciente-detalhes__status ${statusClass}">${statusText}</span>
          </div>
        </div>

        <div class="paciente-detalhes__section">
          <h4 class="paciente-detalhes__section-title">Contato</h4>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">Telefone 1:</span>
            ${val(paciente.telefone1 || paciente.telefone)}
          </div>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">Telefone 2:</span>
            ${val(paciente.telefone2)}
          </div>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">E-mail:</span>
            ${val(paciente.email)}
          </div>
        </div>

        <div class="paciente-detalhes__section">
          <h4 class="paciente-detalhes__section-title">Plano de Saúde</h4>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">Plano:</span>
            ${val(paciente.planoSaude)}
          </div>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">Carteirinha:</span>
            ${val(paciente.numeroCarteirinha)}
          </div>
        </div>

        <div class="paciente-detalhes__section paciente-detalhes__section--full">
          <h4 class="paciente-detalhes__section-title">Endereço</h4>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">CEP:</span>
            ${val(paciente.cep)}
          </div>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">Logradouro:</span>
            ${val(paciente.logradouro)}
          </div>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">Número:</span>
            ${val(paciente.numero)}
          </div>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">Complemento:</span>
            ${val(paciente.complemento)}
          </div>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">Bairro:</span>
            ${val(paciente.enderecoBairro || paciente.bairro)}
          </div>
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">Cidade/UF:</span>
            ${val((paciente.enderecoCidade || paciente.cidade || "") + (paciente.enderecoUf ? " / " + paciente.enderecoUf : ""))}
          </div>
        </div>

        ${(paciente.observacoesClinicas || paciente.observacoesAdministrativas || paciente.obsImportantes) ? `
        <div class="paciente-detalhes__section paciente-detalhes__section--full">
          <h4 class="paciente-detalhes__section-title">Observações</h4>
          ${paciente.observacoesClinicas ? `
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">Clínicas:</span>
            ${val(paciente.observacoesClinicas)}
          </div>
          ` : ''}
          ${paciente.observacoesAdministrativas ? `
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">Administrativas:</span>
            ${val(paciente.observacoesAdministrativas)}
          </div>
          ` : ''}
          ${paciente.obsImportantes && !paciente.observacoesAdministrativas ? `
          <div class="paciente-detalhes__row">
            <span class="paciente-detalhes__label">Importantes:</span>
            ${val(paciente.obsImportantes)}
          </div>
          ` : ''}
        </div>
        ` : ''}
      `;

      modal.classList.remove("hidden");
      modal.classList.add("visible");
    }

    function fecharModalVisualizacao() {
      const modal = document.getElementById("modalVisualizacao");
      if (!modal) return;

      modal.classList.add("hidden");
      modal.classList.remove("visible");
      if (state) state.pacienteVisualizandoId = null;
    }

    function isModalVisualizacaoAberto() {
      const modal = document.getElementById("modalVisualizacao");
      return modal && modal.classList.contains("visible");
    }

    function isModalConfirmacaoAberto() {
      const modal = document.getElementById("modalConfirmacao");
      return modal && modal.classList.contains("visible");
    }

    // ========================================
    // Export
    // ========================================
    return {
      mostrarMensagem,
      mostrarSecaoCadastro,
      scrollToForm,
      atualizarUIEdicao,
      atualizarUISelecao,
      atualizarUIPaginacao,
      renderizarTabela,
      marcarLinhaSelecionada,
      aplicarVisibilidadeColunas,
      abrirModalConfirmacao,
      fecharModalConfirmacao,
      abrirModalVisualizacao,
      fecharModalVisualizacao,
      isModalVisualizacaoAberto,
      isModalConfirmacaoAberto,
      formatarDataParaBR,
      escapeHtml,
      setupTabelaEventDelegation,
      invalidarCacheColunasVisiveis
    };
  }

  PRONTIO.features.pacientes.view = { createPacientesView };

})(window);

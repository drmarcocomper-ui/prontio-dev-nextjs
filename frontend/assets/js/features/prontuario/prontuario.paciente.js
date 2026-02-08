(function (global, document) {
  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.features = PRONTIO.features || {};
  PRONTIO.features.prontuario = PRONTIO.features.prontuario || {};

  const { qs } = PRONTIO.features.prontuario.utils;

  // ✅ Cache de pacientes (evita requisições repetidas)
  const pacienteCache = new Map();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  // ✅ Usa Supabase service quando disponível
  function getPacientesService() {
    return PRONTIO.services && PRONTIO.services.pacientes ? PRONTIO.services.pacientes : null;
  }

  function getCachedPaciente(idPaciente) {
    const cached = pacienteCache.get(idPaciente);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  function setCachedPaciente(idPaciente, data) {
    pacienteCache.set(idPaciente, { data, timestamp: Date.now() });
  }

  function setTextOrDash_(selector, value) {
    const el = qs(selector);
    if (!el) return;
    const s = value === null || value === undefined ? "" : String(value).trim();
    el.textContent = s ? s : "—";
  }

  async function carregarResumoPaciente_(ctx) {
    setTextOrDash_("#prontuario-paciente-nome", ctx.nomeCompleto || "—");

    if (!ctx.idPaciente) {
      setTextOrDash_("#prontuario-paciente-idade", "—");
      setTextOrDash_("#prontuario-paciente-profissao", "—");
      setTextOrDash_("#prontuario-paciente-plano", "—");
      setTextOrDash_("#prontuario-paciente-carteirinha", "—");
      return;
    }

    try {
      let pac = null;

      // ✅ Tenta cache primeiro
      pac = getCachedPaciente(ctx.idPaciente);

      if (!pac) {
        console.time("[Prontuario] Carregar paciente");

        // ✅ Busca via Supabase
        const supaService = getPacientesService();
        if (supaService && typeof supaService.obterPorId === "function") {
          const result = await supaService.obterPorId(ctx.idPaciente);
          if (result.success && result.data) {
            pac = result.data.paciente || result.data;
            // ✅ Salva no cache
            setCachedPaciente(ctx.idPaciente, pac);
          }
        }

        console.timeEnd("[Prontuario] Carregar paciente");
      } else {
        console.log("[Prontuario] Paciente carregado do cache");
      }

      if (!pac) {
        throw new Error("Paciente não encontrado");
      }

      const nome =
        (pac && (pac.nomeCompleto || pac.nomeExibicao || pac.nomeSocial || pac.nome || pac.Nome)) ||
        ctx.nomeCompleto ||
        "—";

      // ✅ Calcula idade a partir da data de nascimento se não vier calculada
      let idade = pac && (pac.idade || pac.Idade);
      if (!idade && pac && pac.dataNascimento) {
        try {
          const nascimento = new Date(pac.dataNascimento);
          const hoje = new Date();
          let anos = hoje.getFullYear() - nascimento.getFullYear();
          const mesAtual = hoje.getMonth();
          const mesNasc = nascimento.getMonth();
          if (mesAtual < mesNasc || (mesAtual === mesNasc && hoje.getDate() < nascimento.getDate())) {
            anos--;
          }
          idade = anos + " anos";
        } catch (_) {}
      }

      const profissao = pac && (pac.profissao || pac.Profissao);
      const plano = pac && (pac.planoSaude || pac.convenio || pac.PlanoSaude || pac.Convenio || pac.plano);
      const carteirinha = pac && (pac.carteirinha || pac.numeroCarteirinha || pac.NumeroCarteirinha || pac.Carteirinha);

      // Telefone para WhatsApp (telefonePrincipal é o campo oficial do backend)
      const telefone = pac && (pac.telefonePrincipal || pac.telefone1 || pac.telefone || pac.Telefone1 || pac.Telefone || pac.celular || pac.Celular);
      ctx.telefone = telefone ? String(telefone).trim() : "";

      ctx.nomeCompleto = String(nome || "").trim() || ctx.nomeCompleto || "—";
      ctx.nome = ctx.nomeCompleto;

      setTextOrDash_("#prontuario-paciente-nome", ctx.nomeCompleto);
      setTextOrDash_("#prontuario-paciente-idade", idade);
      setTextOrDash_("#prontuario-paciente-profissao", profissao);
      setTextOrDash_("#prontuario-paciente-plano", plano);
      setTextOrDash_("#prontuario-paciente-carteirinha", carteirinha);

      // Sempre mostrar botão WhatsApp (mensagem de erro se não tiver telefone)
      const btnWa = qs("#btnWhatsAppPaciente");
      if (btnWa) {
        btnWa.style.display = "inline-flex";
      }
    } catch (e) {
      setTextOrDash_("#prontuario-paciente-idade", "—");
      setTextOrDash_("#prontuario-paciente-profissao", "—");
      setTextOrDash_("#prontuario-paciente-plano", "—");
      setTextOrDash_("#prontuario-paciente-carteirinha", "—");
    }
  }

  PRONTIO.features.prontuario.paciente = {
    carregarResumoPaciente_,
  };
})(window, document);

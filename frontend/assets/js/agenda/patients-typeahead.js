/* PRONTIO - Agenda Patients Typeahead (patients-typeahead.js)
 * Typeahead reutilizável para inputs de paciente (novo/editar)
 */
(function () {
  "use strict";

  const root = (window.PRONTIO = window.PRONTIO || {});
  root.Agenda = root.Agenda || {};

  function normalizePatientObj_(p) {
    if (!p) return null;
    return {
      ID_Paciente: String(p.ID_Paciente || p.idPaciente || p.id || p.ID || p.id_paciente || ""),
      nome: String(p.nome || p.nomeCompleto || p.nomeExibicao || ""),
      documento: String(p.documento || p.cpf || ""),
      telefone: String(p.telefone || p.telefonePrincipal || ""),
      data_nascimento: String(p.data_nascimento || p.dataNascimento || "")
    };
  }

  function attach(ctx, opts) {
    const inputEl = opts && opts.inputEl ? opts.inputEl : null;
    if (!inputEl) return;

    const api = ctx.api;
    const utils = ctx.utils;

    const getSelected = opts.getSelected || function () { return null; };
    const setSelected = opts.setSelected || function () {};
    const onSelected = opts.onSelected || function () {};
    const onManualTyping = opts.onManualTyping || function () {};

    let panel = document.createElement("div");
    panel.className = "typeahead-panel hidden";
    panel.setAttribute("role", "listbox");

    let items = [];
    let activeIndex = -1;
    let debounceTimer = null;
    let lastQuery = "";

    function ensureMounted_() {
      if (panel.parentNode) return;
      const parent = inputEl.parentElement;
      if (parent) parent.style.position = parent.style.position || "relative";
      (parent || inputEl.parentNode).appendChild(panel);
    }

    function hide_() {
      panel.classList.add("hidden");
      panel.innerHTML = "";
      items = [];
      activeIndex = -1;
    }

    function show_() {
      panel.classList.remove("hidden");
    }

    function render_() {
      if (!items.length) return hide_();
      panel.innerHTML = "";

      items.forEach((p, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "typeahead-item";
        btn.setAttribute("role", "option");
        btn.dataset.index = String(idx);
        if (idx === activeIndex) btn.classList.add("active");

        const line1 = document.createElement("div");
        line1.className = "typeahead-item-nome";
        line1.textContent = p.nome || "(sem nome)";

        const line2 = document.createElement("div");
        line2.className = "typeahead-item-detalhes";
        const parts = [];
        if (p.documento) parts.push(p.documento);
        if (p.telefone) parts.push(p.telefone);
        if (p.data_nascimento) parts.push("Nasc.: " + p.data_nascimento);
        line2.textContent = parts.join(" • ");

        btn.appendChild(line1);
        if (line2.textContent) btn.appendChild(line2);

        btn.addEventListener("mousedown", (e) => e.preventDefault());
        btn.addEventListener("click", () => {
          setSelected(p);
          utils.setPacienteIdOnInput(inputEl, p);
          inputEl.value = p.nome || "";
          hide_();
          onSelected(p);
        });

        panel.appendChild(btn);
      });

      show_();
    }

    async function fetch_(q) {
      const query = String(q || "").trim();
      if (query.length < 2) return hide_();

      lastQuery = query;
      try {
        const r = await api.buscarPacientesSimples(query, 12);
        if (String(inputEl.value || "").trim() !== lastQuery) return;

        const arr = (r && r.pacientes) ? r.pacientes : [];
        items = arr.map(normalizePatientObj_).filter(Boolean);
        activeIndex = items.length ? 0 : -1;
        render_();
      } catch (e) {
        console.warn("[PRONTIO][Agenda] Typeahead erro:", e);
        hide_();
      }
    }

    function clearIfTextMismatch_() {
      const sel = getSelected();
      if (!sel) return;

      const typed = String(inputEl.value || "").trim();
      const selNome = String(sel.nome || "").trim();

      if (!typed || typed !== selNome) {
        setSelected(null);
        utils.setPacienteIdOnInput(inputEl, null);
      }
    }

    inputEl.addEventListener("input", () => {
      clearIfTextMismatch_();
      onManualTyping();

      const q = String(inputEl.value || "").trim();
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetch_(q), 220);
    });

    inputEl.addEventListener("focus", () => {
      ensureMounted_();
      const q = String(inputEl.value || "").trim();
      if (q.length >= 2) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fetch_(q), 10);
      }
    });

    inputEl.addEventListener("blur", () => setTimeout(() => hide_(), 180));

    inputEl.addEventListener("keydown", (e) => {
      if (panel.classList.contains("hidden")) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!items.length) return;
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
        render_();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!items.length) return;
        activeIndex = Math.max(activeIndex - 1, 0);
        render_();
      } else if (e.key === "Enter") {
        if (activeIndex >= 0 && items[activeIndex]) {
          e.preventDefault();
          const p = items[activeIndex];
          setSelected(p);
          utils.setPacienteIdOnInput(inputEl, p);
          inputEl.value = p.nome || "";
          hide_();
          onSelected(p);
        }
      } else if (e.key === "Escape") {
        hide_();
      }
    });

    ensureMounted_();
  }

  root.Agenda.patientsTypeahead = { attach };
})();

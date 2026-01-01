/* PRONTIO - Agenda Prefs (pref.js)
 * - modoVisao/filtros persistidos
 * - usa PRONTIO.core.storage quando disponível
 * - mantém chaves legadas
 */
(function () {
  "use strict";

  const root = (window.PRONTIO = window.PRONTIO || {});
  root.Agenda = root.Agenda || {};

  const CORE_PREFS_KEY = "prontio.ui.agenda.prefs.v1";
  const LEGACY_MODO_KEY = "prontio.agenda.modoVisao";
  const LEGACY_FILTER_KEY = "prontio.agenda.filtros.v1";
  const CORE_FILTER_KEY = "prontio.ui.agenda.filtros.v1";

  const pref = {
    _ctx: null
  };

  function coreStorage_() {
    return root.core && root.core.storage ? root.core.storage : null;
  }

  function storageGetJSON_(key, fallback) {
    const cs = coreStorage_();
    try {
      if (cs && typeof cs.getJSON === "function") return cs.getJSON(key, fallback);
    } catch (_) {}
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function storageSetJSON_(key, obj) {
    const cs = coreStorage_();
    try {
      if (cs && typeof cs.setJSON === "function") return cs.setJSON(key, obj);
    } catch (_) {}
    try { localStorage.setItem(key, JSON.stringify(obj)); } catch (_) {}
  }

  function storageGetString_(key, fallback) {
    const cs = coreStorage_();
    try {
      if (cs && typeof cs.getItem === "function") {
        const v = cs.getItem(key);
        return v == null ? fallback : String(v);
      }
    } catch (_) {}
    try {
      const v = localStorage.getItem(key);
      return v == null ? fallback : String(v);
    } catch (_) {
      return fallback;
    }
  }

  function storageSetString_(key, value) {
    const cs = coreStorage_();
    try {
      if (cs && typeof cs.setItem === "function") return cs.setItem(key, String(value));
    } catch (_) {}
    try { localStorage.setItem(key, String(value)); } catch (_) {}
  }

  function normalize(p) {
    const out = Object.assign({ modoVisao: "dia", filtros: { nome: "", status: "" } }, p || {});
    if (out.modoVisao !== "dia" && out.modoVisao !== "semana") out.modoVisao = "dia";
    out.filtros = Object.assign({ nome: "", status: "" }, out.filtros || {});
    out.filtros.nome = String(out.filtros.nome || "");
    out.filtros.status = String(out.filtros.status || "");
    return out;
  }

  function load() {
    const prefs = storageGetJSON_(CORE_PREFS_KEY, null) || {};
    const legacyModo = storageGetString_(LEGACY_MODO_KEY, null);
    const legacyFiltros = storageGetJSON_(LEGACY_FILTER_KEY, null);

    const merged = {
      modoVisao: prefs.modoVisao || (legacyModo ? String(legacyModo) : "dia"),
      filtros: Object.assign({ nome: "", status: "" }, prefs.filtros || {})
    };

    if ((!prefs.filtros || !Object.keys(prefs.filtros || {}).length) && legacyFiltros) {
      merged.filtros.nome = String(legacyFiltros.nome || "");
      merged.filtros.status = String(legacyFiltros.status || "");
    }

    return normalize(merged);
  }

  function save(patch) {
    const current = load();
    const merged = Object.assign({}, current, patch || {});
    if (patch && patch.filtros) merged.filtros = Object.assign({}, current.filtros || {}, patch.filtros);

    const out = normalize(merged);

    storageSetJSON_(CORE_PREFS_KEY, out);
    storageSetString_(LEGACY_MODO_KEY, out.modoVisao);
    storageSetJSON_(LEGACY_FILTER_KEY, out.filtros);
    storageSetJSON_(CORE_FILTER_KEY, out.filtros);

    return out;
  }

  function setFiltros(filtrosPatch) {
    const prefs = load();
    const filtros = Object.assign({}, prefs.filtros || {}, filtrosPatch || {});
    save({ filtros });
  }

  function applyToUI(ctx) {
    const prefs = load();
    const input = ctx && ctx.dom ? ctx.dom.inputFiltroNome : null;
    const select = ctx && ctx.dom ? ctx.dom.selectFiltroStatus : null;
    if (input) input.value = prefs.filtros.nome || "";
    if (select) select.value = prefs.filtros.status || "";
  }

  function init(ctx) {
    pref._ctx = ctx || null;
  }

  root.Agenda.pref = { init, load, save, setFiltros, applyToUI };
})();

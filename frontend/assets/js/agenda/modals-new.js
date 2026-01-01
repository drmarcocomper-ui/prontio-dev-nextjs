/* PRONTIO - Agenda Modal helpers (modals-new.js)
 * open/close + mensagens de formulário + disable seguro
 */
(function () {
  "use strict";

  const root = (window.PRONTIO = window.PRONTIO || {});
  root.Agenda = root.Agenda || {};

  let ultimoFocusAntesModal = null;

  function init() {}

  function isVisible(modalEl) {
    return !!modalEl && !modalEl.classList.contains("hidden");
  }

  function open(modalEl, focusEl) {
    if (!modalEl) return;
    ultimoFocusAntesModal = document.activeElement;

    modalEl.classList.remove("hidden");
    modalEl.classList.add("visible");
    modalEl.setAttribute("aria-hidden", "false");

    setTimeout(() => {
      if (focusEl && typeof focusEl.focus === "function") focusEl.focus();
    }, 0);
  }

  function close(modalEl) {
    if (!modalEl) return;

    modalEl.classList.remove("visible");
    modalEl.classList.add("hidden");
    modalEl.setAttribute("aria-hidden", "true");

    setTimeout(() => {
      if (ultimoFocusAntesModal && typeof ultimoFocusAntesModal.focus === "function") {
        ultimoFocusAntesModal.focus();
      }
      ultimoFocusAntesModal = null;
    }, 0);
  }

  function safeDisable(el, disabled) {
    if (!el) return;
    el.disabled = !!disabled;
    el.setAttribute("aria-disabled", disabled ? "true" : "false");
  }

  function setFormMsg(el, text, kind) {
    if (!el) return;
    el.textContent = text || "";
    el.className = "form-message" + (kind ? " " + kind : "");
  }

  root.Agenda.modalsNew = { init, isVisible, open, close, safeDisable, setFormMsg };
})();

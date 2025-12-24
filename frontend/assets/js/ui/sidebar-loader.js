// frontend/assets/js/ui/sidebar-loader.js
// ✅ Correções:
// - Evita DUPLO carregamento (main chama load; loader não deve auto-chamar se main já bootstrapou)
// - load() é idempotente (reusa a mesma Promise)
// - Cache com versionamento + fallback

(function (global, document) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.ui = PRONTIO.ui || {};
  PRONTIO.ui.sidebarLoader = PRONTIO.ui.sidebarLoader || {};

  const PARTIAL_VERSION = "1.0.4";

  function loadSidebarPartial() {
    // ✅ idempotente: se já está carregando, reaproveita
    if (PRONTIO.ui.sidebarLoader._loadingPromise) {
      return PRONTIO.ui.sidebarLoader._loadingPromise;
    }

    PRONTIO.ui.sidebarLoader._loadingPromise = new Promise(function (resolve) {
      const placeholder = document.querySelector("[data-include-sidebar]");
      if (!placeholder) {
        resolve(false);
        return;
      }

      const url = "partials/sidebar.html?v=" + encodeURIComponent(PARTIAL_VERSION);

      function doFetch(cacheMode) {
        return fetch(url, { cache: cacheMode })
          .then(function (response) {
            if (!response.ok) {
              throw new Error("[PRONTIO.sidebar-loader] HTTP " + response.status);
            }
            return response.text();
          });
      }

      doFetch("default")
        .catch(function () {
          return doFetch("no-store");
        })
        .then(function (html) {
          const temp = document.createElement("div");
          temp.innerHTML = html;

          const parent = placeholder.parentNode;
          if (!parent) {
            resolve(false);
            return;
          }

          while (temp.firstChild) {
            parent.insertBefore(temp.firstChild, placeholder);
          }
          parent.removeChild(placeholder);

          try {
            if (PRONTIO.widgets && PRONTIO.widgets.sidebar && typeof PRONTIO.widgets.sidebar.init === "function") {
              PRONTIO.widgets.sidebar.init();
            } else if (typeof global.initSidebar === "function") {
              global.initSidebar();
            }
          } catch (e) {
            console.warn("[PRONTIO.sidebar-loader] Erro ao inicializar sidebar:", e);
          }

          // Rebind modais para elementos recém-injetados
          try {
            if (PRONTIO.ui && PRONTIO.ui.modals && typeof PRONTIO.ui.modals.bindTriggers === "function") {
              PRONTIO.ui.modals.bindTriggers(document);
            }
          } catch (e) {
            console.warn("[PRONTIO.sidebar-loader] Erro ao rebind modais:", e);
          }

          resolve(true);
        })
        .catch(function (err) {
          console.error("[PRONTIO.sidebar-loader] Falha ao carregar partial da sidebar:", err);
          resolve(false);
        })
        .finally(function () {
          // libera para chamadas futuras (mas já terá sidebar no DOM)
          PRONTIO.ui.sidebarLoader._loadingPromise = null;
        });
    });

    return PRONTIO.ui.sidebarLoader._loadingPromise;
  }

  PRONTIO.ui.sidebarLoader.load = loadSidebarPartial;

  // ✅ Auto-init só se main NÃO estiver rodando (compat)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      if (!PRONTIO._mainBootstrapped) loadSidebarPartial();
    });
  } else {
    if (!PRONTIO._mainBootstrapped) loadSidebarPartial();
  }
})(window, document);

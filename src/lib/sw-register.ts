export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (
          newWorker.state === "activated" &&
          navigator.serviceWorker.controller
        ) {
          // New version available — will take effect on next navigation
        }
      });
    });
  } catch (error) {
    console.error("SW registration failed:", error);
  }
}

/// <reference lib="webworker" />

const CACHE_NAME = "prontio-v1";
const OFFLINE_URL = "/offline";

// Assets to pre-cache on install
const PRE_CACHE = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install: pre-cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRE_CACHE))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: route requests by type
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (forms, mutations)
  if (request.method !== "GET") return;

  // Skip Supabase API calls (handled by IndexedDB in the app)
  if (url.hostname.endsWith("supabase.co")) return;

  // Skip chrome-extension and other non-http(s) schemes
  if (!url.protocol.startsWith("http")) return;

  // Static assets (_next/static/, icons/): Cache-First
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation requests (HTML pages): Network-First with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Other requests: Network-First with cache fallback
  event.respondWith(networkFirst(request));
});

// --- Strategies ---

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 503, statusText: "Offline" });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("", { status: 503, statusText: "Offline" });
  }
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Try to serve cached version of the page
    const cached = await caches.match(request);
    if (cached) return cached;

    // Final fallback: offline page
    const offlinePage = await caches.match(OFFLINE_URL);
    return offlinePage || new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/html" },
    });
  }
}

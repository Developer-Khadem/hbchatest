const SESSION_CACHE = "hbc-session-assets-v1";
const SESSION_CACHE_PREFIX = "hbc-session-assets-";
const MAX_CACHED_ASSETS = 80;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith(SESSION_CACHE_PREFIX) && name !== SESSION_CACHE)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "END_BROWSING_SESSION") return;

  const closingClientId = event.source?.id;
  event.waitUntil(
    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const openWindows = await self.clients.matchAll({
        includeUncontrolled: true,
        type: "window",
      });
      const otherOpenWindows = openWindows.filter((client) => client.id !== closingClientId);
      if (otherOpenWindows.length === 0) {
        await caches.delete(SESSION_CACHE);
      }
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isImage = request.destination === "image";
  const isFont = request.destination === "font";
  const isImmutableAppAsset =
    url.origin === self.location.origin && url.pathname.startsWith("/_next/static/");
  if (!isImage && !isFont && !isImmutableAppAsset) return;

  const handleFetch = async () => {
    try {
      const cache = await caches.open(SESSION_CACHE);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) return cachedResponse;
    } catch (error) {
      console.warn("Unable to read the session asset cache", error);
    }

    const response = await fetch(request);
    if (response.ok || response.type === "opaque") {
      try {
        const cache = await caches.open(SESSION_CACHE);
        await cache.put(request, response.clone());
        const requests = await cache.keys();
        if (requests.length > MAX_CACHED_ASSETS) {
          await cache.delete(requests[0]);
        }
      } catch (error) {
        console.warn("Unable to store an asset in the session cache", error);
      }
    }
    return response;
  };

  event.respondWith(handleFetch());
});

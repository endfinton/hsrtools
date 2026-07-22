const CACHE_TTL = 60 * 60 * 24 * 30;
const ALLOWED_PREFIXES = ["/icons/"];

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(request.url);

  if (url.pathname === "/__health") {
    return Response.json({ ok: true, service: "hsr-tools-cdn", origin: ICON_ORIGIN }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (!ALLOWED_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    return new Response("Not found", { status: 404 });
  }

  const origin = new URL(ICON_ORIGIN);
  const upstreamUrl = new URL(url.pathname, origin);
  upstreamUrl.search = url.search;

  const upstreamResponse = await fetch(
    new Request(upstreamUrl.toString(), {
      method: request.method,
      headers: {
        Accept: request.headers.get("Accept") || "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "User-Agent": "hsr-tools-cdn/1.0",
      },
    }),
    {
      cf: {
        cacheEverything: true,
        cacheTtl: CACHE_TTL,
        cacheTtlByStatus: {
          "200-299": CACHE_TTL,
          "404": 60,
          "500-599": 0,
        },
      },
    },
  );

  if (!upstreamResponse.ok) {
    return new Response("Asset not found", {
      status: upstreamResponse.status,
      headers: {
        "Cache-Control": "public, max-age=60",
        "X-Origin-Status": String(upstreamResponse.status),
      },
    });
  }

  const response = new Response(upstreamResponse.body, upstreamResponse);
  response.headers.set("Cache-Control", "public, max-age=2592000, s-maxage=2592000, immutable");
  response.headers.set("CDN-Cache-Control", "public, max-age=2592000, immutable");
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("X-HSR-CDN", "cloudflare-worker");
  response.headers.delete("Set-Cookie");

  return response;
}

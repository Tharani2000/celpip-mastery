"use client";
/**
 * Tracks in-flight API calls app-wide. window.fetch is wrapped once, at module load,
 * so even requests fired from a child's first useEffect are counted.
 * Page navigations (RSC requests) are tracked as well.
 * Send SILENT_HEADER (or pass `silent: true` to `api()`) to skip the loader, e.g. for autosave.
 */
export const SILENT_HEADER = "x-mm-silent";

let pending = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const loaderStore = {
  subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
  get: () => pending,
  getServer: () => 0,
  start() { pending++; emit(); },
  stop() { pending = Math.max(0, pending - 1); emit(); },
};

/** Background calls that should never flash the loader. */
const ignored = (path: string, method: string) =>
  (path === "/api/auth/session" && method === "GET") || path === "/api/auth/_log" || path.startsWith("/api/audio/");

declare global { interface Window { __mmFetchPatched?: boolean } }

if (typeof window !== "undefined" && !window.__mmFetchPatched) {
  window.__mmFetchPatched = true;
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let silent = false;
    const hdrs = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (hdrs.has(SILENT_HEADER)) {
      silent = true;
      if (init?.headers) { hdrs.delete(SILENT_HEADER); init = { ...init, headers: hdrs }; }
    }
    // Next's App Router fetches the next page as an RSC payload (links, router.push/replace/refresh).
    // Count those too, but not background prefetches.
    const isPageNav = hdrs.get("rsc") === "1" && !hdrs.has("next-router-prefetch");
    let track = false;
    try {
      const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const url = new URL(raw, window.location.href);
      const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
      track = !silent && url.origin === window.location.origin && (isPageNav || (url.pathname.startsWith("/api/") && !ignored(url.pathname, method)));
    } catch { /* unparsable URL: just pass through */ }
    if (!track) return original(input, init);
    loaderStore.start();
    try { return await original(input, init); } finally { loaderStore.stop(); }
  };
}

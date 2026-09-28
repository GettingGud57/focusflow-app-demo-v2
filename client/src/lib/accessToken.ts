import { useSyncExternalStore } from "react";

// The single-user access token (see server/auth.ts). Entered once per device
// and kept in localStorage; any 401 from the API clears it, which sends the
// app back to the AccessGate screen.

const STORAGE_KEY = "focusflow-access-token";
const CHANGE_EVENT = "focusflow-access-token-change";

export function getAccessToken(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(STORAGE_KEY, token);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable: the gate will just ask again next launch.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useAccessToken() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(CHANGE_EVENT, onChange);
      return () => window.removeEventListener(CHANGE_EVENT, onChange);
    },
    getAccessToken,
  );
}

function isApiRequest(input: RequestInfo | URL) {
  const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const url = new URL(raw, window.location.href);
  return url.origin === window.location.origin && url.pathname.startsWith("/api/");
}

// Wraps window.fetch so every same-origin /api call carries the token. The
// alternative is threading a header through ~20 fetch call sites in hooks/,
// DataContext and lib/ai.ts, and any new one that forgets it breaks silently.
export function installAuthFetch() {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    if (!isApiRequest(input)) return originalFetch(input, init);

    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    const token = getAccessToken();
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

    const res = await originalFetch(input, { ...init, headers });
    // Only the stored token going stale should log you out, not a token
    // being checked explicitly by the gate.
    if (res.status === 401 && token && headers.get("Authorization") === `Bearer ${token}`) {
      setAccessToken(null);
    }
    return res;
  };
}

/**
 * A UUID that works outside a secure context.
 *
 * `crypto.randomUUID()` is secure-context-only. localhost counts as secure, so
 * it works in development on your machine - but it is simply `undefined` when
 * the page is served over plain http from a LAN IP, which is exactly how the app
 * is loaded on a phone (http://192.168.0.19:3000) and inside the Capacitor build
 * while `server.url` points at that address.
 *
 * `crypto.getRandomValues()` has no such restriction, so a real v4 UUID is still
 * available; only the convenience wrapper is missing.
 */
export function newId(): string {
  const c: Crypto | undefined = globalThis.crypto;

  if (typeof c?.randomUUID === "function") {
    return c.randomUUID();
  }

  if (typeof c?.getRandomValues === "function") {
    const bytes = c.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return (
      hex.slice(0, 8) + "-" +
      hex.slice(8, 12) + "-" +
      hex.slice(12, 16) + "-" +
      hex.slice(16, 20) + "-" +
      hex.slice(20)
    );
  }

  // No Web Crypto at all. Not a real UUID and not collision-safe, but these ids
  // are row keys in a single-user app, not security tokens - a broken app is
  // worse than a weak id.
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

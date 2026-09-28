import { createHash, timingSafeEqual } from "crypto";
import type { Request, Response, NextFunction } from "express";

// Single-user access gate: every /api request must carry
// `Authorization: Bearer <ACCESS_TOKEN>`. A bearer header rather than a cookie
// so it keeps working if the Capacitor WebView ever becomes cross-origin.
//
// Fails closed: if ACCESS_TOKEN isn't set, the API refuses everything rather
// than silently running open.

function digest(value: string) {
  // Hash both sides so timingSafeEqual always compares equal-length buffers.
  return createHash("sha256").update(value).digest();
}

export function requireAccessToken(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ACCESS_TOKEN;
  if (!expected) {
    return res.status(503).json({ message: "ACCESS_TOKEN is not configured on the server" });
  }

  const header = req.headers.authorization ?? "";
  const given = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

  if (!given || !timingSafeEqual(digest(given), digest(expected))) {
    return res.status(401).json({ message: "Invalid or missing access token" });
  }

  next();
}

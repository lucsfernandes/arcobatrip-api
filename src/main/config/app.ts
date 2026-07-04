import express from "express";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import { v1Router } from "../../presentation/middlewares/routes";
import { env } from "./env";
import "reflect-metadata";

const app = express();

/**
 * Trust the FIRST proxy hop only (Vercel/Neon/portainer edge). This lets
 * `express-rate-limit` and `req.ip` read the real client IP from
 * `X-Forwarded-For` without trusting the whole chain — `true` (trust all) would
 * let a client spoof its IP and defeat per-IP limits.
 */
app.set("trust proxy", 1);

/**
 * Security headers. CSP is intentionally disabled: this is a JSON API, so a
 * Content-Security-Policy belongs to the frontends, not here — the helmet
 * default CSP would only add noise/false positives to API responses.
 */
app.use(helmet({ contentSecurityPolicy: false }));

app.use(express.json());

/**
 * CORS allowlist.
 *
 * - Requests without an `Origin` header (curl, native mobile apps, health
 *   checks, server-to-server) always pass.
 * - The allowlist is the union of:
 *     1. `CORS_ORIGINS` (comma-separated exact origins), and
 *     2. the origin of `WEB_BASE_URL` — so the production frontend domain is
 *        trusted automatically without a second env var (this is the fix for the
 *        prod frontend being blocked when only WEB_BASE_URL was configured).
 * - When the allowlist is empty (pure dev with neither var set to a real host),
 *   any `localhost` / `127.0.0.1` origin is allowed on any port (Vite, Expo).
 *   We deliberately do NOT reflect arbitrary origins (`origin: true`) so a page
 *   on `https://evil.com` can never ride a browser session.
 */

/** Extract the bare origin (scheme + host + port) of a URL, or null if invalid. */
const originOf = (value: string | undefined): string | null => {
  const trimmed = value?.trim().replace(/^['"]|['"]$/g, "");
  if (!trimmed) return null;
  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
};

const isDevLoopback = (origin: string): boolean =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

const allowlist = new Set(
  [
    ...env.CORS_ORIGINS.split(","),
    // WEB_BASE_URL is normalized to its origin so a value with a path/trailing
    // slash (e.g. "https://zarpa.arcobatrox.com.br/") still matches the browser
    // Origin header (which is always bare origin, no path/slash).
    env.WEB_BASE_URL,
  ]
    .map((entry) => originOf(entry))
    .filter((entry): entry is string => entry !== null && !isDevLoopback(entry))
);

const corsOptions: CorsOptions = {
  origin(requestOrigin, callback) {
    // No Origin header => non-browser client; allow.
    if (!requestOrigin) {
      callback(null, true);
      return;
    }

    const allowed =
      allowlist.size > 0
        ? allowlist.has(requestOrigin) || isDevLoopback(requestOrigin)
        : isDevLoopback(requestOrigin);

    if (allowed) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${requestOrigin} não permitida por CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type"],
};

app.use(cors(corsOptions));

app.use('/api/v1', v1Router);

export default app;

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
 * - When `CORS_ORIGINS` is set, ONLY those exact origins are allowed.
 * - When `CORS_ORIGINS` is empty (dev), any `localhost` / `127.0.0.1` origin is
 *   allowed on any port (Vite, Expo, etc.). We deliberately do NOT reflect
 *   arbitrary origins (`origin: true`) so a page on `https://evil.com` can never
 *   ride a browser session — only loopback dev origins are trusted.
 */
const allowlist = env.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const isDevLoopback = (origin: string): boolean =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

const corsOptions: CorsOptions = {
  origin(requestOrigin, callback) {
    // No Origin header => non-browser client; allow.
    if (!requestOrigin) {
      callback(null, true);
      return;
    }

    const allowed =
      allowlist.length > 0
        ? allowlist.includes(requestOrigin)
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

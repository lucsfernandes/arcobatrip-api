import type { Request, RequestHandler, Response } from "express";
import rateLimit, { type Options } from "express-rate-limit";
import type { ErrorEnvelope } from "../controllers/BaseController";

/**
 * Rate limiting middlewares.
 *
 * All responses honor the project's uniform error envelope
 * (`{ error: { code, message } }`, see {@link ErrorEnvelope}) so the frontend
 * can narrow on `error.code === "too_many_requests"` exactly like any other
 * API error.
 *
 * In the test environment (`NODE_ENV === 'test'` or a Jest worker) every
 * limiter degrades to a transparent no-op so the existing integration suites
 * are never throttled and stay deterministic.
 */

/** True when running under Jest so limiters become pass-through middlewares. */
const isTestEnv =
  process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

/** Pass-through middleware used in place of a real limiter under test. */
const noop: RequestHandler = (_req, _res, next) => {
  next();
};

/**
 * Builds the 429 handler that emits the shared error envelope instead of the
 * library's default plain-text body.
 */
const envelopeHandler =
  (message: string) =>
  (_req: Request, res: Response, _next: unknown, options: Options): void => {
    const body: ErrorEnvelope = {
      error: {
        code: "too_many_requests",
        message,
      },
    };
    res.status(options.statusCode).json(body);
  };

/**
 * Creates a limiter that is a no-op under test and a real
 * `express-rate-limit` instance otherwise.
 */
const buildLimiter = (
  config: Pick<Options, "windowMs" | "limit"> & { message: string }
): RequestHandler => {
  if (isTestEnv) {
    return noop;
  }

  return rateLimit({
    windowMs: config.windowMs,
    limit: config.limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: envelopeHandler(config.message),
  });
};

/**
 * Guards the most brute-force-sensitive credential endpoints
 * (`login`, `signup`, `register`).
 *
 * Budget: 10 requests / 15 min / IP. Generous enough for a human retrying a
 * typo'd password a few times, tight enough to blunt credential-stuffing.
 */
export const authLimiter: RequestHandler = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Muitas tentativas. Tente novamente em alguns minutos.",
});

/**
 * Guards endpoints that trigger an outbound email
 * (`forgot-password`, `resend-verification`, `POST /users/me/phone`).
 *
 * Budget: 5 requests / hour / IP — protects the transactional email
 * reputation/quota and prevents inbox flooding of a target address.
 */
export const emailLimiter: RequestHandler = buildLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: "Muitas solicitações de email. Aguarde antes de tentar novamente.",
});

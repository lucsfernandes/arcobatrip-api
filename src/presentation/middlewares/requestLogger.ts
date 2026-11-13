import { randomUUID } from "crypto";
import type { Request, RequestHandler } from "express";
import logger from "../../main/logger";

/** Anything else is replaced: a client-chosen id must not be able to forge or inject log lines. */
const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{8,64}$/;

export const REQUEST_ID_HEADER = "X-Request-Id";

interface Logs {
  info(message: string, meta: Record<string, unknown>): unknown;
}

/**
 * The route as a TEMPLATE (`/api/v1/trips/:id`), never the URL that was asked
 * for: the URL can carry ids, search terms or tokens, and for a path that matched
 * nothing it is whatever a stranger typed (`unmatched`).
 */
export function routeTemplate(req: Request): string {
  if (!req.route || typeof req.route.path !== "string") {
    // A middleware answered (a 401 from the auth gate) before any route matched:
    // the router's mount path is static and safe, so say which router it was.
    return req.baseUrl ? `${req.baseUrl}/*` : "unmatched";
  }
  const path = req.route.path === "/" ? "" : req.route.path;
  return `${req.baseUrl}${path}` || "/";
}

/**
 * One access log per request (`log_type: "access"`): when, from which IP, which
 * route, the status and how long it took, and the signed-in user's id (not the
 * e-mail). It never records the query string, the body, the headers or the
 * cookies. Every response carries `X-Request-Id`, so a person who reports a
 * problem can quote it and the request is found in the logs.
 *
 * Health checks are skipped: probes run every few seconds and are not users.
 */
export function requestLogger(log: Logs = logger): RequestHandler {
  return (req, res, next) => {
    const incoming = req.get(REQUEST_ID_HEADER);
    const requestId = incoming && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
    res.setHeader(REQUEST_ID_HEADER, requestId);

    const startedAt = process.hrtime.bigint();
    let logged = false;
    const write = (aborted: boolean) => {
      if (logged) return;
      logged = true;
      const route = routeTemplate(req);
      if (route.endsWith("/health")) return;
      log.info("request", {
        log_type: "access",
        request_id: requestId,
        method: req.method,
        route,
        status: res.statusCode,
        duration_ms: Math.round(Number(process.hrtime.bigint() - startedAt) / 1e6),
        user_id: (req as Request & { userId?: string }).userId ?? null,
        ip: req.ip,
        ...(aborted ? { aborted: true } : {}),
      });
    };
    res.on("finish", () => write(false));
    // The client went away before the response was sent.
    res.on("close", () => write(true));

    next();
  };
}

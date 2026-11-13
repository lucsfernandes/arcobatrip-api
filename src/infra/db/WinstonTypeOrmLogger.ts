import type { Logger as TypeOrmLogger } from "typeorm";
import logger from "../../main/logger";

/** SQL can be long (big IN lists): keep the line readable. */
const MAX_QUERY_LENGTH = 600;

const shorten = (query: string) =>
  query.length > MAX_QUERY_LENGTH ? `${query.slice(0, MAX_QUERY_LENGTH)}…` : query;

/**
 * TypeORM's default logger writes straight to the console and prints each query
 * WITH its parameters: an e-mail, a password hash, a token hash. It bypasses
 * the app's logger, so the redaction never saw it. This one goes through winston
 * (so it is JSON, typed `app` and redacted) and NEVER includes the parameters,
 * only how many there were.
 */
export class WinstonTypeOrmLogger implements TypeOrmLogger {
  logQuery(query: string, parameters?: unknown[]): void {
    logger.debug("[typeorm] query", { query: shorten(query), parameters: parameters?.length ?? 0 });
  }

  logQueryError(error: string | Error, query: string, parameters?: unknown[]): void {
    logger.error("[typeorm] query failed", {
      error: error instanceof Error ? error.message : error,
      query: shorten(query),
      parameters: parameters?.length ?? 0,
    });
  }

  logQuerySlow(time: number, query: string, parameters?: unknown[]): void {
    logger.warn("[typeorm] slow query", {
      duration_ms: time,
      query: shorten(query),
      parameters: parameters?.length ?? 0,
    });
  }

  logSchemaBuild(message: string): void {
    logger.info(`[typeorm] ${message}`);
  }

  logMigration(message: string): void {
    logger.info(`[typeorm] ${message}`);
  }

  log(level: "log" | "info" | "warn", message: unknown): void {
    const text = typeof message === "string" ? message : JSON.stringify(message);
    if (level === "warn") logger.warn(`[typeorm] ${text}`);
    else logger.info(`[typeorm] ${text}`);
  }
}

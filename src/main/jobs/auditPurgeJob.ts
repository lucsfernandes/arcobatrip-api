import logger from "../logger";
import { AuditLog } from "../../application/services/AuditLog";

const DAY_MS = 24 * 60 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 60 * 1000;

/**
 * Daily purge of audit events past their retention. The first run waits a
 * minute so the database connection is up. With more than one replica the
 * runs overlap, which is harmless: deleting expired rows is idempotent.
 */
export function startAuditPurgeJob(audit: AuditLog): void {
  const run = async () => {
    try {
      const removed = await audit.purgeExpired();
      logger.info("[auditPurgeJob] eventos de auditoria expirados removidos", { removed });
    } catch (error) {
      logger.error("[auditPurgeJob] falha na limpeza", (error as Error).message);
    }
  };
  setTimeout(() => {
    void run();
    setInterval(() => void run(), DAY_MS).unref();
  }, FIRST_RUN_DELAY_MS).unref();
}

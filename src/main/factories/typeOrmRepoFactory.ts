import AppDataSource from "../../infra/db/ormconfig";
import { ParticipantRepo } from "../../infra/repositories/ParticipantRepo";
import { TripRepo } from "../../infra/repositories/TripRepo";
import { UserRepo } from "../../infra/repositories/UserRepo";
import { TripContractRepo } from "../../infra/repositories/TripContractRepo";
import { ExpenseRepo } from "../../infra/repositories/ExpenseRepo";
import { SettledPaymentRepo } from "../../infra/repositories/SettledPaymentRepo";
import { NotificationRepo } from "../../infra/repositories/NotificationRepo";
import { NotificationEmitter } from "../../application/services/NotificationEmitter";
import { VerificationTokenRepo } from "../../infra/repositories/VerificationTokenRepo";
import { AuditLogRepo } from "../../infra/repositories/AuditLogRepo";
import { AccountDeletionRepo } from "../../infra/repositories/AccountDeletionRepo";
import { AuditLog } from "../../application/services/AuditLog";
import { setAccountExistsCheck } from "../../presentation/middlewares/authMiddleware";

const connector = AppDataSource;

connector.initialize();

const participantRepo = new ParticipantRepo(connector);
const tripRepo = new TripRepo(connector);
const userRepo = new UserRepo(connector);
const tripContractRepo = new TripContractRepo(connector);
const expenseRepo = new ExpenseRepo(connector);
const settledPaymentRepo = new SettledPaymentRepo(connector);
const notificationRepo = new NotificationRepo(connector);
const verificationTokenRepo = new VerificationTokenRepo(connector);

// Every authenticated request checks the account still exists, so a deleted
// account's tokens stop working at once (see authMiddleware).
setAccountExistsCheck((userId) => userRepo.existsById(userId));
const auditLogRepo = new AuditLogRepo(connector);
const accountDeletionRepo = new AccountDeletionRepo(connector);

/** Audit trail (LGPD art. 37): e-mails are stored only as a keyed hash. */
const auditLog = new AuditLog(auditLogRepo);

/** Shared notification fan-out used by the trip use cases. */
const notificationEmitter = new NotificationEmitter(userRepo, notificationRepo);

export {
  participantRepo,
  tripRepo,
  userRepo,
  tripContractRepo,
  expenseRepo,
  settledPaymentRepo,
  notificationRepo,
  notificationEmitter,
  verificationTokenRepo,
  auditLogRepo,
  auditLog,
  accountDeletionRepo,
};

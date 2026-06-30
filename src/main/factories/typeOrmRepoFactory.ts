import AppDataSource from "../../infra/db/ormconfig";
import { ParticipantRepo } from "../../infra/repositories/ParticipantRepo";
import { TripRepo } from "../../infra/repositories/TripRepo";
import { UserRepo } from "../../infra/repositories/UserRepo";
import { TripContractRepo } from "../../infra/repositories/TripContractRepo";
import { ExpenseRepo } from "../../infra/repositories/ExpenseRepo";
import { NotificationRepo } from "../../infra/repositories/NotificationRepo";
import { NotificationEmitter } from "../../application/services/NotificationEmitter";
import { VerificationTokenRepo } from "../../infra/repositories/VerificationTokenRepo";

const connector = AppDataSource;

connector.initialize();

const participantRepo = new ParticipantRepo(connector);
const tripRepo = new TripRepo(connector);
const userRepo = new UserRepo(connector);
const tripContractRepo = new TripContractRepo(connector);
const expenseRepo = new ExpenseRepo(connector);
const notificationRepo = new NotificationRepo(connector);
const verificationTokenRepo = new VerificationTokenRepo(connector);

/** Shared notification fan-out used by the trip use cases. */
const notificationEmitter = new NotificationEmitter(userRepo, notificationRepo);

export {
  participantRepo,
  tripRepo,
  userRepo,
  tripContractRepo,
  expenseRepo,
  notificationRepo,
  notificationEmitter,
  verificationTokenRepo,
};

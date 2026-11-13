import { AccountDeletionPlan, AccountSnapshot } from "./accountDeletionPlan";

/** The operations that run inside ONE database transaction. */
export interface IAccountDeletionTx {
  loadSnapshot(user: AccountSnapshot["user"]): Promise<AccountSnapshot>;
  applyPlan(plan: AccountDeletionPlan): Promise<void>;
}

export interface IAccountDeletionRepo {
  /** Runs `work` in a transaction: it commits when `work` returns and rolls back when it throws. */
  inTransaction<T>(work: (tx: IAccountDeletionTx) => Promise<T>): Promise<T>;
}

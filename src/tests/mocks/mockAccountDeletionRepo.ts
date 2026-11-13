import { AccountDeletionPlan, AccountSnapshot } from "../../application/usecases/users/deleteAccount/accountDeletionPlan";
import {
  IAccountDeletionRepo,
  IAccountDeletionTx,
} from "../../application/usecases/users/deleteAccount/IAccountDeletionRepo";

/**
 * {@link IAccountDeletionRepo} that serves a fixed snapshot and records the plans
 * it was asked to apply. The rules are tested on the pure planner and, against a
 * real Postgres, on the repository itself; this mock only drives the use case.
 */
export class MockAccountDeletionRepo implements IAccountDeletionRepo {
  public snapshot: AccountSnapshot["trips"] = [];
  public applied: AccountDeletionPlan[] = [];
  /** Make `applyPlan` throw, as a failing statement in the transaction would. */
  public failApply = false;
  public transactions = 0;
  /** Called with each plan that was applied, so a test can reflect it (e.g. drop the user). */
  public onApply: ((plan: AccountDeletionPlan) => void) | null = null;

  async inTransaction<T>(work: (tx: IAccountDeletionTx) => Promise<T>): Promise<T> {
    this.transactions += 1;
    const applied: AccountDeletionPlan[] = [];
    const tx: IAccountDeletionTx = {
      loadSnapshot: async (user) => ({ user, trips: this.snapshot }),
      applyPlan: async (plan) => {
        applied.push(plan);
        if (this.failApply) throw new Error("statement failed");
      },
    };
    const result = await work(tx);
    // Like a real transaction: what was applied is kept only when `work` succeeded.
    this.applied.push(...applied);
    applied.forEach((plan) => this.onApply?.(plan));
    return result;
  }

  clear(): void {
    this.snapshot = [];
    this.applied = [];
    this.failApply = false;
    this.transactions = 0;
    this.onApply = null;
  }
}

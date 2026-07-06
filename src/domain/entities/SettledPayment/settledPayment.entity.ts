import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../base.entity";
import { Trip } from "../Trip/trip.entity";

/**
 * A recorded "acerto de contas" (settlement payment): participant `from_id`
 * paid participant `to_id` `amount` reais toward the trip debts. Persists the
 * client-side `settledPayments` that previously lived only in the mobile/web
 * apps.
 *
 * These rows are SUBTRACTED from the computed balances before the pending
 * "who-pays-whom" settlements are recomputed (see `pendingSettlements`), so the
 * remaining settlements already discount what was paid. `amount` mirrors
 * {@link Expense.amount} exactly (numeric(12,2), number in JS).
 */
@Entity("settled_payments")
export class SettledPayment extends BaseEntity {
  @Column({ name: "trip_id", type: "varchar" })
  @Index()
  public tripId!: string;

  /** Participant id of the payer. */
  @Column({ name: "from_id", type: "varchar" })
  public fromId!: string;

  /** Participant id of the receiver. */
  @Column({ name: "to_id", type: "varchar" })
  public toId!: string;

  @Column({
    name: "amount",
    type: "numeric",
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number): number => value,
      from: (value: string | number): number =>
        typeof value === "string" ? parseFloat(value) : value,
    },
  })
  public amount!: number;

  @ManyToOne(() => Trip, { onDelete: "CASCADE" })
  @JoinColumn({ name: "trip_id" })
  trip?: Trip;
}

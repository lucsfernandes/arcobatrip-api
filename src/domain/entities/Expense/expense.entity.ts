import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../base.entity";
import { Trip } from "../Trip/trip.entity";

/**
 * A shared trip expense. `amount` is stored as numeric/decimal and transformed
 * back to a JS number by the mapper. `splitBetween` is the set of participant
 * ids the cost is split across (stored as a simple-array of ids).
 */
@Entity('expenses')
export class Expense extends BaseEntity {
  @Column({ name: 'title', type: 'varchar' })
  public title!: string;

  @Column({
    name: 'amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number): number => value,
      from: (value: string | number): number =>
        typeof value === 'string' ? parseFloat(value) : value,
    },
  })
  public amount!: number;

  @Column({ name: 'category', type: 'varchar' })
  public category!: string;

  @Column({ name: 'paid_by_id', type: 'varchar' })
  public paidById!: string;

  @Column({ name: 'split_between', type: 'simple-array' })
  public splitBetween!: string[];

  @Column({ name: 'trip_id', type: 'varchar' })
  @Index()
  public tripId!: string;

  /**
   * OPTIONAL link to an activity of the same trip. A general trip expense has
   * this `null`. Activity-tagged expenses still count in the trip-wide
   * settlement aggregation — the tag is metadata, not a scoping boundary.
   */
  @Column({ name: 'activity_id', type: 'varchar', nullable: true })
  @Index()
  public activityId?: string | null;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip?: Trip;
}

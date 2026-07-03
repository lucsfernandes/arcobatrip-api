import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Trip } from "../Trip/trip.entity";
import { BaseEntity } from "../base.entity";

@Entity('activities')
export class Activity extends BaseEntity { 
  @Column({ name: 'title', type: 'varchar' })
  public title!: string;

  @Column({ name: 'occurs_at', type: 'timestamp', precision: 6 })
  public occursAt!: Date;

  @Column({ name: 'status', type: 'varchar', default: 'pending' })
  public status!: string;

  @Column({ name: 'trip_id', type: 'varchar' })
  @Index()
  public tripId!: string;

  /**
   * User who created the activity. Nullable to accommodate rows created before
   * this column existed. Used to authorize edit/delete ("creator OR trip owner").
   */
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  @Index()
  public createdBy?: string | null;

  @ManyToOne(() => Trip)
  @JoinColumn({ name: 'trip_id' })
  trip?: Trip;
}
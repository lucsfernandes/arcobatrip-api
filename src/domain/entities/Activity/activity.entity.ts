import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Trip } from "../Trip/trip.entity";
import { BaseEntity } from "../base.entity";

@Entity('activities')
export class Activity extends BaseEntity { 
  @Column({ name: 'title', type: 'varchar' })
  public title!: string;

  @Column({ name: 'occurs_at', type: 'timestamp', precision: 6 })
  public occursAt!: Date;

  @Column({ name: 'trip_id', type: 'varchar' })
  @Index()
  public tripId!: string;

  @ManyToOne(() => Trip)
  @JoinColumn({ name: 'trip_id' })
  trip?: Trip;
}
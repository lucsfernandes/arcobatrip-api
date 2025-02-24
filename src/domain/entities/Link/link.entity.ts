import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../base.entity";
import { Trip } from "../Trip/trip.entity";

@Entity('links')
export class Link extends BaseEntity {
  @Column({ name: 'title', type: 'varchar' })
  public title!: string;

  @Column({ name: 'url', type: 'varchar' })
  public url!: string;
  
  @Column({ name: 'trip_id', type: 'varchar' })
  @Index()
  public tripId!: string;

  @ManyToOne(() => Trip)
  @JoinColumn({ name: 'trip_id' })
  trip?: Trip;
}
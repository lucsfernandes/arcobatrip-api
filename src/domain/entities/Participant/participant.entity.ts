import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "../base.entity";
import { Trip } from "../Trip/trip.entity";

@Entity('participants')
export class Participant extends BaseEntity {
  @Column({ name: 'name', type: 'varchar' })
  public name!: string
  
  @Column({ name: 'email', type: 'varchar' })
  @Index()
  public email!: string

  @Column({
    name: 'is_confirmed',
    type: 'boolean',
    default: false
  })
  public isConfirmed!: boolean

  @Column({
    name: 'is_owner',
    type: 'boolean',
    default: false
  })
  public isOwner!: boolean

  @Column({ name: 'trip_id', type: 'varchar' })
  @Index()
  public tripId!: string

  @ManyToOne(() => Trip, trip => trip.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip!: Trip;
}
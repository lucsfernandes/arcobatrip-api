import { Column, Entity, Index, ManyToMany } from "typeorm";
import { BaseEntity } from "../base.entity";
import { Trip } from "../Trip/trip.entity";

@Entity('users')
export class User extends BaseEntity {
  @Column({ name: 'username', type: 'varchar' })
  public username!: string;

  @Column({ name: 'first_name', type: 'varchar' })
  public firstName!: string;

  @Column({ name: 'last_name', type: 'varchar' })
  public lastName!: string;

  @Column({ name: 'phone_number', type: 'varchar' })
  @Index()
  public phoneNumber!: string;

  @Column({ name: 'email', type: 'varchar' })
  @Index()
  public email!: string;

  @Column({ name: 'password', type: 'varchar' })
  public password!: string;

  @ManyToMany(
    () => Trip,
    trip => trip.users,
    { cascade: true }
  )
  public trips?: Trip[];
}
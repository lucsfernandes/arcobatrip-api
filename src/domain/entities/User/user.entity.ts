import { Column, Entity, Index, ManyToMany } from "typeorm";
import { BaseEntity } from "../base.entity";
import { Trip } from "../Trip/trip.entity";

@Entity('users')
export class User extends BaseEntity {
  @Column({ name: 'full_name', type: 'varchar' })
  public fullName!: string;

  @Column({ name: 'phone', type: 'varchar', nullable: true })
  @Index()
  public phone?: string | null;

  @Column({ name: 'email', type: 'varchar', unique: true })
  @Index()
  public email!: string;

  @Column({ name: 'password', type: 'varchar', select: false })
  public password!: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  public birthDate?: Date | null;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  public avatarUrl?: string | null;

  @Column({ name: 'accent', type: 'varchar', nullable: true })
  public accent?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive!: boolean;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  public emailVerifiedAt?: Date | null;

  @ManyToMany(
    () => Trip,
    trip => trip.users,
    { cascade: true }
  )
  public trips?: Trip[];
}

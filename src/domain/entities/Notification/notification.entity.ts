import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../base.entity";

/**
 * An in-app notification owned by a single user. `at` is derived from
 * {@link BaseEntity.createdAt}. `tripId` is optional context.
 */
@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ name: 'user_id', type: 'varchar' })
  @Index()
  public userId!: string;

  @Column({ name: 'type', type: 'varchar' })
  public type!: string;

  @Column({ name: 'title', type: 'varchar' })
  public title!: string;

  @Column({ name: 'body', type: 'varchar' })
  public body!: string;

  @Column({ name: 'read', type: 'boolean', default: false })
  public read!: boolean;

  @Column({ name: 'trip_id', type: 'varchar', nullable: true })
  public tripId?: string | null;
}

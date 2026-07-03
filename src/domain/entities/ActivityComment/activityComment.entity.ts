import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../base.entity";

/**
 * A comment on an activity. Extends {@link BaseEntity} to inherit the soft-delete
 * `deleted_at` column. `author_name` is a display-name snapshot taken at write
 * time so the list renders without joining back to users/participants.
 */
@Entity("activity_comments")
export class ActivityComment extends BaseEntity {
  @Column({ name: "activity_id", type: "varchar" })
  @Index()
  public activityId!: string;

  @Column({ name: "author_id", type: "uuid" })
  public authorId!: string;

  @Column({ name: "author_name", type: "varchar" })
  public authorName!: string;

  @Column({ name: "body", type: "text" })
  public body!: string;
}

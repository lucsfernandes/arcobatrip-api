import { Column, Entity, ManyToMany, OneToMany } from "typeorm";
import { BaseEntity } from "../base.entity";
import { User } from "../User/user.entity";
import { Participant } from "../Participant/participant.entity";
import { Activity } from "../Activity/activity.entity";
import { Link } from "../Link/link.entity";

@Entity("trips")
export class Trip extends BaseEntity {
  @Column({ name: "destination", type: "varchar" })
  public destination!: string;

  @Column({ name: "starts_at", type: "varchar" })
  public startsAt!: string;

  @Column({ name: "ends_at", type: "varchar" })
  public endsAt!: string;

  @Column({
    name: "is_confirmed",
    type: "boolean",
    default: false
  })
  public isConfirmed!: boolean;

  @OneToMany(() => Participant, (participant) => participant.trip, { cascade: ["insert"] })
  participants!: Participant[];

  @OneToMany(() => Activity, (activity) => activity.id, { cascade: true })
  activities!: Activity[];

  @OneToMany(() => Link, (link) => link.id, { cascade: true })
  links!: Link[];

  @ManyToMany(() => User, (user) => user.trips)
  public users?: User[];
}
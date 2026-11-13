import { DataSource, EntityManager, In } from "typeorm";
import {
  AccountDeletionPlan,
  AccountSnapshot,
  SnapshotTrip,
  anonymizedEmail,
} from "../../application/usecases/users/deleteAccount/accountDeletionPlan";
import {
  IAccountDeletionRepo,
  IAccountDeletionTx,
} from "../../application/usecases/users/deleteAccount/IAccountDeletionRepo";
import { Trip } from "../../domain/entities/Trip/trip.entity";
import { Participant } from "../../domain/entities/Participant/participant.entity";
import { Activity } from "../../domain/entities/Activity/activity.entity";
import { Link } from "../../domain/entities/Link/link.entity";
import { ActivityComment } from "../../domain/entities/ActivityComment/activityComment.entity";
import { Expense } from "../../domain/entities/Expense/expense.entity";
import { SettledPayment } from "../../domain/entities/SettledPayment/settledPayment.entity";
import { Notification } from "../../domain/entities/Notification/notification.entity";
import { User } from "../../domain/entities/User/user.entity";
import { VerificationToken } from "../../domain/entities/VerificationToken/verification.token.entity";

/** Escapes `%`, `_` and `\` so a name is matched literally inside a LIKE pattern. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

class AccountDeletionTx implements IAccountDeletionTx {
  constructor(private readonly manager: EntityManager) {}

  async loadSnapshot(user: AccountSnapshot["user"]): Promise<AccountSnapshot> {
    const m = this.manager;
    // Every table is read with soft-deleted rows included: a trip or a guest the
    // owner already "deleted" still holds this person's data.
    const mine = await m
      .createQueryBuilder(Participant, "p")
      .withDeleted()
      .where("lower(p.email) = lower(:email)", { email: user.email })
      .getMany();
    const tripIds = [...new Set(mine.map((p) => p.tripId))];
    if (tripIds.length === 0) return { user, trips: [] };

    const [trips, participants, activities, expenses, payments] = await Promise.all([
      m.find(Trip, { where: { id: In(tripIds) }, withDeleted: true }),
      m.find(Participant, { where: { tripId: In(tripIds) }, withDeleted: true }),
      m.find(Activity, { where: { tripId: In(tripIds) }, withDeleted: true }),
      m.find(Expense, { where: { tripId: In(tripIds) }, withDeleted: true }),
      m.find(SettledPayment, { where: { tripId: In(tripIds) }, withDeleted: true }),
    ]);
    const activityIds = activities.map((a) => a.id);
    const comments = activityIds.length
      ? await m.find(ActivityComment, { where: { activityId: In(activityIds) }, withDeleted: true })
      : [];

    const snapshotTrips: SnapshotTrip[] = trips.map((trip) => {
      const tripActivities = activities.filter((a) => a.tripId === trip.id);
      const tripActivityIds = new Set(tripActivities.map((a) => a.id));
      return {
        id: trip.id,
        destination: trip.destination,
        coverPublicId: trip.coverPublicId ?? null,
        participants: participants
          .filter((p) => p.tripId === trip.id)
          .map((p) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            isOwner: p.isOwner,
            isConfirmed: p.isConfirmed,
            deleted: !!p.deletedAt,
            createdAt: p.createdAt,
          })),
        activities: tripActivities.map((a) => ({
          id: a.id,
          bannerPublicId: a.bannerPublicId ?? null,
          createdBy: a.createdBy ?? null,
        })),
        comments: comments
          .filter((c) => tripActivityIds.has(c.activityId))
          .map((c) => ({ id: c.id, authorId: c.authorId })),
        expenses: expenses
          .filter((e) => e.tripId === trip.id)
          .map((e) => ({ paidById: e.paidById, splitBetween: e.splitBetween ?? [] })),
        payments: payments
          .filter((p) => p.tripId === trip.id)
          .map((p) => ({ fromId: p.fromId, toId: p.toId })),
      };
    });
    return { user, trips: snapshotTrips };
  }

  async applyPlan(plan: AccountDeletionPlan): Promise<void> {
    const m = this.manager;

    // Trips only this person kept alive: everything in them goes. Activities and
    // links reference the trip without ON DELETE CASCADE, so they go first.
    for (const trip of plan.deleteTrips) {
      await m.delete(SettledPayment, { tripId: trip.tripId });
      await m.delete(Expense, { tripId: trip.tripId });
      if (trip.commentIds.length) await m.delete(ActivityComment, { id: In(trip.commentIds) });
      await m.delete(Link, { tripId: trip.tripId });
      await m.delete(Activity, { tripId: trip.tripId });
      await m.delete(Participant, { tripId: trip.tripId });
      await m.delete(Notification, { tripId: trip.tripId });
      await m.delete(Trip, { id: trip.tripId });
    }

    // Shared trips: they stay for the others, only this person's ties go.
    for (const step of plan.unlinkTrips) {
      if (step.detachActivityIds.length) {
        await m.update(Activity, { id: In(step.detachActivityIds) }, { createdBy: null });
      }
      if (step.deleteCommentIds.length) {
        await m.delete(ActivityComment, { id: In(step.deleteCommentIds) });
      }
      if (step.removeParticipantIds.length) {
        await m.delete(Participant, { id: In(step.removeParticipantIds) });
      }
      for (const a of step.anonymize) {
        await m.update(
          Participant,
          { id: a.participantId },
          {
            name: a.name,
            email: anonymizedEmail(a.participantId),
            avatarUrl: null,
            accent: null,
            isOwner: false,
          }
        );
      }
      for (const name of step.confirmationNoticeNames) {
        await m
          .createQueryBuilder()
          .delete()
          .from(Notification)
          .where("trip_id = :tripId", { tripId: step.tripId })
          .andWhere("type = 'confirmacao'")
          .andWhere("body LIKE :pattern ESCAPE '\\'", {
            pattern: `${escapeLike(name)} confirmou presença%`,
          })
          .execute();
      }
      if (step.transferOwnershipTo) {
        await m.update(Participant, { id: step.transferOwnershipTo.participantId }, { isOwner: true });
        const successor = await m
          .createQueryBuilder(User, "u")
          .where("lower(u.email) = lower(:email)", { email: step.transferOwnershipTo.email })
          .getOne();
        if (successor) {
          await m.save(
            m.create(Notification, {
              userId: successor.id,
              type: "atividade",
              title: "Você agora organiza a viagem",
              body: `A organização da viagem para ${step.destination} passou para você.`,
              tripId: step.tripId,
            })
          );
        }
      }
    }

    // The account itself.
    await m.delete(Notification, { userId: plan.userId });
    await m.delete(VerificationToken, { userId: plan.userId });
    await m.delete(User, { id: plan.userId });
  }
}

export class AccountDeletionRepo implements IAccountDeletionRepo {
  constructor(private readonly dataSource: DataSource) {}

  inTransaction<T>(work: (tx: IAccountDeletionTx) => Promise<T>): Promise<T> {
    return this.dataSource.transaction((manager) => work(new AccountDeletionTx(manager)));
  }
}

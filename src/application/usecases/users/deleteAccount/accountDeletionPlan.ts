/**
 * Pure planning for "delete my account" (LGPD). Given a snapshot of everything
 * that touches the user, it decides what to delete, what to unlink and what to
 * anonymize. Nothing here touches the database: the repository applies the plan
 * in a single transaction.
 *
 * Rules (decisions D1–D4 of the account-deletion plan):
 *  - A trip with NO other confirmed participant is deleted with everything in
 *    it. Guests who never confirmed do not count (D1).
 *  - Otherwise the trip, its activities and links stay; only the user's ties go:
 *      · activities the user created lose their author;
 *      · the user's comments are deleted (D4);
 *      · the user's participant row is deleted, or anonymized when it appears
 *        in an expense or a recorded payment, so the others' accounts still
 *        add up (D3);
 *      · if the user organised the trip, the organisation passes to the oldest
 *        confirmed participant (D2).
 *  - Already soft-deleted trips, guests and activities are included.
 */

/** Suffix kept after the name of a participant who left but is still in the accounts (D3). */
export const REMOVED_MARK = "(Participante removido)";

export function anonymizedName(name: string): string {
  return name.endsWith(REMOVED_MARK) ? name : `${name} ${REMOVED_MARK}`;
}

/** A unique address with no personal data (`.invalid` is a reserved, never-routable TLD). */
export function anonymizedEmail(participantId: string): string {
  return `removed-${participantId}@removed.invalid`;
}

export interface SnapshotParticipant {
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
  isConfirmed: boolean;
  /** Soft-deleted (the guest was already removed from the trip). */
  deleted: boolean;
  createdAt: Date;
}

export interface SnapshotTrip {
  id: string;
  destination: string;
  coverPublicId: string | null;
  participants: SnapshotParticipant[];
  activities: { id: string; bannerPublicId: string | null; createdBy: string | null }[];
  comments: { id: string; authorId: string }[];
  expenses: { paidById: string; splitBetween: string[] }[];
  payments: { fromId: string; toId: string }[];
}

export interface AccountSnapshot {
  user: { id: string; email: string; avatarPublicId: string | null };
  trips: SnapshotTrip[];
}

export interface TripDeletionStep {
  tripId: string;
  commentIds: string[];
}

export interface TripUnlinkStep {
  tripId: string;
  destination: string;
  detachActivityIds: string[];
  deleteCommentIds: string[];
  removeParticipantIds: string[];
  anonymize: { participantId: string; name: string }[];
  /** Names the user had in this trip: "<name> confirmou presença…" notices to the others go. */
  confirmationNoticeNames: string[];
  transferOwnershipTo: { participantId: string; email: string } | null;
}

export interface AccountDeletionCounts {
  tripsDeleted: number;
  tripsUnlinked: number;
  ownershipsTransferred: number;
  participantsRemoved: number;
  participantsAnonymized: number;
  commentsDeleted: number;
  activitiesDetached: number;
  imagesToRemove: number;
}

export interface AccountDeletionPlan {
  userId: string;
  email: string;
  deleteTrips: TripDeletionStep[];
  unlinkTrips: TripUnlinkStep[];
  /** Cloudinary public ids to remove after the database commit. */
  imagePublicIds: string[];
  counts: AccountDeletionCounts;
}

const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function buildDeletionPlan(snapshot: AccountSnapshot): AccountDeletionPlan {
  const { user } = snapshot;
  const deleteTrips: TripDeletionStep[] = [];
  const unlinkTrips: TripUnlinkStep[] = [];
  const images = new Set<string>();
  if (user.avatarPublicId) images.add(user.avatarPublicId);

  for (const trip of snapshot.trips) {
    const mine = trip.participants.filter((p) => sameEmail(p.email, user.email));
    if (mine.length === 0) continue;
    const mineIds = new Set(mine.map((p) => p.id));

    const othersConfirmed = trip.participants
      .filter((p) => !mineIds.has(p.id) && !p.deleted && p.isConfirmed)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id));

    if (othersConfirmed.length === 0) {
      deleteTrips.push({ tripId: trip.id, commentIds: trip.comments.map((c) => c.id) });
      if (trip.coverPublicId) images.add(trip.coverPublicId);
      for (const a of trip.activities) if (a.bannerPublicId) images.add(a.bannerPublicId);
      continue;
    }

    const inAccounts = (participantId: string) =>
      trip.expenses.some((e) => e.paidById === participantId || e.splitBetween.includes(participantId)) ||
      trip.payments.some((p) => p.fromId === participantId || p.toId === participantId);

    const removeParticipantIds: string[] = [];
    const anonymize: { participantId: string; name: string }[] = [];
    for (const p of mine) {
      if (inAccounts(p.id)) anonymize.push({ participantId: p.id, name: anonymizedName(p.name) });
      else removeParticipantIds.push(p.id);
    }

    const wasOrganiser = mine.some((p) => p.isOwner && !p.deleted);
    const anotherOwner = trip.participants.some((p) => !mineIds.has(p.id) && !p.deleted && p.isOwner);
    const successor = wasOrganiser && !anotherOwner ? othersConfirmed[0] : null;

    unlinkTrips.push({
      tripId: trip.id,
      destination: trip.destination,
      detachActivityIds: trip.activities.filter((a) => a.createdBy === user.id).map((a) => a.id),
      deleteCommentIds: trip.comments.filter((c) => c.authorId === user.id).map((c) => c.id),
      removeParticipantIds,
      anonymize,
      confirmationNoticeNames: [...new Set(mine.map((p) => p.name))],
      transferOwnershipTo: successor ? { participantId: successor.id, email: successor.email } : null,
    });
  }

  const imagePublicIds = [...images];
  return {
    userId: user.id,
    email: user.email,
    deleteTrips,
    unlinkTrips,
    imagePublicIds,
    counts: {
      tripsDeleted: deleteTrips.length,
      tripsUnlinked: unlinkTrips.length,
      ownershipsTransferred: unlinkTrips.filter((t) => t.transferOwnershipTo).length,
      participantsRemoved: unlinkTrips.reduce((n, t) => n + t.removeParticipantIds.length, 0),
      participantsAnonymized: unlinkTrips.reduce((n, t) => n + t.anonymize.length, 0),
      commentsDeleted:
        deleteTrips.reduce((n, t) => n + t.commentIds.length, 0) +
        unlinkTrips.reduce((n, t) => n + t.deleteCommentIds.length, 0),
      activitiesDetached: unlinkTrips.reduce((n, t) => n + t.detachActivityIds.length, 0),
      imagesToRemove: imagePublicIds.length,
    },
  };
}

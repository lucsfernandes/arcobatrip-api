import { Trip } from "../../../domain/entities/Trip/trip.entity";
import { Participant } from "../../../domain/entities/Participant/participant.entity";

/**
 * Authorizes owner-only trip actions (e.g. managing the trip banner).
 *
 * Rule: the caller must be a participant flagged `isOwner` whose email matches
 * the authenticated token email. Mirrors the "trip owner" arm of
 * {@link canManageActivity}.
 */
export function isTripOwner(trip: Trip, userEmail: string): boolean {
  return (trip.participants ?? []).some(
    (p) => p.isOwner && !!userEmail && p.email === userEmail
  );
}

/**
 * The participant of `trip` whose email matches the authenticated token email,
 * or `null` when the caller is not a participant. Used to gate participant-only
 * actions (viewing/commenting) and to snapshot the author's display name.
 */
export function findTripParticipant(
  trip: Trip,
  userEmail: string
): Participant | null {
  if (!userEmail) return null;
  return (trip.participants ?? []).find((p) => p.email === userEmail) ?? null;
}

/** Whether the authenticated caller is a participant of the trip. */
export function isTripParticipant(trip: Trip, userEmail: string): boolean {
  return findTripParticipant(trip, userEmail) !== null;
}

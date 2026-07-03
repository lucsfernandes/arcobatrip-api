import { Trip } from "../../../domain/entities/Trip/trip.entity";
import { Activity } from "../../../domain/entities/Activity/activity.entity";
import { isTripOwner } from "./tripAuthorization";

/**
 * Authorizes managing (edit/delete/banner) an activity.
 *
 * Rule (product decision): allowed to the **activity creator** OR the **trip owner**.
 * When `activity.createdBy` is null (legacy rows created before the column existed),
 * only the trip owner is allowed.
 */
export function canManageActivity(
  trip: Trip,
  activity: Activity,
  userId: string,
  userEmail: string
): boolean {
  const isCreator = activity.createdBy != null && activity.createdBy === userId;
  return isTripOwner(trip, userEmail) || isCreator;
}

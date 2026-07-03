import { Trip } from "../../../domain/entities/Trip/trip.entity";
import { Participant } from "../../../domain/entities/Participant/participant.entity";
import { Activity } from "../../../domain/entities/Activity/activity.entity";
import { Link } from "../../../domain/entities/Link/link.entity";
import { ActivityComment } from "../../../domain/entities/ActivityComment/activityComment.entity";

/** A participant to persist when creating a trip. */
export interface NewParticipantData {
  name: string;
  email: string;
  isOwner: boolean;
  isConfirmed: boolean;
}

export interface CreateTripData {
  destination: string;
  startDate: string;
  endDate: string;
  participants: NewParticipantData[];
}

export interface NewActivityData {
  title: string;
  at: string;
  status: string;
  /** User who created the activity (authenticated request). */
  createdBy?: string | null;
  /** Optional free-form description. */
  description?: string | null;
}

/** Partial patch for an existing activity. Only provided fields are updated. */
export interface UpdateActivityData {
  title?: string;
  at?: string;
  status?: string;
  description?: string;
}

/** Cover (banner) image handles persisted on a trip. `null` clears them. */
export interface TripCoverData {
  coverUrl: string | null;
  coverPublicId: string | null;
}

/** Banner image handles persisted on an activity. `null` clears them. */
export interface ActivityBannerData {
  bannerUrl: string | null;
  bannerPublicId: string | null;
}

export interface NewLinkData {
  label: string;
  url: string;
}

export interface NewGuestData {
  name: string;
  email: string;
}

/** A comment to persist on an activity. */
export interface NewActivityCommentData {
  authorId: string;
  authorName: string;
  body: string;
}

/**
 * Persistence boundary for trips and their sub-resources, shaped around the API
 * contract. Methods return the (hydrated) TypeORM entities; the use cases map
 * them into the contract shapes via the `*ContractMap` mappers.
 */
export interface ITripContractRepo {
  createTrip(data: CreateTripData): Promise<Trip>;
  findTripsForUserEmail(email: string): Promise<Trip[]>;
  findTripById(id: string): Promise<Trip | null>;
  /** Persists the trip cover (banner) handles and returns the hydrated trip. */
  updateTripCover(tripId: string, data: TripCoverData): Promise<Trip>;
  addActivity(tripId: string, data: NewActivityData): Promise<Activity>;
  /** Finds an activity scoped to a trip; returns null when it belongs to another trip. */
  findActivity(tripId: string, activityId: string): Promise<Activity | null>;
  updateActivity(activity: Activity, data: UpdateActivityData): Promise<Activity>;
  /** Persists the activity banner handles and returns the updated activity. */
  updateActivityBanner(activity: Activity, data: ActivityBannerData): Promise<Activity>;
  /** Soft-deletes the activity (sets `deleted_at`). */
  softDeleteActivity(activityId: string): Promise<void>;
  addLink(tripId: string, data: NewLinkData): Promise<Link>;
  addGuest(tripId: string, data: NewGuestData): Promise<Participant>;
  findGuest(tripId: string, guestId: string): Promise<Participant | null>;
  saveGuest(guest: Participant): Promise<Participant>;

  // --- Activity links (Item 7c) ---
  /** Persists a link tagged to an activity (`activity_id` set). */
  addActivityLink(tripId: string, activityId: string, data: NewLinkData): Promise<Link>;
  /** Non-deleted links of an activity, oldest first. */
  findActivityLinks(activityId: string): Promise<Link[]>;
  /** A single link scoped to an activity; null when it belongs elsewhere. */
  findActivityLink(activityId: string, linkId: string): Promise<Link | null>;
  /** Soft-deletes a link (sets `deleted_at`). */
  softDeleteLink(linkId: string): Promise<void>;

  // --- Activity comments (Item 7b) ---
  addComment(activityId: string, data: NewActivityCommentData): Promise<ActivityComment>;
  /** Non-deleted comments of an activity, oldest first. */
  findComments(activityId: string): Promise<ActivityComment[]>;
  /** A single comment scoped to an activity; null when it belongs elsewhere. */
  findComment(activityId: string, commentId: string): Promise<ActivityComment | null>;
  /** Soft-deletes a comment (sets `deleted_at`). */
  softDeleteComment(commentId: string): Promise<void>;
}

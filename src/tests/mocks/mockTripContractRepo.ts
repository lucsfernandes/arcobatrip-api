import {
  ActivityBannerData,
  CreateTripData,
  ITripContractRepo,
  NewActivityCommentData,
  NewActivityData,
  NewGuestData,
  NewLinkData,
  TripCoverData,
  UpdateActivityData,
} from "../../application/usecases/trips/ITripContractRepo";
import { Trip } from "../../domain/entities/Trip/trip.entity";
import { Participant } from "../../domain/entities/Participant/participant.entity";
import { Activity } from "../../domain/entities/Activity/activity.entity";
import { Link } from "../../domain/entities/Link/link.entity";
import { ActivityComment } from "../../domain/entities/ActivityComment/activityComment.entity";

/**
 * In-memory {@link ITripContractRepo} for use-case unit tests. Only the methods
 * exercised by the activity edit/delete use cases carry real behavior; the
 * remaining contract methods throw so accidental use is caught immediately.
 */
export class MockTripContractRepo implements ITripContractRepo {
  private trips: Trip[] = [];
  private activities: Activity[] = [];
  private links: Link[] = [];
  private comments: ActivityComment[] = [];
  /** ids passed to softDeleteActivity, for assertions. */
  public softDeleted: string[] = [];
  /** ids passed to softDeleteLink, for assertions. */
  public softDeletedLinks: string[] = [];
  /** ids passed to softDeleteComment, for assertions. */
  public softDeletedComments: string[] = [];
  /** ids passed to softDeleteTrip, for assertions. */
  public softDeletedTrips: string[] = [];
  /** ids of guests passed to softDeleteGuest, for assertions. */
  public softDeletedGuests: string[] = [];

  seedTrip(trip: Trip): void {
    this.trips.push(trip);
  }

  seedActivity(activity: Activity): void {
    this.activities.push(activity);
  }

  seedLink(link: Link): void {
    this.links.push(link);
  }

  seedComment(comment: ActivityComment): void {
    this.comments.push(comment);
  }

  clear(): void {
    this.trips = [];
    this.activities = [];
    this.links = [];
    this.comments = [];
    this.softDeleted = [];
    this.softDeletedLinks = [];
    this.softDeletedComments = [];
    this.softDeletedTrips = [];
    this.softDeletedGuests = [];
    this.addedGuests = [];
  }

  async findTripById(id: string): Promise<Trip | null> {
    return this.trips.find((t) => t.id === id && !t.deletedAt) ?? null;
  }

  async softDeleteTrip(tripId: string): Promise<void> {
    this.softDeletedTrips.push(tripId);
    const trip = this.trips.find((t) => t.id === tripId);
    if (trip) trip.deletedAt = new Date();
  }

  async findActivity(tripId: string, activityId: string): Promise<Activity | null> {
    return (
      this.activities.find(
        (a) => a.id === activityId && a.tripId === tripId && !a.deletedAt
      ) ?? null
    );
  }

  async updateTripCover(tripId: string, data: TripCoverData): Promise<Trip> {
    const trip = this.trips.find((t) => t.id === tripId);
    if (!trip) throw new Error("trip not found in mock");
    trip.coverUrl = data.coverUrl;
    trip.coverPublicId = data.coverPublicId;
    return trip;
  }

  async updateActivity(activity: Activity, data: UpdateActivityData): Promise<Activity> {
    if (data.title !== undefined) activity.title = data.title;
    if (data.at !== undefined) activity.occursAt = new Date(data.at);
    if (data.status !== undefined) activity.status = data.status;
    if (data.description !== undefined) activity.description = data.description;
    return activity;
  }

  async updateActivityBanner(
    activity: Activity,
    data: ActivityBannerData
  ): Promise<Activity> {
    activity.bannerUrl = data.bannerUrl;
    activity.bannerPublicId = data.bannerPublicId;
    return activity;
  }

  async softDeleteActivity(activityId: string): Promise<void> {
    this.softDeleted.push(activityId);
    const activity = this.activities.find((a) => a.id === activityId);
    if (activity) activity.deletedAt = new Date();
  }

  async addActivity(tripId: string, data: NewActivityData): Promise<Activity> {
    const activity: Activity = {
      id: `activity-${this.activities.length + 1}`,
      title: data.title,
      occursAt: new Date(data.at),
      status: data.status,
      tripId,
      createdBy: data.createdBy ?? null,
      description: data.description ?? null,
    } as Activity;
    this.activities.push(activity);
    return activity;
  }

  // --- Unused by the activity edit/delete use cases ---
  async createTrip(_data: CreateTripData): Promise<Trip> {
    throw new Error("not implemented in mock");
  }
  async findTripsForUserEmail(_email: string): Promise<Trip[]> {
    throw new Error("not implemented in mock");
  }
  async addLink(_tripId: string, _data: NewLinkData): Promise<Link> {
    throw new Error("not implemented in mock");
  }

  // --- Activity links (Item 7c) ---
  async addActivityLink(
    tripId: string,
    activityId: string,
    data: NewLinkData
  ): Promise<Link> {
    const link = {
      id: `link-${this.links.length + 1}`,
      title: data.label,
      url: data.url,
      tripId,
      activityId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Link;
    this.links.push(link);
    return link;
  }

  async findActivityLinks(activityId: string): Promise<Link[]> {
    return this.links.filter((l) => l.activityId === activityId && !l.deletedAt);
  }

  async findActivityLink(activityId: string, linkId: string): Promise<Link | null> {
    return (
      this.links.find(
        (l) => l.id === linkId && l.activityId === activityId && !l.deletedAt
      ) ?? null
    );
  }

  async softDeleteLink(linkId: string): Promise<void> {
    this.softDeletedLinks.push(linkId);
    const link = this.links.find((l) => l.id === linkId);
    if (link) link.deletedAt = new Date();
  }

  // --- Activity comments (Item 7b) ---
  async addComment(
    activityId: string,
    data: NewActivityCommentData
  ): Promise<ActivityComment> {
    const comment = {
      id: `comment-${this.comments.length + 1}`,
      activityId,
      authorId: data.authorId,
      authorName: data.authorName,
      body: data.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ActivityComment;
    this.comments.push(comment);
    return comment;
  }

  async findComments(activityId: string): Promise<ActivityComment[]> {
    return this.comments.filter((c) => c.activityId === activityId && !c.deletedAt);
  }

  async findComment(
    activityId: string,
    commentId: string
  ): Promise<ActivityComment | null> {
    return (
      this.comments.find(
        (c) => c.id === commentId && c.activityId === activityId && !c.deletedAt
      ) ?? null
    );
  }

  async softDeleteComment(commentId: string): Promise<void> {
    this.softDeletedComments.push(commentId);
    const comment = this.comments.find((c) => c.id === commentId);
    if (comment) comment.deletedAt = new Date();
  }
  /** Guests recorded by addGuest, for assertions. */
  public addedGuests: { tripId: string; data: NewGuestData }[] = [];

  async addGuest(tripId: string, data: NewGuestData): Promise<Participant> {
    this.addedGuests.push({ tripId, data });
    return {
      id: `guest-${this.addedGuests.length}`,
      name: data.name,
      email: data.email,
      isOwner: false,
      isConfirmed: false,
      tripId,
    } as Participant;
  }
  async findGuest(tripId: string, guestId: string): Promise<Participant | null> {
    const trip = this.trips.find((t) => t.id === tripId);
    return (
      (trip?.participants ?? []).find((p) => p.id === guestId && !p.deletedAt) ?? null
    );
  }

  async softDeleteGuest(guest: Participant): Promise<void> {
    this.softDeletedGuests.push(guest.id);
    guest.deletedAt = new Date();
  }
  async saveGuest(_guest: Participant): Promise<Participant> {
    throw new Error("not implemented in mock");
  }
}

/** Convenience builders for the fixtures used across the activity tests. */
export const buildTrip = (overrides?: Partial<Trip>): Trip =>
  ({
    id: "trip-1",
    destination: "Florianópolis",
    startsAt: "2026-08-01",
    endsAt: "2026-08-10",
    isConfirmed: false,
    participants: [
      {
        id: "participant-owner",
        name: "Dono",
        email: "owner@test.com",
        isOwner: true,
        isConfirmed: true,
        tripId: "trip-1",
      } as Participant,
    ],
    activities: [],
    links: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Trip);

export const buildActivity = (overrides?: Partial<Activity>): Activity =>
  ({
    id: "activity-1",
    title: "Trilha",
    occursAt: new Date("2026-08-02T09:00:00.000Z"),
    status: "pending",
    tripId: "trip-1",
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Activity);

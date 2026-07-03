import {
  CreateTripData,
  ITripContractRepo,
  NewActivityData,
  NewGuestData,
  NewLinkData,
  UpdateActivityData,
} from "../../application/usecases/trips/ITripContractRepo";
import { Trip } from "../../domain/entities/Trip/trip.entity";
import { Participant } from "../../domain/entities/Participant/participant.entity";
import { Activity } from "../../domain/entities/Activity/activity.entity";
import { Link } from "../../domain/entities/Link/link.entity";

/**
 * In-memory {@link ITripContractRepo} for use-case unit tests. Only the methods
 * exercised by the activity edit/delete use cases carry real behavior; the
 * remaining contract methods throw so accidental use is caught immediately.
 */
export class MockTripContractRepo implements ITripContractRepo {
  private trips: Trip[] = [];
  private activities: Activity[] = [];
  /** ids passed to softDeleteActivity, for assertions. */
  public softDeleted: string[] = [];

  seedTrip(trip: Trip): void {
    this.trips.push(trip);
  }

  seedActivity(activity: Activity): void {
    this.activities.push(activity);
  }

  clear(): void {
    this.trips = [];
    this.activities = [];
    this.softDeleted = [];
  }

  async findTripById(id: string): Promise<Trip | null> {
    return this.trips.find((t) => t.id === id) ?? null;
  }

  async findActivity(tripId: string, activityId: string): Promise<Activity | null> {
    return (
      this.activities.find(
        (a) => a.id === activityId && a.tripId === tripId && !a.deletedAt
      ) ?? null
    );
  }

  async updateActivity(activity: Activity, data: UpdateActivityData): Promise<Activity> {
    if (data.title !== undefined) activity.title = data.title;
    if (data.at !== undefined) activity.occursAt = new Date(data.at);
    if (data.status !== undefined) activity.status = data.status;
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
  async addGuest(_tripId: string, _data: NewGuestData): Promise<Participant> {
    throw new Error("not implemented in mock");
  }
  async findGuest(_tripId: string, _guestId: string): Promise<Participant | null> {
    throw new Error("not implemented in mock");
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

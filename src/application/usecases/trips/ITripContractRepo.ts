import { Trip } from "../../../domain/entities/Trip/trip.entity";
import { Participant } from "../../../domain/entities/Participant/participant.entity";
import { Activity } from "../../../domain/entities/Activity/activity.entity";
import { Link } from "../../../domain/entities/Link/link.entity";

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
}

export interface NewLinkData {
  label: string;
  url: string;
}

export interface NewGuestData {
  name: string;
  email: string;
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
  addActivity(tripId: string, data: NewActivityData): Promise<Activity>;
  addLink(tripId: string, data: NewLinkData): Promise<Link>;
  addGuest(tripId: string, data: NewGuestData): Promise<Participant>;
  findGuest(tripId: string, guestId: string): Promise<Participant | null>;
  saveGuest(guest: Participant): Promise<Participant>;
}

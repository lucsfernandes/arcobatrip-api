import { EntityManager } from "typeorm";
import { ITrip } from "../../../domain/entities/Trip/ITrip";
import { ITransactionRepo } from "../../../infra/repositories/ITransactionRepo";
import { Trip } from "../../../domain/entities/Trip/trip.entity";
import { Participant } from "../../../domain/entities/Participant/participant.entity";
import { CreateParticipantPayload } from "../participants/IParticipantRepo";

export type CreateTripPayload = Omit<ITrip, "id" | "createdAt" | "updatedAt" | "participants"> & {
  participants: CreateParticipantPayload[];
};
export type TripPayload = Partial<Trip>;

export interface ITripRepo extends ITransactionRepo {
  create(payload: CreateTripPayload): Promise<ITrip | null>;
  // createTripWithParticipants(tripData: TripPayload, participantsData: Partial<Participant>[]): Promise<ITrip | null>;
}
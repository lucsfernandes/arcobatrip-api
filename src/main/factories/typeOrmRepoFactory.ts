import { IParticipantRepo } from "../../application/usecases/participants/IParticipantRepo";
import { Participant } from "../../domain/entities/Participant/participant.entity";
import { Trip } from "../../domain/entities/Trip/trip.entity";
import AppDataSource from "../../infra/db/ormconfig";
import { ParticipantRepo } from "../../infra/repositories/ParticipantRepo";
import { TripRepo } from "../../infra/repositories/TripRepo";
import { UserRepo } from "../../infra/repositories/UserRepo";

const connector = AppDataSource;

connector.initialize();

const participantRepo = new ParticipantRepo(connector);
const tripRepo = new TripRepo(connector);
const userRepo = new UserRepo(connector);

export {
  participantRepo,
  tripRepo,
  userRepo,
}
import { DataSource, EntityManager, Repository } from "typeorm";
import { CreateTripPayload, ITripRepo } from "../../application/usecases/trips/ITripRepo";
import { ITrip } from "../../domain/entities/Trip/ITrip";
import { Trip } from "../../domain/entities/Trip/trip.entity";
import { Participant } from "../../domain/entities/Participant/participant.entity";
import { TripMap } from "../db/mappers/TripMap";

export class TripRepo implements ITripRepo {
  private tripRepository: Repository<Trip>;
  private participantRepo: Repository<Participant>;

  constructor(private readonly dataSource: DataSource) {
    this.tripRepository = dataSource.getRepository(Trip);
    this.participantRepo = dataSource.getRepository(Participant);
  }
  async create(payload: CreateTripPayload): Promise<ITrip | null> {
    const { destination, startsAt, endsAt, participants } = payload;
    let savedTrip: ITrip | null = null;
    await this.executeTransaction(async (manager) => {
      const trip = this.tripRepository.create({
        destination,
        startsAt,
        endsAt,
        participants
      });

      const result = await manager.save(trip);

      savedTrip = {
        id: result.id,
        destination: result.destination,
        startsAt: result.startsAt,
        endsAt: result.endsAt,
        participants: result.participants.map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          isConfirmed: p.isConfirmed,
          isOwner: p.isOwner,
          tripId: p.tripId,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        }))
      };
    });

    if (!savedTrip) {
      return null;
    }

    return TripMap.toDomain(savedTrip);
  }

  // async createTripWithParticipants(
  //   tripData: Partial<Trip>,
  //   participantsData: Partial<Participant>[]
  // ): Promise<ITrip | null> {
  //   return await this.executeTransaction(async manager => {
  //     let participants: Participant[] = [];
  //     console.log(participantsData);
  //     participantsData.map((data) => {
  //       participants.push(this.participantRepo.create(data))
  //     });
  //     const savedParticipants = await manager.save(Participant, participants);

  //     const tripEntity = this.tripRepository.create({
  //       ...tripData,
  //       participants: savedParticipants
  //     });
  //     const savedTrip = await manager.save(Trip, tripEntity);

  //     return TripMap.toDomain(savedTrip);
  //   })
  // }

  async executeTransaction<T>(
    action: (manager: EntityManager) => Promise<T>
  ): Promise<T> {
    return await this.dataSource.transaction(action);
  }
  
}
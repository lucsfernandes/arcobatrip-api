import { DataSource, EntityManager, Repository } from "typeorm";
import { CreateParticipantPayload, IParticipantRepo, UpdateParticipantPayload } from "../../application/usecases/participants/IParticipantRepo";
import { IParticipant } from "../../domain/entities/Participant/IParticipant";
import { Participant } from "../../domain/entities/Participant/participant.entity";
import { ParticipantMap } from "../db/mappers/ParticipantMap";

export class ParticipantRepo implements IParticipantRepo {
  private participantRepository: Repository<Participant>;

  constructor(private readonly dataSource: DataSource) {
    this.participantRepository = dataSource.getRepository(Participant);
  }
  async findOneByEmail(email: string): Promise<IParticipant | null> {
    const participant = await this.participantRepository.findOne({
      where: {
        email
      }
    });

    if (!participant) {
      return null;
    }

    return ParticipantMap.toDomain(participant);
  }
  async create(payload: CreateParticipantPayload): Promise<IParticipant | null> {
    const result = await this.participantRepository.create(payload);

    if (!result) {
      return null;
    }

    return ParticipantMap.toDomain(result);
  }
  async update(id: string, payload: UpdateParticipantPayload): Promise<IParticipant | null> {
    const participant = await this.participantRepository.findOne({
      where: {
        id
      }
    });

    if (!participant) {
      return null;
    }

    const result = await this.participantRepository.update(id, payload);

    if (!result) {
      return null;
    }

    return ParticipantMap.toDomain(result.raw);
  }

  async executeTransaction<T>(action: (manager: EntityManager) => Promise<T>): Promise<T> {
    return await this.dataSource.transaction(action);
  }
}
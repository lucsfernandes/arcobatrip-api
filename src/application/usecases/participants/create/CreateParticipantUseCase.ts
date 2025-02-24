import { ParticipantMap } from "../../../../infra/db/mappers/ParticipantMap";
import { UseCaseError } from "../../../errors/UseCaseError";
import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { IParticipantRepo } from "../IParticipantRepo";
import { CreateParticipantRequestDTO } from "./CreateParticipantRequestDTO";
import { CreateParticipantResponseDTO } from './CreateParticipantResponseDTO';

export class CreatParticipantUseCase implements IUseCase<CreateParticipantRequestDTO, CreateParticipantResponseDTO> {
  constructor(
    private repo: IParticipantRepo
  ) { }
  
  async execute(request: CreateParticipantRequestDTO): Promise<Result<CreateParticipantResponseDTO>> {
    const participant = {
      name: request.name,
      email: request.email,
      isOwner: request.isOwner ?? false,
      isConfirmed: request.isConfirmed ?? false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.repo.create(participant);

    if (!result) {
      return Result.fail(new UseCaseError('Failed to create participant.'));
    }

    return Result.ok(result);
  }
}
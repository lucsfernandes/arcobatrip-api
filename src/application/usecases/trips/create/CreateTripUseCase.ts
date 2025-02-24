import { DataSource, Repository } from "typeorm";
import { dayjs } from "../../../../presentation/utils/dayjs";
import { IUseCase } from "../../IUseCase";
import { CreateTripPayload, ITripRepo } from "../ITripRepo";
import { CreateTripRequestDTO } from "./CreateTripRequestDTO";
import { CreateTripResponseDTO } from "./CreateTripResponseDTO";
import { Result } from "../../Result";
import { CreateParticipantPayload, IParticipantRepo } from "../../participants/IParticipantRepo";
import { IParticipant } from "../../../../domain/entities/Participant/IParticipant";
import { Participant } from "../../../../domain/entities/Participant/participant.entity";
import { Trip } from "../../../../domain/entities/Trip/trip.entity";
import { ITrip } from "../../../../domain/entities/Trip/ITrip";
import { CreateParticipantRequestDTO } from "../../participants/create/CreateParticipantRequestDTO";
import { UseCaseError } from "../../../errors/UseCaseError";

export class CreateTripUseCase implements IUseCase<CreateTripRequestDTO, CreateTripResponseDTO> {
  constructor(
    private repo: ITripRepo,
    private participantRepo: IParticipantRepo
    // private mailService: IMailService
  ) {}

  async execute(request: CreateTripRequestDTO): Promise<Result<CreateTripResponseDTO>> {
    const {
      destination,
      startsAt,
      endsAt,
      ownerName,
      ownerEmail,
      participantToInvite
    } = request;

    if (dayjs(startsAt).isBefore(new Date())) {
      throw new Error("Invalid trip start date");
    }
    if (dayjs(endsAt).isBefore(startsAt)) {
      throw new Error("Invalid trip end date");
    }

    try {
      const isOwner: CreateParticipantPayload = {
        name: ownerName,
        email: ownerEmail,
        isConfirmed: true,
        isOwner: true
      };

      const participants: CreateParticipantPayload[] = [
        isOwner,
        ...participantToInvite.map(participant => ({
          name: participant.name,
          email: participant.email,
          isConfirmed: false,
          isOwner: false
        }))
      ];

      const trip = {
        destination,
        startsAt: dayjs(startsAt).toISOString(),
        endsAt: dayjs(endsAt).toISOString(),
        participants
      }

      const savedTrip = await this.repo.create(trip);

      if (!savedTrip) return Result.fail(new UseCaseError("Não foi possível salvar os registros"));

      return Result.ok(savedTrip);
    } catch (error: any) {
      return Result.fail({
        statusCode: 500,
        errors: JSON.stringify(error.message)
      });
    }
  }
}

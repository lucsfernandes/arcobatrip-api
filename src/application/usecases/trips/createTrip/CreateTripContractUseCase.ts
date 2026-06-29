import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { IUserRepo } from "../../auth/IUserRepo";
import { ITripContractRepo, NewParticipantData } from "../ITripContractRepo";
import { NotificationEmitter } from "../../../services/NotificationEmitter";
import { CreateTripContractRequestDTO } from "./CreateTripContractRequestDTO";
import { CreateTripContractResponseDTO } from "./CreateTripContractResponseDTO";
import { TripContractMap } from "../../../../infra/db/mappers/TripContractMap";
import { localPartOf } from "../../../utils/email";

/**
 * Contract: `POST /trips`. The authenticated user becomes the host
 * (owner + confirmed); each invited email becomes a pending guest.
 */
export class CreateTripContractUseCase
  implements IUseCase<CreateTripContractRequestDTO, CreateTripContractResponseDTO>
{
  constructor(
    private readonly tripRepo: ITripContractRepo,
    private readonly userRepo: IUserRepo,
    private readonly emitter: NotificationEmitter
  ) {}

  async execute(
    request: CreateTripContractRequestDTO
  ): Promise<Result<CreateTripContractResponseDTO>> {
    const { userId, destination, startDate, endDate, guestEmails } = request;

    const host = await this.userRepo.findById(userId);
    if (!host) {
      return Result.fail(AppError.unauthorized("Usuário autenticado não encontrado"));
    }

    const invitedEmails = guestEmails.filter(
      (email) => email && email !== host.email
    );

    const participants: NewParticipantData[] = [
      {
        name: host.fullName,
        email: host.email,
        isOwner: true,
        isConfirmed: true,
      },
      ...invitedEmails.map((email) => ({
        name: localPartOf(email),
        email,
        isOwner: false,
        isConfirmed: false,
      })),
    ];

    const trip = await this.tripRepo.createTrip({
      destination,
      startDate,
      endDate,
      participants,
    });

    // Notify any invited emails that already belong to a registered user.
    for (const email of invitedEmails) {
      await this.emitter.invite(email, trip.id, trip.destination);
    }

    return Result.ok(TripContractMap.toContract(trip));
  }
}

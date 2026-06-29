import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { NotificationEmitter } from "../../../services/NotificationEmitter";
import { AddGuestRequestDTO } from "./AddGuestRequestDTO";
import { AddGuestResponseDTO } from "./AddGuestResponseDTO";
import { GuestContractMap } from "../../../../infra/db/mappers/GuestContractMap";
import { localPartOf } from "../../../utils/email";

/**
 * Contract: `POST /trips/{id}/guests`. Invites a guest (status pending) by email
 * and, if a registered user owns that email, emits a `convite` notification.
 */
export class AddGuestUseCase implements IUseCase<AddGuestRequestDTO, AddGuestResponseDTO> {
  constructor(
    private readonly tripRepo: ITripContractRepo,
    private readonly emitter: NotificationEmitter
  ) {}

  async execute(request: AddGuestRequestDTO): Promise<Result<AddGuestResponseDTO>> {
    const trip = await this.tripRepo.findTripById(request.tripId);
    if (!trip) {
      return Result.fail(AppError.notFound("Viagem não encontrada"));
    }

    const guest = await this.tripRepo.addGuest(request.tripId, {
      name: localPartOf(request.email),
      email: request.email,
    });

    await this.emitter.invite(request.email, trip.id, trip.destination);

    return Result.ok(GuestContractMap.toContract(guest));
  }
}

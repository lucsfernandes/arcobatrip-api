import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { NotificationEmitter } from "../../../services/NotificationEmitter";
import { SetGuestStatusRequestDTO } from "./SetGuestStatusRequestDTO";
import { SetGuestStatusResponseDTO } from "./SetGuestStatusResponseDTO";
import { GuestContractMap } from "../../../../infra/db/mappers/GuestContractMap";

/**
 * Contract: `PATCH /trips/{id}/guests/{guestId}`. Updates the guest status.
 * On confirmation, emits a `confirmacao` notification to the trip host.
 *
 * Status mapping:
 * - `host`      → isOwner=true,  isConfirmed=true
 * - `confirmed` → isOwner=false, isConfirmed=true
 * - `pending`   → isOwner=false, isConfirmed=false
 */
export class SetGuestStatusUseCase
  implements IUseCase<SetGuestStatusRequestDTO, SetGuestStatusResponseDTO>
{
  constructor(
    private readonly tripRepo: ITripContractRepo,
    private readonly emitter: NotificationEmitter
  ) {}

  async execute(request: SetGuestStatusRequestDTO): Promise<Result<SetGuestStatusResponseDTO>> {
    const trip = await this.tripRepo.findTripById(request.tripId);
    if (!trip) {
      return Result.fail(AppError.notFound("Viagem não encontrada"));
    }

    const guest = await this.tripRepo.findGuest(request.tripId, request.guestId);
    if (!guest) {
      return Result.fail(AppError.notFound("Convidado não encontrado"));
    }

    switch (request.status) {
      case "host":
        guest.isOwner = true;
        guest.isConfirmed = true;
        break;
      case "confirmed":
        guest.isOwner = false;
        guest.isConfirmed = true;
        break;
      case "pending":
        guest.isOwner = false;
        guest.isConfirmed = false;
        break;
    }

    const saved = await this.tripRepo.saveGuest(guest);

    if (request.status === "confirmed") {
      const host = (trip.participants ?? []).find((p) => p.isOwner);
      if (host) {
        await this.emitter.confirmation(host.email, saved.name, trip.id, trip.destination);
      }
    }

    return Result.ok(GuestContractMap.toContract(saved));
  }
}

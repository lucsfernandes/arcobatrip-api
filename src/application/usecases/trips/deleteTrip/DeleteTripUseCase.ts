import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { isTripOwner } from "../tripAuthorization";
import { DeleteTripRequestDTO } from "./DeleteTripRequestDTO";
import { DeleteTripResponseDTO } from "./DeleteTripResponseDTO";

/**
 * Contract: `DELETE /trips/{id}` (soft delete).
 *
 * - 404 when the trip is missing (or already deleted).
 * - 403 when the caller is not the trip owner.
 * - 204 otherwise: the trip disappears for every participant, together with
 *   the notifications about it. Rows are only marked deleted, never erased.
 */
export class DeleteTripUseCase
  implements IUseCase<DeleteTripRequestDTO, DeleteTripResponseDTO>
{
  constructor(private readonly tripRepo: ITripContractRepo) {}

  async execute(request: DeleteTripRequestDTO): Promise<Result<DeleteTripResponseDTO>> {
    const trip = await this.tripRepo.findTripById(request.tripId);
    if (!trip) {
      return Result.fail(AppError.notFound("Viagem não encontrada"));
    }

    if (!isTripOwner(trip, request.userEmail)) {
      return Result.fail(
        AppError.forbidden("Só quem criou a viagem pode excluí-la")
      );
    }

    await this.tripRepo.softDeleteTrip(trip.id);
    return Result.ok();
  }
}

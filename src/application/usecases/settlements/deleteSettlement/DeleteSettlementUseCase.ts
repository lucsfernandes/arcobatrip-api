import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../../trips/ITripContractRepo";
import { isTripParticipant } from "../../trips/tripAuthorization";
import { ISettledPaymentRepo } from "../ISettledPaymentRepo";
import { DeleteSettlementRequestDTO } from "./DeleteSettlementRequestDTO";

/**
 * Contract: `DELETE /trips/{id}/settlements/{settlementId}` (soft delete).
 *
 * - 404 when the trip is missing, or the payment does not exist / belongs to
 *   another trip.
 * - 403 when the caller is not a participant of the trip.
 *
 * Any participant may undo a recorded payment.
 */
export class DeleteSettlementUseCase
  implements IUseCase<DeleteSettlementRequestDTO, void>
{
  constructor(
    private readonly tripRepo: ITripContractRepo,
    private readonly settledPaymentRepo: ISettledPaymentRepo
  ) {}

  async execute(request: DeleteSettlementRequestDTO): Promise<Result<void>> {
    const trip = await this.tripRepo.findTripById(request.tripId);
    if (!trip) {
      return Result.fail(AppError.notFound("Viagem não encontrada"));
    }

    if (!isTripParticipant(trip, request.userEmail)) {
      return Result.fail(
        AppError.forbidden(
          "Apenas participantes da viagem podem desfazer pagamentos"
        )
      );
    }

    const payment = await this.settledPaymentRepo.findByIdForTrip(
      request.tripId,
      request.settlementId
    );
    if (!payment) {
      return Result.fail(AppError.notFound("Pagamento não encontrado"));
    }

    await this.settledPaymentRepo.softDelete(payment.id);
    return Result.ok();
  }
}

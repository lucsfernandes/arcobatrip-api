import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ErrorDetail } from "../../../errors/UseCaseError";
import { ITripContractRepo } from "../../trips/ITripContractRepo";
import { isTripParticipant } from "../../trips/tripAuthorization";
import { ISettledPaymentRepo } from "../ISettledPaymentRepo";
import { CreateSettlementRequestDTO } from "./CreateSettlementRequestDTO";
import { CreateSettlementResponseDTO } from "./CreateSettlementResponseDTO";
import { SettledPaymentContractMap } from "../../../../infra/db/mappers/SettledPaymentContractMap";

/**
 * Contract: `POST /trips/{id}/settlements`.
 *
 * - 404 when the trip is missing.
 * - 403 when the caller is not a participant of the trip.
 * - 400 (validation_error) when `from`/`to` are not participants or `amount`
 *   is not > 0.
 *
 * Any participant may record a payment. Returns the persisted
 * {@link SettledPaymentContract} (`{ id, from, to, amount }`).
 */
export class CreateSettlementUseCase
  implements IUseCase<CreateSettlementRequestDTO, CreateSettlementResponseDTO>
{
  constructor(
    private readonly tripRepo: ITripContractRepo,
    private readonly settledPaymentRepo: ISettledPaymentRepo
  ) {}

  async execute(
    request: CreateSettlementRequestDTO
  ): Promise<Result<CreateSettlementResponseDTO>> {
    const trip = await this.tripRepo.findTripById(request.tripId);
    if (!trip) {
      return Result.fail(AppError.notFound("Viagem não encontrada"));
    }

    if (!isTripParticipant(trip, request.userEmail)) {
      return Result.fail(
        AppError.forbidden(
          "Apenas participantes da viagem podem registrar pagamentos"
        )
      );
    }

    const participantIds = new Set((trip.participants ?? []).map((p) => p.id));
    const details: ErrorDetail[] = [];

    if (!participantIds.has(request.from)) {
      details.push({
        path: "from",
        message: "from deve ser um participante da viagem",
      });
    }
    if (!participantIds.has(request.to)) {
      details.push({
        path: "to",
        message: "to deve ser um participante da viagem",
      });
    }
    if (request.from && request.to && request.from === request.to) {
      details.push({
        path: "to",
        message: "from e to devem ser participantes distintos",
      });
    }
    if (!(request.amount > 0)) {
      details.push({
        path: "amount",
        message: "amount deve ser maior que zero",
      });
    }

    if (details.length > 0) {
      return Result.fail(
        AppError.validation("Pagamento inválido", details)
      );
    }

    const payment = await this.settledPaymentRepo.create({
      tripId: request.tripId,
      fromId: request.from,
      toId: request.to,
      amount: request.amount,
    });

    return Result.ok(SettledPaymentContractMap.toContract(payment));
  }
}

import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ErrorDetail } from "../../../errors/UseCaseError";
import { ITripContractRepo } from "../../trips/ITripContractRepo";
import { IExpenseRepo } from "../IExpenseRepo";
import { ISettledPaymentRepo } from "../../settlements/ISettledPaymentRepo";
import { CreateExpenseRequestDTO } from "./CreateExpenseRequestDTO";
import { CreateExpenseResponseDTO } from "./CreateExpenseResponseDTO";
import { ExpenseContractMap } from "../../../../infra/db/mappers/ExpenseContractMap";
import { SettledPaymentContractMap } from "../../../../infra/db/mappers/SettledPaymentContractMap";
import { pendingSettlements } from "../../../services/settlements";

/**
 * Contract: `POST /trips/{id}/expenses`. Validates that `paidById` and every
 * `splitBetween` id are participants of the trip, persists the expense, then
 * returns the full expense list plus recomputed settlements.
 */
export class CreateExpenseUseCase
  implements IUseCase<CreateExpenseRequestDTO, CreateExpenseResponseDTO>
{
  constructor(
    private readonly tripRepo: ITripContractRepo,
    private readonly expenseRepo: IExpenseRepo,
    private readonly settledPaymentRepo: ISettledPaymentRepo
  ) {}

  async execute(request: CreateExpenseRequestDTO): Promise<Result<CreateExpenseResponseDTO>> {
    const trip = await this.tripRepo.findTripById(request.tripId);
    if (!trip) {
      return Result.fail(AppError.notFound("Viagem não encontrada"));
    }

    const participantIds = new Set((trip.participants ?? []).map((p) => p.id));
    const details: ErrorDetail[] = [];

    if (!participantIds.has(request.paidById)) {
      details.push({
        path: "paidById",
        message: "paidById deve ser um participante da viagem",
      });
    }
    request.splitBetween.forEach((id, index) => {
      if (!participantIds.has(id)) {
        details.push({
          path: `splitBetween.${index}`,
          message: `"${id}" não é um participante da viagem`,
        });
      }
    });

    if (details.length > 0) {
      return Result.fail(
        AppError.validation("Participantes inválidos para a despesa", details)
      );
    }

    // When tagged to an activity, it MUST belong to this trip. The tag is
    // metadata only — the expense still counts in the trip-wide settlement.
    if (request.activityId) {
      const activity = await this.tripRepo.findActivity(
        request.tripId,
        request.activityId
      );
      if (!activity) {
        return Result.fail(
          AppError.validation("Atividade inválida para a despesa", [
            {
              path: "activityId",
              message: "A atividade informada não pertence a esta viagem",
            },
          ])
        );
      }
    }

    await this.expenseRepo.create({
      tripId: request.tripId,
      title: request.title,
      amount: request.amount,
      category: request.category,
      paidById: request.paidById,
      splitBetween: request.splitBetween,
      activityId: request.activityId ?? null,
    });

    const expenses = (await this.expenseRepo.findByTrip(request.tripId)).map(
      ExpenseContractMap.toContract
    );
    const settledPayments = (
      await this.settledPaymentRepo.findByTrip(request.tripId)
    ).map(SettledPaymentContractMap.toContract);
    const memberIds = (trip.participants ?? []).map((p) => p.id);
    // Pending settlements already discount the recorded payments.
    const settlements = pendingSettlements(expenses, memberIds, settledPayments);

    return Result.ok({ expenses, settlements, settledPayments });
  }
}

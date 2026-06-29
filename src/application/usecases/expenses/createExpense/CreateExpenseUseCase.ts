import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ErrorDetail } from "../../../errors/UseCaseError";
import { ITripContractRepo } from "../../trips/ITripContractRepo";
import { IExpenseRepo } from "../IExpenseRepo";
import { CreateExpenseRequestDTO } from "./CreateExpenseRequestDTO";
import { CreateExpenseResponseDTO } from "./CreateExpenseResponseDTO";
import { ExpenseContractMap } from "../../../../infra/db/mappers/ExpenseContractMap";
import { settlementsFor } from "../../../services/settlements";

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
    private readonly expenseRepo: IExpenseRepo
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

    await this.expenseRepo.create({
      tripId: request.tripId,
      title: request.title,
      amount: request.amount,
      category: request.category,
      paidById: request.paidById,
      splitBetween: request.splitBetween,
    });

    const expenses = (await this.expenseRepo.findByTrip(request.tripId)).map(
      ExpenseContractMap.toContract
    );
    const memberIds = (trip.participants ?? []).map((p) => p.id);
    const settlements = settlementsFor(expenses, memberIds);

    return Result.ok({ expenses, settlements });
  }
}

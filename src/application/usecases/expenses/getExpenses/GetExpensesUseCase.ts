import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../../trips/ITripContractRepo";
import { IExpenseRepo } from "../IExpenseRepo";
import { ISettledPaymentRepo } from "../../settlements/ISettledPaymentRepo";
import { GetExpensesRequestDTO } from "./GetExpensesRequestDTO";
import { GetExpensesResponseDTO } from "./GetExpensesResponseDTO";
import { ExpenseContractMap } from "../../../../infra/db/mappers/ExpenseContractMap";
import { SettledPaymentContractMap } from "../../../../infra/db/mappers/SettledPaymentContractMap";
import { pendingSettlements } from "../../../services/settlements";

/** Contract: `GET /trips/{id}/expenses`. 404 when the trip is missing. */
export class GetExpensesUseCase implements IUseCase<GetExpensesRequestDTO, GetExpensesResponseDTO> {
  constructor(
    private readonly tripRepo: ITripContractRepo,
    private readonly expenseRepo: IExpenseRepo,
    private readonly settledPaymentRepo: ISettledPaymentRepo
  ) {}

  async execute(request: GetExpensesRequestDTO): Promise<Result<GetExpensesResponseDTO>> {
    const trip = await this.tripRepo.findTripById(request.tripId);
    if (!trip) {
      return Result.fail(AppError.notFound("Viagem não encontrada"));
    }

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

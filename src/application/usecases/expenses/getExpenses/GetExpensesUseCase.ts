import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../../trips/ITripContractRepo";
import { IExpenseRepo } from "../IExpenseRepo";
import { GetExpensesRequestDTO } from "./GetExpensesRequestDTO";
import { GetExpensesResponseDTO } from "./GetExpensesResponseDTO";
import { ExpenseContractMap } from "../../../../infra/db/mappers/ExpenseContractMap";
import { settlementsFor } from "../../../services/settlements";

/** Contract: `GET /trips/{id}/expenses`. 404 when the trip is missing. */
export class GetExpensesUseCase implements IUseCase<GetExpensesRequestDTO, GetExpensesResponseDTO> {
  constructor(
    private readonly tripRepo: ITripContractRepo,
    private readonly expenseRepo: IExpenseRepo
  ) {}

  async execute(request: GetExpensesRequestDTO): Promise<Result<GetExpensesResponseDTO>> {
    const trip = await this.tripRepo.findTripById(request.tripId);
    if (!trip) {
      return Result.fail(AppError.notFound("Viagem não encontrada"));
    }

    const expenses = (await this.expenseRepo.findByTrip(request.tripId)).map(
      ExpenseContractMap.toContract
    );
    const memberIds = (trip.participants ?? []).map((p) => p.id);
    const settlements = settlementsFor(expenses, memberIds);

    return Result.ok({ expenses, settlements });
  }
}

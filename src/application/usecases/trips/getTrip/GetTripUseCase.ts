import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { GetTripRequestDTO } from "./GetTripRequestDTO";
import { GetTripResponseDTO } from "./GetTripResponseDTO";
import { TripContractMap } from "../../../../infra/db/mappers/TripContractMap";

/** Contract: `GET /trips/{id}`. 404 when the trip does not exist. */
export class GetTripUseCase implements IUseCase<GetTripRequestDTO, GetTripResponseDTO> {
  constructor(private readonly tripRepo: ITripContractRepo) {}

  async execute(request: GetTripRequestDTO): Promise<Result<GetTripResponseDTO>> {
    const trip = await this.tripRepo.findTripById(request.tripId);
    if (!trip) {
      return Result.fail(AppError.notFound("Viagem não encontrada"));
    }
    return Result.ok(TripContractMap.toContract(trip));
  }
}

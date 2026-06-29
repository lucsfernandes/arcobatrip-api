import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { ITripContractRepo } from "../ITripContractRepo";
import { ListTripsRequestDTO } from "./ListTripsRequestDTO";
import { ListTripsResponseDTO } from "./ListTripsResponseDTO";
import { TripContractMap } from "../../../../infra/db/mappers/TripContractMap";

/** Contract: `GET /trips`. Trips the current user hosts or is invited to, newest first. */
export class ListTripsUseCase implements IUseCase<ListTripsRequestDTO, ListTripsResponseDTO> {
  constructor(private readonly tripRepo: ITripContractRepo) {}

  async execute(request: ListTripsRequestDTO): Promise<Result<ListTripsResponseDTO>> {
    const trips = await this.tripRepo.findTripsForUserEmail(request.email);
    return Result.ok(trips.map(TripContractMap.toContract));
  }
}

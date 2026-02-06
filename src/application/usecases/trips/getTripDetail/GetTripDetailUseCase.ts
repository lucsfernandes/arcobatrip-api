import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { ITripRepo } from "../ITripRepo";
import { GetTripDetailRequestDTO } from "./GetTripDetailRequestDTO";
import { GetTripDetailResponseDTO } from "./GetTripDetailResponseDTO";

export class GetTripDetailUseCase implements IUseCase<GetTripDetailRequestDTO, GetTripDetailResponseDTO> {
  constructor(private repo: ITripRepo) {}

  async execute(request: GetTripDetailRequestDTO): Promise<Result<GetTripDetailResponseDTO>> {
    const { tripId } = request;

    const tripDetail = await this.repo.getTripDetail(tripId);
    if (!tripDetail) {
      // throw new Error("Trip not found");
      return Result.fail({ statusCode: 404, errors: "Trip not found" });
    }

    return Result.ok(tripDetail);
  }
}

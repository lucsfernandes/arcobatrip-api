import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { NotificationEmitter } from "../../../services/NotificationEmitter";
import { AddActivityRequestDTO } from "./AddActivityRequestDTO";
import { AddActivityResponseDTO } from "./AddActivityResponseDTO";
import { ActivityContractMap } from "../../../../infra/db/mappers/ActivityContractMap";

/** Contract: `POST /trips/{id}/activities`. 404 when the trip is missing. */
export class AddActivityUseCase implements IUseCase<AddActivityRequestDTO, AddActivityResponseDTO> {
  constructor(
    private readonly tripRepo: ITripContractRepo,
    private readonly emitter: NotificationEmitter
  ) {}

  async execute(request: AddActivityRequestDTO): Promise<Result<AddActivityResponseDTO>> {
    const trip = await this.tripRepo.findTripById(request.tripId);
    if (!trip) {
      return Result.fail(AppError.notFound("Viagem não encontrada"));
    }

    const activity = await this.tripRepo.addActivity(request.tripId, {
      title: request.title,
      at: request.at,
      status: request.status,
    });

    await this.emitter.activityAdded(
      (trip.participants ?? []).map((p) => p.email),
      request.title,
      trip.id,
      trip.destination
    );

    return Result.ok(ActivityContractMap.toContract(activity));
  }
}

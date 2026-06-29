import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { NotificationEmitter } from "../../../services/NotificationEmitter";
import { AddLinkRequestDTO } from "./AddLinkRequestDTO";
import { AddLinkResponseDTO } from "./AddLinkResponseDTO";
import { TripLinkContractMap } from "../../../../infra/db/mappers/TripLinkContractMap";

/** Contract: `POST /trips/{id}/links`. 404 when the trip is missing. */
export class AddLinkUseCase implements IUseCase<AddLinkRequestDTO, AddLinkResponseDTO> {
  constructor(
    private readonly tripRepo: ITripContractRepo,
    private readonly emitter: NotificationEmitter
  ) {}

  async execute(request: AddLinkRequestDTO): Promise<Result<AddLinkResponseDTO>> {
    const trip = await this.tripRepo.findTripById(request.tripId);
    if (!trip) {
      return Result.fail(AppError.notFound("Viagem não encontrada"));
    }

    const link = await this.tripRepo.addLink(request.tripId, {
      label: request.label,
      url: request.url,
    });

    await this.emitter.linkAdded(
      (trip.participants ?? []).map((p) => p.email),
      request.label,
      trip.id,
      trip.destination
    );

    return Result.ok(TripLinkContractMap.toContract(link));
  }
}

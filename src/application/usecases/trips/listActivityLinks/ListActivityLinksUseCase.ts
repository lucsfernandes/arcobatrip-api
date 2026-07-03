import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { isTripParticipant } from "../tripAuthorization";
import { TripLinkContractMap } from "../../../../infra/db/mappers/TripLinkContractMap";
import { ListActivityLinksRequestDTO } from "./ListActivityLinksRequestDTO";
import { ListActivityLinksResponseDTO } from "./ListActivityLinksResponseDTO";

/**
 * Contract: `GET /trips/{id}/activities/{activityId}/links`. Any participant may
 * read. Returns non-deleted links of the activity, oldest first.
 *
 * - 404 when the trip/activity is missing or the activity belongs to another trip.
 * - 403 when the caller is not a participant of the trip.
 */
export class ListActivityLinksUseCase
  implements IUseCase<ListActivityLinksRequestDTO, ListActivityLinksResponseDTO>
{
  constructor(private readonly tripRepo: ITripContractRepo) {}

  async execute(
    request: ListActivityLinksRequestDTO
  ): Promise<Result<ListActivityLinksResponseDTO>> {
    const trip = await this.tripRepo.findTripById(request.tripId);
    if (!trip) {
      return Result.fail(AppError.notFound("Viagem não encontrada"));
    }

    const activity = await this.tripRepo.findActivity(request.tripId, request.activityId);
    if (!activity) {
      return Result.fail(AppError.notFound("Atividade não encontrada"));
    }

    if (!isTripParticipant(trip, request.userEmail)) {
      return Result.fail(
        AppError.forbidden("Apenas participantes da viagem podem ver os links")
      );
    }

    const links = await this.tripRepo.findActivityLinks(request.activityId);
    return Result.ok(links.map(TripLinkContractMap.toContract));
  }
}

import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { IStorageService } from "../../../services/storage/IStorageService";
import { isTripOwner } from "../tripAuthorization";
import logger from "../../../../main/logger";
import { DeleteTripBannerRequestDTO } from "./DeleteTripBannerRequestDTO";

/**
 * Contract: `DELETE /trips/{id}/banner`. Only the trip owner may remove the
 * banner. Best-effort deletes the stored asset and clears the `cover_url` /
 * `cover_public_id` columns. Responds 204 (no body) at the controller.
 */
export class DeleteTripBannerUseCase
  implements IUseCase<DeleteTripBannerRequestDTO, void>
{
  constructor(
    private readonly tripRepo: ITripContractRepo,
    private readonly storageService: IStorageService
  ) {}

  async execute(request: DeleteTripBannerRequestDTO): Promise<Result<void>> {
    const { tripId, userEmail } = request;

    try {
      const trip = await this.tripRepo.findTripById(tripId);
      if (!trip) {
        return Result.fail(AppError.notFound("Viagem não encontrada"));
      }

      if (!isTripOwner(trip, userEmail)) {
        return Result.fail(
          AppError.forbidden("Apenas o dono da viagem pode remover o banner")
        );
      }

      if (trip.coverPublicId) {
        try {
          await this.storageService.deleteImage(trip.coverPublicId);
        } catch (error) {
          logger.error("[DeleteTripBannerUseCase] falha ao remover banner", error);
        }
      }

      await this.tripRepo.updateTripCover(tripId, {
        coverUrl: null,
        coverPublicId: null,
      });

      return Result.ok();
    } catch (error) {
      return Result.fail(AppError.internal((error as Error).message));
    }
  }
}

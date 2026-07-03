import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { IStorageService } from "../../../services/storage/IStorageService";
import { canManageActivity } from "../activityAuthorization";
import logger from "../../../../main/logger";
import { DeleteActivityBannerRequestDTO } from "./DeleteActivityBannerRequestDTO";

/**
 * Contract: `DELETE /trips/{id}/activities/{activityId}/banner`. Authorized to
 * the activity creator OR the trip owner. Best-effort deletes the stored asset
 * and clears the banner columns. Responds 204 (no body) at the controller.
 */
export class DeleteActivityBannerUseCase
  implements IUseCase<DeleteActivityBannerRequestDTO, void>
{
  constructor(
    private readonly tripRepo: ITripContractRepo,
    private readonly storageService: IStorageService
  ) {}

  async execute(request: DeleteActivityBannerRequestDTO): Promise<Result<void>> {
    const { tripId, activityId, userId, userEmail } = request;

    try {
      const trip = await this.tripRepo.findTripById(tripId);
      if (!trip) {
        return Result.fail(AppError.notFound("Viagem não encontrada"));
      }

      const activity = await this.tripRepo.findActivity(tripId, activityId);
      if (!activity) {
        return Result.fail(AppError.notFound("Atividade não encontrada"));
      }

      if (!canManageActivity(trip, activity, userId, userEmail)) {
        return Result.fail(
          AppError.forbidden("Você não tem permissão para editar esta atividade")
        );
      }

      if (activity.bannerPublicId) {
        try {
          await this.storageService.deleteImage(activity.bannerPublicId);
        } catch (error) {
          logger.error("[DeleteActivityBannerUseCase] falha ao remover banner", error);
        }
      }

      await this.tripRepo.updateActivityBanner(activity, {
        bannerUrl: null,
        bannerPublicId: null,
      });

      return Result.ok();
    } catch (error) {
      return Result.fail(AppError.internal((error as Error).message));
    }
  }
}

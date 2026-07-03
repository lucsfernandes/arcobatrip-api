import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { IStorageService } from "../../../services/storage/IStorageService";
import { isSupportedImageBuffer } from "../../../services/storage/imageValidation";
import { canManageActivity } from "../activityAuthorization";
import { ActivityContractMap } from "../../../../infra/db/mappers/ActivityContractMap";
import logger from "../../../../main/logger";
import { UploadActivityBannerRequestDTO } from "./UploadActivityBannerRequestDTO";
import { UploadActivityBannerResponseDTO } from "./UploadActivityBannerResponseDTO";

/** Cloudinary namespace and wide banner crop for activity banners. */
const ACTIVITY_BANNER_FOLDER = "zarpa/activity-banners";
const BANNER_WIDTH = 1200;
const BANNER_HEIGHT = 400;

/**
 * Contract: `POST /trips/{id}/activities/{activityId}/banner` (multipart, field
 * `file`). Authorized to the activity creator OR the trip owner
 * ({@link canManageActivity}). Uploads the new image (1200x400 fill),
 * best-effort deletes the previous asset and persists the new banner handles.
 * Responds 200 with the updated activity.
 */
export class UploadActivityBannerUseCase
  implements IUseCase<UploadActivityBannerRequestDTO, UploadActivityBannerResponseDTO>
{
  constructor(
    private readonly tripRepo: ITripContractRepo,
    private readonly storageService: IStorageService
  ) {}

  async execute(
    request: UploadActivityBannerRequestDTO
  ): Promise<Result<UploadActivityBannerResponseDTO>> {
    const { tripId, activityId, userId, userEmail, fileBuffer } = request;

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

      if (!(await isSupportedImageBuffer(fileBuffer))) {
        return Result.fail(
          AppError.validation("Formato inválido. Envie uma imagem JPEG, PNG ou WebP.", [
            {
              path: "file",
              message: "O conteúdo do arquivo não é uma imagem JPEG, PNG ou WebP válida.",
            },
          ])
        );
      }

      const uploaded = await this.storageService.uploadImage(fileBuffer, {
        folder: ACTIVITY_BANNER_FOLDER,
        width: BANNER_WIDTH,
        height: BANNER_HEIGHT,
      });

      const previousPublicId = activity.bannerPublicId;
      const updated = await this.tripRepo.updateActivityBanner(activity, {
        bannerUrl: uploaded.url,
        bannerPublicId: uploaded.publicId,
      });

      // Best-effort cleanup of the previous asset — never fail the request.
      if (previousPublicId && previousPublicId !== uploaded.publicId) {
        try {
          await this.storageService.deleteImage(previousPublicId);
        } catch (error) {
          logger.error(
            "[UploadActivityBannerUseCase] falha ao remover banner antigo",
            error
          );
        }
      }

      return Result.ok(ActivityContractMap.toContract(updated));
    } catch (error) {
      return Result.fail(AppError.internal((error as Error).message));
    }
  }
}

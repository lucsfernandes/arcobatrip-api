import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { IStorageService } from "../../../services/storage/IStorageService";
import { isSupportedImageBuffer } from "../../../services/storage/imageValidation";
import { isTripOwner } from "../tripAuthorization";
import { TripContractMap } from "../../../../infra/db/mappers/TripContractMap";
import logger from "../../../../main/logger";
import { UploadTripBannerRequestDTO } from "./UploadTripBannerRequestDTO";
import { UploadTripBannerResponseDTO } from "./UploadTripBannerResponseDTO";

/** Cloudinary namespace and wide banner crop for trip covers. */
const TRIP_BANNER_FOLDER = "zarpa/trip-banners";
const BANNER_WIDTH = 1200;
const BANNER_HEIGHT = 400;

/**
 * Contract: `POST /trips/{id}/banner` (multipart, field `file`). Only the trip
 * owner may set the banner. Uploads the new image (1200x400 fill), best-effort
 * deletes the previous asset and persists the new `cover_url` / `cover_public_id`.
 * Responds 200 with the updated trip.
 */
export class UploadTripBannerUseCase
  implements IUseCase<UploadTripBannerRequestDTO, UploadTripBannerResponseDTO>
{
  constructor(
    private readonly tripRepo: ITripContractRepo,
    private readonly storageService: IStorageService
  ) {}

  async execute(
    request: UploadTripBannerRequestDTO
  ): Promise<Result<UploadTripBannerResponseDTO>> {
    const { tripId, userEmail, fileBuffer } = request;

    try {
      const trip = await this.tripRepo.findTripById(tripId);
      if (!trip) {
        return Result.fail(AppError.notFound("Viagem não encontrada"));
      }

      if (!isTripOwner(trip, userEmail)) {
        return Result.fail(
          AppError.forbidden("Apenas o dono da viagem pode alterar o banner")
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
        folder: TRIP_BANNER_FOLDER,
        width: BANNER_WIDTH,
        height: BANNER_HEIGHT,
      });

      const previousPublicId = trip.coverPublicId;
      const updated = await this.tripRepo.updateTripCover(tripId, {
        coverUrl: uploaded.url,
        coverPublicId: uploaded.publicId,
      });

      // Best-effort cleanup of the previous asset — never fail the request.
      if (previousPublicId && previousPublicId !== uploaded.publicId) {
        try {
          await this.storageService.deleteImage(previousPublicId);
        } catch (error) {
          logger.error("[UploadTripBannerUseCase] falha ao remover banner antigo", error);
        }
      }

      return Result.ok(TripContractMap.toContract(updated));
    } catch (error) {
      return Result.fail(AppError.internal((error as Error).message));
    }
  }
}

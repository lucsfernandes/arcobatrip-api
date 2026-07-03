import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { IUserRepo } from "../../auth/IUserRepo";
import { IStorageService } from "../../../services/storage/IStorageService";
import { UserMap } from "../../../../infra/db/mappers/UserMap";
import logger from "../../../../main/logger";
import { UploadAvatarRequestDTO } from "./UploadAvatarRequestDTO";
import { UploadAvatarResponseDTO } from "./UploadAvatarResponseDTO";

const AVATAR_FOLDER = "zarpa/avatars";

/**
 * Replace the authenticated user's avatar. Contract: `POST /users/me/avatar`.
 * Uploads the new image, best-effort deletes the previous one (by stored
 * `public_id`) and persists the new URL + handle.
 */
export class UploadAvatarUseCase
  implements IUseCase<UploadAvatarRequestDTO, UploadAvatarResponseDTO>
{
  constructor(
    private readonly userRepo: IUserRepo,
    private readonly storageService: IStorageService
  ) {}

  async execute(
    request: UploadAvatarRequestDTO
  ): Promise<Result<UploadAvatarResponseDTO>> {
    const { userId, fileBuffer } = request;

    try {
      const current = await this.userRepo.findById(userId);
      if (!current) {
        return Result.fail(AppError.notFound("Usuário não encontrado"));
      }

      const uploaded = await this.storageService.uploadImage(fileBuffer, {
        folder: AVATAR_FOLDER,
      });

      const updated = await this.userRepo.update(userId, {
        avatarUrl: uploaded.url,
        avatarPublicId: uploaded.publicId,
      });
      if (!updated) {
        return Result.fail(AppError.internal("Não foi possível salvar o avatar"));
      }

      // Best-effort cleanup of the previous asset — never fail the request.
      if (current.avatarPublicId && current.avatarPublicId !== uploaded.publicId) {
        try {
          await this.storageService.deleteImage(current.avatarPublicId);
        } catch (error) {
          logger.error("[UploadAvatarUseCase] falha ao remover avatar antigo", error);
        }
      }

      return Result.ok(UserMap.toProfile(updated));
    } catch (error) {
      return Result.fail(AppError.internal((error as Error).message));
    }
  }
}

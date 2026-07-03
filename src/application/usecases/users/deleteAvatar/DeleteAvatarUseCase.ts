import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { IUserRepo } from "../../auth/IUserRepo";
import { IStorageService } from "../../../services/storage/IStorageService";
import logger from "../../../../main/logger";
import { DeleteAvatarRequestDTO } from "./DeleteAvatarRequestDTO";

/**
 * Remove the authenticated user's avatar. Contract: `DELETE /users/me/avatar`.
 * Best-effort deletes the stored asset and clears the URL + handle columns.
 * Responds 204 (no body) at the controller.
 */
export class DeleteAvatarUseCase implements IUseCase<DeleteAvatarRequestDTO, void> {
  constructor(
    private readonly userRepo: IUserRepo,
    private readonly storageService: IStorageService
  ) {}

  async execute(request: DeleteAvatarRequestDTO): Promise<Result<void>> {
    const { userId } = request;

    try {
      const current = await this.userRepo.findById(userId);
      if (!current) {
        return Result.fail(AppError.notFound("Usuário não encontrado"));
      }

      if (current.avatarPublicId) {
        try {
          await this.storageService.deleteImage(current.avatarPublicId);
        } catch (error) {
          logger.error("[DeleteAvatarUseCase] falha ao remover avatar", error);
        }
      }

      await this.userRepo.update(userId, { avatarUrl: null, avatarPublicId: null });

      return Result.ok();
    } catch (error) {
      return Result.fail(AppError.internal((error as Error).message));
    }
  }
}

import { Response } from "express";
import { BaseController } from "../BaseController";
import { UploadAvatarUseCase } from "../../../application/usecases/users/uploadAvatar/UploadAvatarUseCase";
import { AppError } from "../../../application/errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/**
 * Contract: `POST /users/me/avatar` (multipart, field `file`). Requires the
 * upload middleware to have populated `req.file` (multer memory storage).
 * Responds 200 with the updated profile.
 */
export class UploadAvatarController extends BaseController {
  constructor(private readonly uploadAvatarUseCase: UploadAvatarUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userId = req.userId;
    if (!userId) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    if (!req.file?.buffer) {
      return this.fail(res, AppError.validation("Arquivo de imagem é obrigatório", [
        { path: "file", message: "Envie a imagem no campo multipart 'file'" },
      ]));
    }

    const result = await this.uploadAvatarUseCase.execute({
      userId,
      fileBuffer: req.file.buffer,
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    return this.ok(res, result.getValue());
  }
}

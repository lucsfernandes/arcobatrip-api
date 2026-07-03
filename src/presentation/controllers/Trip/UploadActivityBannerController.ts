import { Response } from "express";
import { BaseController } from "../BaseController";
import { UploadActivityBannerUseCase } from "../../../application/usecases/trips/uploadActivityBanner/UploadActivityBannerUseCase";
import { AppError } from "../../../application/errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/**
 * Contract: `POST /trips/{id}/activities/{activityId}/banner` (multipart, field
 * `file`). Responds 200 with the updated activity.
 */
export class UploadActivityBannerController extends BaseController {
  constructor(private readonly uploadActivityBannerUseCase: UploadActivityBannerUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userId = req.userId;
    const userEmail = req.userEmail;
    if (!userId || !userEmail) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    if (!req.file?.buffer) {
      return this.fail(res, AppError.validation("Arquivo de imagem é obrigatório", [
        { path: "file", message: "Envie a imagem no campo multipart 'file'" },
      ]));
    }

    const result = await this.uploadActivityBannerUseCase.execute({
      tripId: req.params.id,
      activityId: req.params.activityId,
      userId,
      userEmail,
      fileBuffer: req.file.buffer,
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    return this.ok(res, result.getValue());
  }
}

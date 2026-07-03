import { Response } from "express";
import { BaseController } from "../BaseController";
import { UploadTripBannerUseCase } from "../../../application/usecases/trips/uploadTripBanner/UploadTripBannerUseCase";
import { AppError } from "../../../application/errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/**
 * Contract: `POST /trips/{id}/banner` (multipart, field `file`). Requires the
 * upload middleware to have populated `req.file`. Responds 200 with the updated
 * trip.
 */
export class UploadTripBannerController extends BaseController {
  constructor(private readonly uploadTripBannerUseCase: UploadTripBannerUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userEmail = req.userEmail;
    if (!req.userId || !userEmail) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    if (!req.file?.buffer) {
      return this.fail(res, AppError.validation("Arquivo de imagem é obrigatório", [
        { path: "file", message: "Envie a imagem no campo multipart 'file'" },
      ]));
    }

    const result = await this.uploadTripBannerUseCase.execute({
      tripId: req.params.id,
      userEmail,
      fileBuffer: req.file.buffer,
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    return this.ok(res, result.getValue());
  }
}

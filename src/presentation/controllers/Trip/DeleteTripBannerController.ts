import { Response } from "express";
import { BaseController } from "../BaseController";
import { DeleteTripBannerUseCase } from "../../../application/usecases/trips/deleteTripBanner/DeleteTripBannerUseCase";
import { AppError } from "../../../application/errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/** Contract: `DELETE /trips/{id}/banner`. Responds 204 on success. */
export class DeleteTripBannerController extends BaseController {
  constructor(private readonly deleteTripBannerUseCase: DeleteTripBannerUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userEmail = req.userEmail;
    if (!req.userId || !userEmail) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    const result = await this.deleteTripBannerUseCase.execute({
      tripId: req.params.id,
      userEmail,
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    return res.status(204).send();
  }
}

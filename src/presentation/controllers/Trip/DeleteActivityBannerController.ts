import { Response } from "express";
import { BaseController } from "../BaseController";
import { DeleteActivityBannerUseCase } from "../../../application/usecases/trips/deleteActivityBanner/DeleteActivityBannerUseCase";
import { AppError } from "../../../application/errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/** Contract: `DELETE /trips/{id}/activities/{activityId}/banner`. Responds 204. */
export class DeleteActivityBannerController extends BaseController {
  constructor(private readonly deleteActivityBannerUseCase: DeleteActivityBannerUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userId = req.userId;
    const userEmail = req.userEmail;
    if (!userId || !userEmail) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    const result = await this.deleteActivityBannerUseCase.execute({
      tripId: req.params.id,
      activityId: req.params.activityId,
      userId,
      userEmail,
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    return res.status(204).send();
  }
}

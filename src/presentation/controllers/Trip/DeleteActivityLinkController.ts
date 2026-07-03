import { Response } from "express";
import { BaseController } from "../BaseController";
import { DeleteActivityLinkUseCase } from "../../../application/usecases/trips/deleteActivityLink/DeleteActivityLinkUseCase";
import { AppError } from "../../../application/errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/** Contract: `DELETE /trips/{id}/activities/{activityId}/links/{linkId}`. 204. */
export class DeleteActivityLinkController extends BaseController {
  constructor(private readonly deleteActivityLinkUseCase: DeleteActivityLinkUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userId = req.userId;
    const userEmail = req.userEmail;
    if (!userId || !userEmail) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    const result = await this.deleteActivityLinkUseCase.execute({
      tripId: req.params.id,
      activityId: req.params.activityId,
      linkId: req.params.linkId,
      userId,
      userEmail,
    });

    if (result.isFailure) return this.fail(res, result.errorValue());
    return res.status(204).send();
  }
}

import { Response } from "express";
import { BaseController } from "../BaseController";
import { AddActivityLinkUseCase } from "../../../application/usecases/trips/addActivityLink/AddActivityLinkUseCase";
import { AppError } from "../../../application/errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/** Contract: `POST /trips/{id}/activities/{activityId}/links`. 201 on success. */
export class AddActivityLinkController extends BaseController {
  constructor(private readonly addActivityLinkUseCase: AddActivityLinkUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userId = req.userId;
    const userEmail = req.userEmail;
    if (!userId || !userEmail) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    const result = await this.addActivityLinkUseCase.execute({
      tripId: req.params.id,
      activityId: req.params.activityId,
      userId,
      userEmail,
      label: req.body.label,
      url: req.body.url,
    });

    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.created(res, result.getValue());
  }
}

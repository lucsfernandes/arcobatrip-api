import { Response } from "express";
import { BaseController } from "../BaseController";
import { AddCommentUseCase } from "../../../application/usecases/trips/addComment/AddCommentUseCase";
import { AppError } from "../../../application/errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/** Contract: `POST /trips/{id}/activities/{activityId}/comments`. 201 on success. */
export class AddCommentController extends BaseController {
  constructor(private readonly addCommentUseCase: AddCommentUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userId = req.userId;
    const userEmail = req.userEmail;
    if (!userId || !userEmail) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    const result = await this.addCommentUseCase.execute({
      tripId: req.params.id,
      activityId: req.params.activityId,
      userId,
      userEmail,
      body: req.body.body,
    });

    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.created(res, result.getValue());
  }
}

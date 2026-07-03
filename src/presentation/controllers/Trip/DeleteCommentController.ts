import { Response } from "express";
import { BaseController } from "../BaseController";
import { DeleteCommentUseCase } from "../../../application/usecases/trips/deleteComment/DeleteCommentUseCase";
import { AppError } from "../../../application/errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/** Contract: `DELETE /trips/{id}/activities/{activityId}/comments/{commentId}`. 204. */
export class DeleteCommentController extends BaseController {
  constructor(private readonly deleteCommentUseCase: DeleteCommentUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userId = req.userId;
    const userEmail = req.userEmail;
    if (!userId || !userEmail) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    const result = await this.deleteCommentUseCase.execute({
      tripId: req.params.id,
      activityId: req.params.activityId,
      commentId: req.params.commentId,
      userId,
      userEmail,
    });

    if (result.isFailure) return this.fail(res, result.errorValue());
    return res.status(204).send();
  }
}

import { Response } from "express";
import { BaseController } from "../BaseController";
import { ListCommentsUseCase } from "../../../application/usecases/trips/listComments/ListCommentsUseCase";
import { AppError } from "../../../application/errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/** Contract: `GET /trips/{id}/activities/{activityId}/comments`. 200 with array. */
export class ListCommentsController extends BaseController {
  constructor(private readonly listCommentsUseCase: ListCommentsUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userEmail = req.userEmail;
    if (!req.userId || !userEmail) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    const result = await this.listCommentsUseCase.execute({
      tripId: req.params.id,
      activityId: req.params.activityId,
      userEmail,
    });

    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.ok(res, result.getValue());
  }
}

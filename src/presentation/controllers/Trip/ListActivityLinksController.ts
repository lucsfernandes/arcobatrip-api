import { Response } from "express";
import { BaseController } from "../BaseController";
import { ListActivityLinksUseCase } from "../../../application/usecases/trips/listActivityLinks/ListActivityLinksUseCase";
import { AppError } from "../../../application/errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/** Contract: `GET /trips/{id}/activities/{activityId}/links`. 200 with array. */
export class ListActivityLinksController extends BaseController {
  constructor(private readonly listActivityLinksUseCase: ListActivityLinksUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userEmail = req.userEmail;
    if (!req.userId || !userEmail) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    const result = await this.listActivityLinksUseCase.execute({
      tripId: req.params.id,
      activityId: req.params.activityId,
      userEmail,
    });

    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.ok(res, result.getValue());
  }
}

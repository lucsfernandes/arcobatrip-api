import { Response } from "express";
import { BaseController } from "../BaseController";
import { UpdateActivityUseCase } from "../../../application/usecases/trips/updateActivity/UpdateActivityUseCase";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

export class UpdateActivityController extends BaseController {
  constructor(private updateActivityUseCase: UpdateActivityUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { body } = req;
    const result = await this.updateActivityUseCase.execute({
      tripId: req.params.id,
      activityId: req.params.activityId,
      userId: req.userId ?? "",
      userEmail: req.userEmail ?? "",
      title: body.title,
      at: body.at,
      status: body.status,
    });
    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.ok(res, result.getValue());
  }
}

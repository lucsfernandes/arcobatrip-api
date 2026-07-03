import { Response } from "express";
import { BaseController } from "../BaseController";
import { DeleteActivityUseCase } from "../../../application/usecases/trips/deleteActivity/DeleteActivityUseCase";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

export class DeleteActivityController extends BaseController {
  constructor(private deleteActivityUseCase: DeleteActivityUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const result = await this.deleteActivityUseCase.execute({
      tripId: req.params.id,
      activityId: req.params.activityId,
      userId: req.userId ?? "",
      userEmail: req.userEmail ?? "",
    });
    if (result.isFailure) return this.fail(res, result.errorValue());
    return res.status(204).send();
  }
}

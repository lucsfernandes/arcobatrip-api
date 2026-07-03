import { Response } from "express";
import { BaseController } from "../BaseController";
import { AddActivityUseCase } from "../../../application/usecases/trips/addActivity/AddActivityUseCase";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

export class AddActivityController extends BaseController {
  constructor(private addActivityUseCase: AddActivityUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { body } = req;
    const result = await this.addActivityUseCase.execute({
      tripId: req.params.id,
      title: body.title,
      at: body.at,
      status: body.status,
      createdBy: req.userId ?? null,
    });
    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.created(res, result.getValue());
  }
}

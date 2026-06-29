import { Response } from "express";
import { BaseController } from "../BaseController";
import { ListTripsUseCase } from "../../../application/usecases/trips/listTrips/ListTripsUseCase";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

export class ListTripsController extends BaseController {
  constructor(private listTripsUseCase: ListTripsUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const result = await this.listTripsUseCase.execute({ email: req.userEmail ?? "" });
    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.ok(res, result.getValue());
  }
}

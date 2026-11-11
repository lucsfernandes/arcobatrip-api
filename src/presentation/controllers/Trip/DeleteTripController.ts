import { Response } from "express";
import { BaseController } from "../BaseController";
import { DeleteTripUseCase } from "../../../application/usecases/trips/deleteTrip/DeleteTripUseCase";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

export class DeleteTripController extends BaseController {
  constructor(private deleteTripUseCase: DeleteTripUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const result = await this.deleteTripUseCase.execute({
      tripId: req.params.id,
      userEmail: req.userEmail ?? "",
    });
    if (result.isFailure) return this.fail(res, result.errorValue());
    return res.status(204).send();
  }
}

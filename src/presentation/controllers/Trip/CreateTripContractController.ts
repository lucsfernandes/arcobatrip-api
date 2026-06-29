import { Response } from "express";
import { BaseController } from "../BaseController";
import { CreateTripContractUseCase } from "../../../application/usecases/trips/createTrip/CreateTripContractUseCase";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

export class CreateTripContractController extends BaseController {
  constructor(private createTripUseCase: CreateTripContractUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { body } = req;
    const result = await this.createTripUseCase.execute({
      userId: req.userId ?? "",
      destination: body.destination,
      startDate: body.startDate,
      endDate: body.endDate,
      guestEmails: body.guestEmails ?? [],
    });
    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.created(res, result.getValue());
  }
}

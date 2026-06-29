import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { GetTripUseCase } from "../../../application/usecases/trips/getTrip/GetTripUseCase";

export class GetTripController extends BaseController {
  constructor(private getTripUseCase: GetTripUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const result = await this.getTripUseCase.execute({ tripId: req.params.id });
    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.ok(res, result.getValue());
  }
}

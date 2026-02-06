import { Request, Response } from "express";
import { GetTripDetailUseCase } from "../../../application/usecases/trips/getTripDetail/GetTripDetailUseCase";
import { BaseController } from "../BaseController";

export class GetTripDetailController extends BaseController {
  constructor(private getTripDetailUseCase: GetTripDetailUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    const { tripId } = req.params;

    const result = await this.getTripDetailUseCase.execute({ tripId });

    if (result.isFailure) {
      return this.clientError(res, result.errorValue());
    }

    return this.ok(res, { data: result.getValue() });
  }
}
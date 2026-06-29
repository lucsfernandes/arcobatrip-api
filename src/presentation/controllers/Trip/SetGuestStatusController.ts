import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { SetGuestStatusUseCase } from "../../../application/usecases/trips/setGuestStatus/SetGuestStatusUseCase";

export class SetGuestStatusController extends BaseController {
  constructor(private setGuestStatusUseCase: SetGuestStatusUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const result = await this.setGuestStatusUseCase.execute({
      tripId: req.params.id,
      guestId: req.params.guestId,
      status: req.body.status,
    });
    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.ok(res, result.getValue());
  }
}

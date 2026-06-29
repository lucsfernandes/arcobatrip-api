import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { AddGuestUseCase } from "../../../application/usecases/trips/addGuest/AddGuestUseCase";

export class AddGuestController extends BaseController {
  constructor(private addGuestUseCase: AddGuestUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const result = await this.addGuestUseCase.execute({
      tripId: req.params.id,
      email: req.body.email,
    });
    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.created(res, result.getValue());
  }
}

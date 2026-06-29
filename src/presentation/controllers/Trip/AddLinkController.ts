import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { AddLinkUseCase } from "../../../application/usecases/trips/addLink/AddLinkUseCase";

export class AddLinkController extends BaseController {
  constructor(private addLinkUseCase: AddLinkUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const { body } = req;
    const result = await this.addLinkUseCase.execute({
      tripId: req.params.id,
      label: body.label,
      url: body.url,
    });
    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.created(res, result.getValue());
  }
}

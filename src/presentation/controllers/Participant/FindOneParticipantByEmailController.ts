import { Request, Response } from "express";
import { FindOneParticipantByEmailUseCase } from "../../../application/usecases/participants/findOneByEmail/FindOneParticipantByEmailUseCase";
import { BaseController } from "../BaseController";

export class FindOneParticipantByEmailController extends BaseController {
  constructor(
    private findOneParticipantByEmailUseCase: FindOneParticipantByEmailUseCase
  ) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    const result = await this.findOneParticipantByEmailUseCase.execute({
      email: req.params.email?.toString() || "",
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }
    return this.ok(res, { data: result.getValue() });
  }
}
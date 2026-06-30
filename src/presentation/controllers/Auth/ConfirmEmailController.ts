import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { ConfirmEmailUseCase } from "../../../application/usecases/auth/confirmEmail/ConfirmEmailUseCase";

export class ConfirmEmailController extends BaseController {
  constructor(private confirmEmailUseCase: ConfirmEmailUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const { body } = req;

    const result = await this.confirmEmailUseCase.execute({
      token: body.token,
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    return this.ok(res, result.getValue());
  }
}

import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { ForgotPasswordUseCase } from "../../../application/usecases/auth/forgotPassword/ForgotPasswordUseCase";

export class ForgotPasswordController extends BaseController {
  constructor(private forgotPasswordUseCase: ForgotPasswordUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const { body } = req;

    const result = await this.forgotPasswordUseCase.execute({
      email: body.email,
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    return this.ok(res, result.getValue());
  }
}

import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { ResetPasswordUseCase } from "../../../application/usecases/auth/resetPassword/ResetPasswordUseCase";

export class ResetPasswordController extends BaseController {
  constructor(private resetPasswordUseCase: ResetPasswordUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const { body } = req;

    const result = await this.resetPasswordUseCase.execute({
      token: body.token,
      password: body.password,
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    return this.ok(res, result.getValue());
  }
}

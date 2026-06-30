import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { ResendVerificationUseCase } from "../../../application/usecases/auth/resendVerification/ResendVerificationUseCase";

export class ResendVerificationController extends BaseController {
  constructor(private resendVerificationUseCase: ResendVerificationUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const { body } = req;

    const result = await this.resendVerificationUseCase.execute({
      email: body.email,
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    return this.ok(res, result.getValue());
  }
}

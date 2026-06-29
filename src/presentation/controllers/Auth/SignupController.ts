import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { SignupUseCase } from "../../../application/usecases/auth/signup/SignupUseCase";

export class SignupController extends BaseController {
  constructor(private signupUseCase: SignupUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const { body } = req;

    const result = await this.signupUseCase.execute({
      name: body.name,
      email: body.email,
      password: body.password,
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    // 201 { token, user } — raw contract body.
    return this.created(res, result.getValue());
  }
}

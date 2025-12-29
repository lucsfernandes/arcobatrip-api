import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { LoginUserUseCase } from "../../../application/usecases/auth/login/LoginUserUseCase";

export class LoginUserController extends BaseController {
  constructor(private loginUserUseCase: LoginUserUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const { body } = req;

    const result = await this.loginUserUseCase.execute({
      email: body.email,
      password: body.password
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    return this.ok(res, { data: result.getValue() });
  }
}

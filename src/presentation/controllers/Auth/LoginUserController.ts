import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { LoginUserUseCase } from "../../../application/usecases/auth/login/LoginUserUseCase";
import { UserMap } from "../../../infra/db/mappers/UserMap";
import { AuthResponseContract } from "../../../application/contracts/contract";

export class LoginUserController extends BaseController {
  constructor(private loginUserUseCase: LoginUserUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const { body } = req;

    const result = await this.loginUserUseCase.execute({
      email: body.email,
      password: body.password,
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    const value = result.getValue();
    // Map the rich use-case result into the contract envelope { token, user }.
    const response: AuthResponseContract = {
      token: value.accessToken,
      user: UserMap.toContract(value.user),
    };
    return this.ok(res, response);
  }
}

import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { LoginUserUseCase } from "../../../application/usecases/auth/login/LoginUserUseCase";
import { UserMap } from "../../../infra/db/mappers/UserMap";
import { AuthResponseContract } from "../../../application/contracts/contract";
import { setAuthCookies } from "../../http/authCookies";

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

    // Web: emite os cookies HttpOnly (access + refresh) e usa-os. Mobile: ignora
    // os cookies e lê `token` + `refreshToken` do corpo abaixo (não tem acesso ao
    // cookie), renovando a sessão via POST /auth/refresh com o refreshToken.
    setAuthCookies(res, {
      accessToken: value.accessToken,
      refreshToken: value.refreshToken,
    });

    // Map the rich use-case result into the contract envelope
    // { token, refreshToken, user }.
    const response: AuthResponseContract = {
      token: value.accessToken,
      refreshToken: value.refreshToken,
      user: UserMap.toContract(value.user),
    };
    return this.ok(res, response);
  }
}

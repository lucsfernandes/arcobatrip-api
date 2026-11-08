import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { SignupUseCase } from "../../../application/usecases/auth/signup/SignupUseCase";
import { AuthResponseContract } from "../../../application/contracts/contract";
import { setAuthCookies } from "../../http/authCookies";

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

    const value = result.getValue();

    // Web: emite os cookies HttpOnly (access + refresh) para a sessão nascer já
    // autenticada e usa-os. Mobile: ignora os cookies e lê `token` + `refreshToken`
    // do corpo, renovando a sessão via POST /auth/refresh com o refreshToken.
    setAuthCookies(res, {
      accessToken: value.token,
      refreshToken: value.refreshToken,
    });

    // 201 com o contrato `{ token, refreshToken, user }`. O `refreshToken` também
    // vai no corpo (além do cookie) para o mobile, que não acessa o cookie.
    const responseBody: AuthResponseContract = {
      token: value.token,
      refreshToken: value.refreshToken,
      user: value.user,
    };
    return this.created(res, responseBody);
  }
}

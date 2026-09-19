import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { GoogleSignInUseCase } from "../../../application/usecases/auth/socialGoogle/GoogleSignInUseCase";
import { UserMap } from "../../../infra/db/mappers/UserMap";
import { AuthResponseContract } from "../../../application/contracts/contract";
import { setAuthCookies } from "../../http/authCookies";

/**
 * `POST /auth/social/google`. Verifies a Google OIDC ID token and issues a
 * session with the SAME body shape as login (`{ token, refreshToken, user }`),
 * also setting the HttpOnly cookies so the web can reuse this endpoint.
 */
export class GoogleSignInController extends BaseController {
  constructor(private googleSignInUseCase: GoogleSignInUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const { body } = req;

    const result = await this.googleSignInUseCase.execute({
      idToken: body.idToken,
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    const value = result.getValue();

    // Web: emite os cookies HttpOnly (access + refresh). Mobile: lê `token` +
    // `refreshToken` do corpo abaixo. Mesmo comportamento do LoginUserController.
    setAuthCookies(res, {
      accessToken: value.accessToken,
      refreshToken: value.refreshToken,
    });

    const response: AuthResponseContract = {
      token: value.accessToken,
      refreshToken: value.refreshToken,
      user: UserMap.toContract(value.user),
    };
    return this.ok(res, response);
  }
}

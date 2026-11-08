import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { GoogleSignInUseCase } from "../../../application/usecases/auth/socialGoogle/GoogleSignInUseCase";
import { UserMap } from "../../../infra/db/mappers/UserMap";
import { AuthResponseContract } from "../../../application/contracts/contract";
import { setAuthCookies } from "../../http/authCookies";

/**
 * `POST /auth/social/google`. Verifies a Google ID token and opens a session
 * with the SAME body as login (`{ token, refreshToken, user }`), also setting
 * the HttpOnly cookies so the web can reuse the endpoint.
 */
export class GoogleSignInController extends BaseController {
  constructor(private googleSignInUseCase: GoogleSignInUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const result = await this.googleSignInUseCase.execute({ idToken: req.body.idToken });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    const session = result.getValue();

    // Web: HttpOnly cookies. Mobile: `token` + `refreshToken` from the body.
    setAuthCookies(res, {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });

    const response: AuthResponseContract = {
      token: session.accessToken,
      refreshToken: session.refreshToken,
      user: UserMap.toContract(session.user),
    };
    return this.ok(res, response);
  }
}

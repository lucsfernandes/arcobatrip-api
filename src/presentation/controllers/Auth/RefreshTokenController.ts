import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { RefreshTokenUseCase } from "../../../application/usecases/auth/refresh/RefreshTokenUseCase";
import { setAuthCookies } from "../../http/authCookies";

export class RefreshTokenController extends BaseController {
  constructor(private refreshTokenUseCase: RefreshTokenUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    // DUAL: o web renova via cookie HttpOnly `refresh_token` (POST sem corpo); o
    // mobile envia `refreshToken` no corpo. O cookie tem precedência. Se nenhum
    // vier, passamos "" — o use case responde 401 (token inválido/expirado).
    const cookieToken =
      typeof req.cookies?.refresh_token === "string" ? req.cookies.refresh_token : "";
    const bodyToken =
      typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";
    const refreshToken = cookieToken || bodyToken;

    const result = await this.refreshTokenUseCase.execute({ refreshToken });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    const value = result.getValue();

    // Rotaciona os cookies HttpOnly do web com o novo par. O corpo permanece
    // como hoje ({ accessToken, refreshToken, expiresIn }) para o mobile.
    setAuthCookies(res, {
      accessToken: value.accessToken,
      refreshToken: value.refreshToken,
    });

    return this.ok(res, value);
  }
}

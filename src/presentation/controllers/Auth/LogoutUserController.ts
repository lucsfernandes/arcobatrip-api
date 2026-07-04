import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { LogoutUserUseCase } from "../../../application/usecases/auth/logout/LogoutUserUseCase";
import { clearAuthCookies } from "../../http/authCookies";

export class LogoutUserController extends BaseController {
  constructor(private logoutUserUseCase: LogoutUserUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    // Token a invalidar (blacklist), na ordem: cookie (web) -> corpo -> header
    // Authorization (mobile). Assim qualquer plataforma consegue deslogar.
    const cookieToken =
      typeof req.cookies?.access_token === "string" ? req.cookies.access_token : "";
    const bodyToken = typeof req.body?.token === "string" ? req.body.token : "";
    const headerToken = req.headers.authorization?.split(" ")[1] ?? "";
    const token = cookieToken || bodyToken || headerToken || "";
    const userId = (req as Request & { userId?: string }).userId || "";

    const result = await this.logoutUserUseCase.execute({
      token,
      userId,
    });

    // Sempre limpa os cookies HttpOnly do web — é o que encerra a sessão no
    // browser. Feito mesmo em caso de falha para não deixar cookie órfão.
    clearAuthCookies(res);

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    return this.ok(res, result.getValue());
  }
}

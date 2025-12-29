import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { LogoutUserUseCase } from "../../../application/usecases/auth/logout/LogoutUserUseCase";

export class LogoutUserController extends BaseController {
  constructor(private logoutUserUseCase: LogoutUserUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1] || "";
    const userId = (req as any).userId || "";

    const result = await this.logoutUserUseCase.execute({
      token,
      userId
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    return this.ok(res, { data: result.getValue() });
  }
}

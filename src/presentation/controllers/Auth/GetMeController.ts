import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { IUserRepo } from "../../../application/usecases/auth/IUserRepo";
import { AppError } from "../../../application/errors/AppError";
import { UserMap } from "../../../infra/db/mappers/UserMap";

/**
 * Contract: `GET /me` (also mounted at `/auth/me`). Returns the bare contract
 * `User` for the authenticated session.
 */
export class GetMeController extends BaseController {
  constructor(private userRepo: IUserRepo) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const userId = (req as { userId?: string }).userId;

    if (!userId) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    const user = await this.userRepo.findById(userId);

    if (!user) {
      return this.fail(res, AppError.notFound("Usuário não encontrado"));
    }

    return this.ok(res, UserMap.toContract(user));
  }
}

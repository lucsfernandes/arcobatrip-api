import { Response } from "express";
import { BaseController } from "../BaseController";
import { IUserRepo } from "../../../application/usecases/auth/IUserRepo";
import { AppError } from "../../../application/errors/AppError";
import { UserMap } from "../../../infra/db/mappers/UserMap";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/**
 * Contract: `GET /users/me`. Returns the rich {@link UserProfileContract} for the
 * authenticated session (superset of the minimal auth `/me`).
 */
export class GetProfileController extends BaseController {
  constructor(private readonly userRepo: IUserRepo) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userId = req.userId;
    if (!userId) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      return this.fail(res, AppError.notFound("Usuário não encontrado"));
    }

    return this.ok(res, UserMap.toProfile(user));
  }
}

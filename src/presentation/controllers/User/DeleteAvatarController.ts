import { Response } from "express";
import { BaseController } from "../BaseController";
import { DeleteAvatarUseCase } from "../../../application/usecases/users/deleteAvatar/DeleteAvatarUseCase";
import { AppError } from "../../../application/errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/** Contract: `DELETE /users/me/avatar`. Responds 204 on success. */
export class DeleteAvatarController extends BaseController {
  constructor(private readonly deleteAvatarUseCase: DeleteAvatarUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userId = req.userId;
    if (!userId) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    const result = await this.deleteAvatarUseCase.execute({ userId });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    return res.status(204).send();
  }
}

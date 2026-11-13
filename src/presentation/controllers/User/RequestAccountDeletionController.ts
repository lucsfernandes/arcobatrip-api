import { Response } from "express";
import { BaseController } from "../BaseController";
import { RequestAccountDeletionUseCase } from "../../../application/usecases/users/requestAccountDeletion/RequestAccountDeletionUseCase";
import { AppError } from "../../../application/errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/** Contract: `POST /users/me/deletion`. Sends the confirmation link; responds 200 `{ message }`. */
export class RequestAccountDeletionController extends BaseController {
  constructor(private readonly useCase: RequestAccountDeletionUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userId = req.userId;
    if (!userId) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    const result = await this.useCase.execute({ userId });
    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.ok(res, result.getValue());
  }
}

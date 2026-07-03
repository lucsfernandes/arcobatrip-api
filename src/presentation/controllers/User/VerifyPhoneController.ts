import { Response } from "express";
import { BaseController } from "../BaseController";
import { VerifyPhoneUseCase } from "../../../application/usecases/users/verifyPhone/VerifyPhoneUseCase";
import { AppError } from "../../../application/errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/** Contract: `POST /users/me/phone/verify`. Body `{ code }` (6 digits). */
export class VerifyPhoneController extends BaseController {
  constructor(private readonly verifyPhoneUseCase: VerifyPhoneUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userId = req.userId;
    if (!userId) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    const result = await this.verifyPhoneUseCase.execute({
      userId,
      code: req.body.code,
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    return this.ok(res, result.getValue());
  }
}

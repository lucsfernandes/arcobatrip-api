import { Response } from "express";
import { BaseController } from "../BaseController";
import { RequestPhoneVerificationUseCase } from "../../../application/usecases/users/requestPhoneVerification/RequestPhoneVerificationUseCase";
import { AppError } from "../../../application/errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/** Contract: `POST /users/me/phone`. Body `{ phoneNumber }` (E.164). */
export class RequestPhoneVerificationController extends BaseController {
  constructor(
    private readonly requestPhoneVerificationUseCase: RequestPhoneVerificationUseCase
  ) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userId = req.userId;
    if (!userId) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    const result = await this.requestPhoneVerificationUseCase.execute({
      userId,
      phoneNumber: req.body.phoneNumber,
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    return this.ok(res, result.getValue());
  }
}

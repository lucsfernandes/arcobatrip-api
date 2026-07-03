import { Response } from "express";
import { BaseController } from "../BaseController";
import { UpdateProfileUseCase } from "../../../application/usecases/users/updateProfile/UpdateProfileUseCase";
import { AppError } from "../../../application/errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/**
 * Contract: `PATCH /users/me`. The body is already whitelisted/validated by the
 * strict Zod schema and the email guard; here we only bind the authenticated
 * user id and forward the fields.
 */
export class UpdateProfileController extends BaseController {
  constructor(private readonly updateProfileUseCase: UpdateProfileUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userId = req.userId;
    if (!userId) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    const { fullName, phone, birthDate, bio, city, country } = req.body;

    const result = await this.updateProfileUseCase.execute({
      userId,
      fullName,
      phone,
      birthDate,
      bio,
      city,
      country,
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    return this.ok(res, result.getValue());
  }
}

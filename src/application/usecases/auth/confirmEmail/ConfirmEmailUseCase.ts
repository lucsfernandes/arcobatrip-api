import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { IUserRepo } from "../IUserRepo";
import { IVerificationTokenRepo } from "../IVerificationTokenRepo";
import { hashToken } from "../../../utils/token";
import { ConfirmEmailRequestDTO } from "./ConfirmEmailRequestDTO";
import { ConfirmEmailResponseDTO } from "./ConfirmEmailResponseDTO";

/**
 * Confirm a user's email. Contract: `POST /auth/verify-email`. Looks up the
 * hashed token, marks the user verified and burns the token.
 */
export class ConfirmEmailUseCase
  implements IUseCase<ConfirmEmailRequestDTO, ConfirmEmailResponseDTO>
{
  constructor(
    private readonly userRepo: IUserRepo,
    private readonly verificationTokenRepo: IVerificationTokenRepo
  ) {}

  async execute(
    request: ConfirmEmailRequestDTO
  ): Promise<Result<ConfirmEmailResponseDTO>> {
    const { token } = request;

    try {
      const verificationToken = await this.verificationTokenRepo.findValidByHash(
        hashToken(token),
        "email_verification"
      );

      if (!verificationToken) {
        return Result.fail(AppError.badRequest("Token inválido ou expirado"));
      }

      await this.userRepo.update(verificationToken.userId, {
        emailVerifiedAt: new Date(),
      });
      await this.verificationTokenRepo.markUsed(verificationToken);

      return Result.ok({ message: "Email confirmado com sucesso." });
    } catch (error) {
      return Result.fail(AppError.internal((error as Error).message));
    }
  }
}

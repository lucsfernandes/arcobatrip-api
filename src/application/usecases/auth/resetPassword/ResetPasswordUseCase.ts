import bcrypt from "bcryptjs";
import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { IUserRepo } from "../IUserRepo";
import { IVerificationTokenRepo } from "../IVerificationTokenRepo";
import { hashToken } from "../../../utils/token";
import { ResetPasswordRequestDTO } from "./ResetPasswordRequestDTO";
import { ResetPasswordResponseDTO } from "./ResetPasswordResponseDTO";

/**
 * Set a new password from a reset link. Contract: `POST /auth/reset-password`.
 * Validates the password length, verifies the hashed token, re-hashes the new
 * password (bcryptjs, 12 rounds — matching signup) and burns the token.
 *
 * The link was delivered to the account's e-mail, so using it proves the user
 * owns that address: an unconfirmed e-mail becomes confirmed. This is safe
 * because the password is replaced in the same step — a password set by
 * someone else before ownership was proven does not survive.
 */
export class ResetPasswordUseCase
  implements IUseCase<ResetPasswordRequestDTO, ResetPasswordResponseDTO>
{
  constructor(
    private readonly userRepo: IUserRepo,
    private readonly verificationTokenRepo: IVerificationTokenRepo
  ) {}

  async execute(
    request: ResetPasswordRequestDTO
  ): Promise<Result<ResetPasswordResponseDTO>> {
    const { token, password } = request;

    if (!password || password.length < 8) {
      return Result.fail(AppError.validation("A senha deve ter pelo menos 8 caracteres", [
        { path: "password", message: "A senha deve ter pelo menos 8 caracteres" },
      ]));
    }

    try {
      const verificationToken = await this.verificationTokenRepo.findValidByHash(
        hashToken(token),
        "password_reset"
      );

      if (!verificationToken) {
        return Result.fail(AppError.badRequest("Token inválido ou expirado"));
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await this.userRepo.findById(verificationToken.userId);
      await this.userRepo.update(verificationToken.userId, {
        password: hashedPassword,
        ...(user && !user.emailVerifiedAt ? { emailVerifiedAt: new Date() } : {}),
      });
      await this.verificationTokenRepo.markUsed(verificationToken);

      return Result.ok({ message: "Senha redefinida com sucesso." });
    } catch (error) {
      return Result.fail(AppError.internal((error as Error).message));
    }
  }
}

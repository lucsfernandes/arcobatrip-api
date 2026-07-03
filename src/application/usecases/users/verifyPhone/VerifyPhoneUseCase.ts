import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { IUserRepo } from "../../auth/IUserRepo";
import { IVerificationTokenRepo } from "../../auth/IVerificationTokenRepo";
import { hashToken } from "../../../utils/token";
import { env } from "../../../../main/config/env";
import { VerifyPhoneRequestDTO } from "./VerifyPhoneRequestDTO";
import { VerifyPhoneResponseDTO } from "./VerifyPhoneResponseDTO";

/**
 * Confirm a phone number. Contract: `POST /users/me/phone/verify`. Looks up the
 * user's active `phone_verification` token (scoped by user — codes are short and
 * could collide across users), compares the hash, enforces the attempt limit and
 * on success flips `phoneVerified` to true and burns the token.
 *
 * Errors: 410 `code_expired` (no active code), 400 `invalid_code` (wrong code),
 * 429 `too_many_attempts` (attempt limit reached — the code is invalidated).
 */
export class VerifyPhoneUseCase
  implements IUseCase<VerifyPhoneRequestDTO, VerifyPhoneResponseDTO>
{
  private readonly maxAttempts = env.PHONE_VERIFICATION_MAX_ATTEMPTS;

  constructor(
    private readonly userRepo: IUserRepo,
    private readonly verificationTokenRepo: IVerificationTokenRepo
  ) {}

  async execute(request: VerifyPhoneRequestDTO): Promise<Result<VerifyPhoneResponseDTO>> {
    const { userId, code } = request;

    try {
      const token = await this.verificationTokenRepo.findActiveForUser(
        userId,
        "phone_verification"
      );

      if (!token) {
        return Result.fail(AppError.codeExpired());
      }

      if (token.attempts >= this.maxAttempts) {
        await this.verificationTokenRepo.markUsed(token);
        return Result.fail(AppError.tooManyAttempts());
      }

      if (hashToken(code) !== token.tokenHash) {
        await this.verificationTokenRepo.incrementAttempts(token);
        if (token.attempts >= this.maxAttempts) {
          await this.verificationTokenRepo.markUsed(token);
          return Result.fail(AppError.tooManyAttempts());
        }
        return Result.fail(AppError.invalidCode());
      }

      await this.verificationTokenRepo.markUsed(token);
      await this.userRepo.update(userId, { phoneVerified: true });

      return Result.ok({ message: "Celular verificado com sucesso." });
    } catch (error) {
      return Result.fail(AppError.internal((error as Error).message));
    }
  }
}

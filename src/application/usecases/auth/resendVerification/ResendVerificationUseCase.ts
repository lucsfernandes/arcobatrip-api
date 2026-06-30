import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { IUserRepo } from "../IUserRepo";
import { AccountEmailEmitter } from "../../../services/AccountEmailEmitter";
import { ResendVerificationRequestDTO } from "./ResendVerificationRequestDTO";
import { ResendVerificationResponseDTO } from "./ResendVerificationResponseDTO";

const GENERIC_MESSAGE =
  "Se o email existir e ainda não tiver sido confirmado, enviaremos um novo link.";

/**
 * Resend the email-verification link. Contract: `POST /auth/resend-verification`.
 * ALWAYS returns the same generic 200 to avoid user enumeration.
 */
export class ResendVerificationUseCase
  implements IUseCase<ResendVerificationRequestDTO, ResendVerificationResponseDTO>
{
  constructor(
    private readonly userRepo: IUserRepo,
    private readonly accountEmailEmitter: AccountEmailEmitter
  ) {}

  async execute(
    request: ResendVerificationRequestDTO
  ): Promise<Result<ResendVerificationResponseDTO>> {
    const { email } = request;

    try {
      const user = await this.userRepo.findByEmail(email);
      if (user && !user.emailVerifiedAt) {
        await this.accountEmailEmitter.sendVerification({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        });
      }

      return Result.ok({ message: GENERIC_MESSAGE });
    } catch (error) {
      return Result.fail(AppError.internal((error as Error).message));
    }
  }
}

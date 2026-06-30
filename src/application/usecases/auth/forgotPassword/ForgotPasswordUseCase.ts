import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { IUserRepo } from "../IUserRepo";
import { AccountEmailEmitter } from "../../../services/AccountEmailEmitter";
import { ForgotPasswordRequestDTO } from "./ForgotPasswordRequestDTO";
import { ForgotPasswordResponseDTO } from "./ForgotPasswordResponseDTO";

const GENERIC_MESSAGE = "Se o email existir, enviaremos instruções.";

/**
 * Start the password-reset flow. Contract: `POST /auth/forgot-password`.
 * ALWAYS returns the same generic 200 to avoid user enumeration.
 */
export class ForgotPasswordUseCase
  implements IUseCase<ForgotPasswordRequestDTO, ForgotPasswordResponseDTO>
{
  constructor(
    private readonly userRepo: IUserRepo,
    private readonly accountEmailEmitter: AccountEmailEmitter
  ) {}

  async execute(
    request: ForgotPasswordRequestDTO
  ): Promise<Result<ForgotPasswordResponseDTO>> {
    const { email } = request;

    try {
      const user = await this.userRepo.findByEmail(email);
      if (user) {
        await this.accountEmailEmitter.sendPasswordReset({
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

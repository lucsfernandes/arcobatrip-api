import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { IUserRepo } from "../../auth/IUserRepo";
import { AccountEmailEmitter } from "../../../services/AccountEmailEmitter";
import { AuditLog } from "../../../services/AuditLog";
import { AuditEvents } from "../../../services/auditEvents";

export interface RequestAccountDeletionRequestDTO {
  /** Authenticated user id. */
  userId: string;
}

export interface RequestAccountDeletionResponseDTO {
  message: string;
}

/**
 * Contract: `POST /users/me/deletion`. Starts the deletion of the signed-in
 * user's account by sending a single-use confirmation link to the account's
 * e-mail. Nothing is deleted yet: the link proves the person controls the
 * address (it works for password and Google accounts alike) and guards against
 * a stolen session wiping the account.
 */
export class RequestAccountDeletionUseCase
  implements IUseCase<RequestAccountDeletionRequestDTO, RequestAccountDeletionResponseDTO>
{
  constructor(
    private readonly userRepo: IUserRepo,
    private readonly accountEmailEmitter: AccountEmailEmitter,
    private readonly audit: AuditLog
  ) {}

  async execute(
    request: RequestAccountDeletionRequestDTO
  ): Promise<Result<RequestAccountDeletionResponseDTO>> {
    try {
      const user = await this.userRepo.findById(request.userId);
      if (!user) {
        return Result.fail(AppError.unauthorized("Conta não encontrada"));
      }

      await this.accountEmailEmitter.sendAccountDeletion({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      });
      await this.audit.record(AuditEvents.AccountDeletionRequested, user.email);

      return Result.ok({ message: "Enviamos um link de confirmação para o seu e-mail." });
    } catch (error) {
      return Result.fail(AppError.internal((error as Error).message));
    }
  }
}

import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { IUserRepo } from "../../auth/IUserRepo";
import { IVerificationTokenRepo } from "../../auth/IVerificationTokenRepo";
import { hashToken } from "../../../utils/token";
import { AuditLog } from "../../../services/AuditLog";
import { AuditEvents } from "../../../services/auditEvents";
import { DeleteAccountUseCase } from "../deleteAccount/DeleteAccountUseCase";

export interface ConfirmAccountDeletionRequestDTO {
  token: string;
}

export interface ConfirmAccountDeletionResponseDTO {
  message: string;
}

const INVALID_LINK = "Link inválido ou expirado";

/**
 * Contract: `POST /users/me/deletion/confirm` with `{ token }`. Needs no session:
 * the link sent to the account's e-mail is the proof. The link is single use,
 * so it is burned BEFORE anything is deleted: if the deletion fails the person
 * asks for a new link, and a replay of the old one finds nothing.
 */
export class ConfirmAccountDeletionUseCase
  implements IUseCase<ConfirmAccountDeletionRequestDTO, ConfirmAccountDeletionResponseDTO>
{
  constructor(
    private readonly userRepo: IUserRepo,
    private readonly verificationTokenRepo: IVerificationTokenRepo,
    private readonly deleteAccount: DeleteAccountUseCase,
    private readonly audit: AuditLog
  ) {}

  async execute(
    request: ConfirmAccountDeletionRequestDTO
  ): Promise<Result<ConfirmAccountDeletionResponseDTO>> {
    try {
      const token = await this.verificationTokenRepo.findValidByHash(
        hashToken(request.token),
        "account_deletion"
      );
      if (!token) return Result.fail(AppError.badRequest(INVALID_LINK));

      const user = await this.userRepo.findById(token.userId);
      if (!user) return Result.fail(AppError.badRequest(INVALID_LINK));

      await this.verificationTokenRepo.markUsed(token);
      await this.audit.record(AuditEvents.AccountDeletionConfirmed, user.email);

      const deleted = await this.deleteAccount.execute({ email: user.email, actor: "user" });
      if (deleted.isFailure) return Result.fail(deleted.errorValue());

      return Result.ok({ message: "Conta excluída." });
    } catch (error) {
      return Result.fail(AppError.internal((error as Error).message));
    }
  }
}

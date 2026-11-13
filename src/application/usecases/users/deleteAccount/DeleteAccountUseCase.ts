import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import logger from "../../../../main/logger";
import { IUserRepo } from "../../auth/IUserRepo";
import { IStorageService } from "../../../services/storage/IStorageService";
import { AuditLog } from "../../../services/AuditLog";
import { AuditEvents } from "../../../services/auditEvents";
import { AccountDeletionCounts, buildDeletionPlan } from "./accountDeletionPlan";
import { IAccountDeletionRepo } from "./IAccountDeletionRepo";

export interface DeleteAccountRequestDTO {
  email: string;
  /** Only report what would happen; change nothing. */
  dryRun?: boolean;
  /** `user` when the person asked through the app, `system` for an operator's command. */
  actor?: "user" | "system";
}

export interface DeleteAccountResponseDTO {
  /** `not_found`: there is no such account (already deleted, or never existed). */
  status: "deleted" | "dry_run" | "not_found";
  counts: AccountDeletionCounts | null;
  /** Images the storage provider failed to remove; they stay recorded in the audit trail. */
  pendingImages: string[];
}

/**
 * Deletes a user's account and data (LGPD). The database work runs in ONE
 * transaction (see `accountDeletionPlan` for the rules); the images at the
 * storage provider are removed after the commit, because they cannot be rolled
 * back. A failed image removal does not undo the deletion: the ids stay in the
 * audit trail so the removal can be retried.
 *
 * Running it again for an account that is already gone is safe: `not_found`.
 */
export class DeleteAccountUseCase
  implements IUseCase<DeleteAccountRequestDTO, DeleteAccountResponseDTO>
{
  constructor(
    private readonly userRepo: IUserRepo,
    private readonly accountRepo: IAccountDeletionRepo,
    private readonly storage: IStorageService,
    private readonly audit: AuditLog
  ) {}

  async execute(request: DeleteAccountRequestDTO): Promise<Result<DeleteAccountResponseDTO>> {
    const dryRun = request.dryRun ?? false;
    const actor = request.actor ?? "user";
    const email = request.email.trim();

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      return Result.ok({ status: "not_found", counts: null, pendingImages: [] });
    }

    let plan;
    try {
      plan = await this.accountRepo.inTransaction(async (tx) => {
        const snapshot = await tx.loadSnapshot({
          id: user.id,
          email: user.email,
          avatarPublicId: user.avatarPublicId ?? null,
        });
        const built = buildDeletionPlan(snapshot);
        if (!dryRun) await tx.applyPlan(built);
        return built;
      });
    } catch (error) {
      // Only the error's name: a database message can quote the data involved.
      logger.error("[DeleteAccountUseCase] transação revertida", { error: (error as Error).name });
      if (!dryRun) {
        await this.audit.record(
          AuditEvents.AccountDeletionFailed,
          email,
          { reason: "transaction_failed" },
          "failed",
          actor
        );
      }
      return Result.fail(AppError.internal("Não foi possível excluir a conta. Nada foi alterado."));
    }

    if (dryRun) {
      return Result.ok({ status: "dry_run", counts: plan.counts, pendingImages: [] });
    }

    const pendingImages: string[] = [];
    // Without credentials the provider call does nothing: count the images as
    // not removed, so they stay in the audit trail to be retried.
    const canRemoveImages = this.storage.isConfigured?.() !== false;
    for (const publicId of plan.imagePublicIds) {
      if (!canRemoveImages) {
        pendingImages.push(publicId);
        continue;
      }
      try {
        await this.storage.deleteImage(publicId);
      } catch (error) {
        logger.warn("[DeleteAccountUseCase] falha ao remover imagem", { error: (error as Error).name });
        pendingImages.push(publicId);
      }
    }

    await this.audit.record(
      AuditEvents.AccountDeleted,
      email,
      {
        ...plan.counts,
        imagesRemoved: plan.imagePublicIds.length - pendingImages.length,
        pendingImages,
      },
      "ok",
      actor
    );

    return Result.ok({ status: "deleted", counts: plan.counts, pendingImages });
  }

  /**
   * Retries the images a previous deletion could not remove, using the ids kept
   * in the audit trail. Records `account.images_retried` with what is still left.
   */
  async retryPendingImages(email: string): Promise<Result<{ retried: number; remaining: string[] }>> {
    const last = await this.audit.latest(AuditEvents.AccountDeleted, email);
    const pending = Array.isArray(last?.details.pendingImages)
      ? (last!.details.pendingImages as string[])
      : [];
    if (pending.length === 0) return Result.ok({ retried: 0, remaining: [] });

    const remaining: string[] = [];
    const canRemoveImages = this.storage.isConfigured?.() !== false;
    for (const publicId of pending) {
      if (!canRemoveImages) {
        remaining.push(publicId);
        continue;
      }
      try {
        await this.storage.deleteImage(publicId);
      } catch {
        remaining.push(publicId);
      }
    }
    await this.audit.record(
      AuditEvents.AccountImagesRetried,
      email,
      { retried: pending.length - remaining.length, remaining },
      remaining.length === 0 ? "ok" : "failed",
      "system"
    );
    return Result.ok({ retried: pending.length - remaining.length, remaining });
  }
}

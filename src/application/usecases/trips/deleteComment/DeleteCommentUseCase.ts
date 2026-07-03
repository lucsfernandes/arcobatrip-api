import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { isTripOwner } from "../tripAuthorization";
import { DeleteCommentRequestDTO } from "./DeleteCommentRequestDTO";

/**
 * Contract: `DELETE /trips/{id}/activities/{activityId}/comments/{commentId}`
 * (soft delete).
 *
 * - 404 when the trip/activity/comment is missing or is not on this chain.
 * - 403 when the caller is neither the comment author nor the trip owner.
 */
export class DeleteCommentUseCase implements IUseCase<DeleteCommentRequestDTO, void> {
  constructor(private readonly tripRepo: ITripContractRepo) {}

  async execute(request: DeleteCommentRequestDTO): Promise<Result<void>> {
    const trip = await this.tripRepo.findTripById(request.tripId);
    if (!trip) {
      return Result.fail(AppError.notFound("Viagem não encontrada"));
    }

    const activity = await this.tripRepo.findActivity(request.tripId, request.activityId);
    if (!activity) {
      return Result.fail(AppError.notFound("Atividade não encontrada"));
    }

    const comment = await this.tripRepo.findComment(request.activityId, request.commentId);
    if (!comment) {
      return Result.fail(AppError.notFound("Comentário não encontrado"));
    }

    const isAuthor = comment.authorId === request.userId;
    if (!isAuthor && !isTripOwner(trip, request.userEmail)) {
      return Result.fail(
        AppError.forbidden("Você não tem permissão para excluir este comentário")
      );
    }

    await this.tripRepo.softDeleteComment(comment.id);
    return Result.ok();
  }
}

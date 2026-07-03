import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { findTripParticipant } from "../tripAuthorization";
import { ActivityCommentContractMap } from "../../../../infra/db/mappers/ActivityCommentContractMap";
import { AddCommentRequestDTO } from "./AddCommentRequestDTO";
import { AddCommentResponseDTO } from "./AddCommentResponseDTO";

/**
 * Contract: `POST /trips/{id}/activities/{activityId}/comments`.
 *
 * - 404 when the trip is missing, the activity is missing, or the activity
 *   belongs to another trip.
 * - 403 when the caller is not a participant of the trip.
 *
 * Any participant may comment. `author_name` snapshots the caller's participant
 * display name so the list renders without a join.
 */
export class AddCommentUseCase
  implements IUseCase<AddCommentRequestDTO, AddCommentResponseDTO>
{
  constructor(private readonly tripRepo: ITripContractRepo) {}

  async execute(request: AddCommentRequestDTO): Promise<Result<AddCommentResponseDTO>> {
    const trip = await this.tripRepo.findTripById(request.tripId);
    if (!trip) {
      return Result.fail(AppError.notFound("Viagem não encontrada"));
    }

    const activity = await this.tripRepo.findActivity(request.tripId, request.activityId);
    if (!activity) {
      return Result.fail(AppError.notFound("Atividade não encontrada"));
    }

    const participant = findTripParticipant(trip, request.userEmail);
    if (!participant) {
      return Result.fail(
        AppError.forbidden("Apenas participantes da viagem podem comentar")
      );
    }

    const comment = await this.tripRepo.addComment(request.activityId, {
      authorId: request.userId,
      authorName: participant.name,
      body: request.body,
    });

    return Result.ok(ActivityCommentContractMap.toContract(comment));
  }
}

import { ActivityComment } from "../../../domain/entities/ActivityComment/activityComment.entity";
import { ActivityCommentContract } from "../../../application/contracts/contract";

const toContract = (model: ActivityComment): ActivityCommentContract => ({
  id: model.id,
  activityId: model.activityId,
  authorId: model.authorId,
  authorName: model.authorName,
  body: model.body,
  createdAt:
    model.createdAt instanceof Date
      ? model.createdAt.toISOString()
      : new Date(model.createdAt).toISOString(),
});

export const ActivityCommentContractMap = { toContract };

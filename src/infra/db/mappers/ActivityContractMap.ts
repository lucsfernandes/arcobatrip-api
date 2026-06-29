import { Activity } from "../../../domain/entities/Activity/activity.entity";
import { ActivityContract, ActivityStatus } from "../../../application/contracts/contract";

const toContract = (model: Activity): ActivityContract => ({
  id: model.id,
  title: model.title,
  at: model.occursAt instanceof Date ? model.occursAt.toISOString() : new Date(model.occursAt).toISOString(),
  status: (model.status === "done" ? "done" : "pending") as ActivityStatus,
});

export const ActivityContractMap = { toContract };

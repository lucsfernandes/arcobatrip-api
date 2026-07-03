import { Activity } from "../../../domain/entities/Activity/activity.entity";
import { ActivityContract, ActivityStatus } from "../../../application/contracts/contract";

const toContract = (model: Activity): ActivityContract => {
  const activity: ActivityContract = {
    id: model.id,
    title: model.title,
    at:
      model.occursAt instanceof Date
        ? model.occursAt.toISOString()
        : new Date(model.occursAt).toISOString(),
    status: (model.status === "done" ? "done" : "pending") as ActivityStatus,
  };
  if (model.description) activity.description = model.description;
  if (model.bannerUrl) activity.bannerUrl = model.bannerUrl;
  return activity;
};

export const ActivityContractMap = { toContract };

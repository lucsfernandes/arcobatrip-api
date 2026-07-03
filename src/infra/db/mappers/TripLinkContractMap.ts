import { Link } from "../../../domain/entities/Link/link.entity";
import { TripLinkContract } from "../../../application/contracts/contract";

const toContract = (model: Link): TripLinkContract => {
  const link: TripLinkContract = {
    id: model.id,
    label: model.title,
    url: model.url,
  };
  if (model.activityId) link.activityId = model.activityId;
  return link;
};

export const TripLinkContractMap = { toContract };

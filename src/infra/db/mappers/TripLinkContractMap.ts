import { Link } from "../../../domain/entities/Link/link.entity";
import { TripLinkContract } from "../../../application/contracts/contract";

const toContract = (model: Link): TripLinkContract => ({
  id: model.id,
  label: model.title,
  url: model.url,
});

export const TripLinkContractMap = { toContract };

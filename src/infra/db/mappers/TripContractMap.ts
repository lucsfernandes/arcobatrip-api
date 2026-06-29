import { Trip } from "../../../domain/entities/Trip/trip.entity";
import { TripContract, TripStatus } from "../../../application/contracts/contract";
import { dayjs } from "../../../presentation/utils/dayjs";
import { GuestContractMap } from "./GuestContractMap";
import { ActivityContractMap } from "./ActivityContractMap";
import { TripLinkContractMap } from "./TripLinkContractMap";

/**
 * Derive the trip status from today's date:
 * - `upcoming` when the start date is in the future,
 * - `past` when the end date is already in the past,
 * - `active` otherwise (the trip is happening now).
 */
export function deriveTripStatus(startDate: string, endDate: string): TripStatus {
  const today = dayjs().startOf("day");
  const start = dayjs(startDate).startOf("day");
  const end = dayjs(endDate).startOf("day");
  if (start.isAfter(today)) return "upcoming";
  if (end.isBefore(today)) return "past";
  return "active";
}

const toContract = (model: Trip): TripContract => {
  const trip: TripContract = {
    id: model.id,
    destination: model.destination,
    startDate: model.startsAt,
    endDate: model.endsAt,
    status: deriveTripStatus(model.startsAt, model.endsAt),
    guests: (model.participants ?? []).map(GuestContractMap.toContract),
    activities: (model.activities ?? [])
      .map(ActivityContractMap.toContract)
      .sort((a, b) => a.at.localeCompare(b.at)),
    links: (model.links ?? []).map(TripLinkContractMap.toContract),
  };
  if (model.coverUrl) trip.coverUrl = model.coverUrl;
  return trip;
};

export const TripContractMap = { toContract };

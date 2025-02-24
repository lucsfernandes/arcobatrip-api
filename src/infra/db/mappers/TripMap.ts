import { ITrip } from "../../../domain/entities/Trip/ITrip";
import { Trip } from "../../../domain/entities/Trip/trip.entity";

const toDomain = (model: Trip): ITrip => ({
  id: model.id,
  destination: model.destination,
  startsAt: model.startsAt,
  endsAt: model.endsAt,
  participants: model.participants.map(p => ({
    id: p.id,
    name: p.name,
    email: p.email,
    isConfirmed: p.isConfirmed,
    isOwner: p.isOwner,
    tripId: p.tripId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  })),
  // activities: model.activities,
  // links: model.links,
  // users: model.users,
})

const TripMap = {
  toDomain,
}

export { TripMap };
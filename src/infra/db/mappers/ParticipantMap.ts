import { IParticipant } from "../../../domain/entities/Participant/IParticipant";
import { Participant } from "../../../domain/entities/Participant/participant.entity";

const toDomain = (model: IParticipant): Participant => ({
  id: model.id,
  name: model.name,
  email: model.email,
  isConfirmed: model.isConfirmed,
  isOwner: model.isOwner,
  tripId: model.tripId || "",
  createdAt: model.createdAt,
  updatedAt: model.updatedAt,
});

const toArrayDomain = (array: any): Participant[] => {
  return array.map((model: IParticipant) => toDomain(model));
}

const ParticipantMap = {
  toDomain,
  toArrayDomain,
}

export { ParticipantMap };
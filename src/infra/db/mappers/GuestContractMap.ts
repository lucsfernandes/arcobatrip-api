import { Participant } from "../../../domain/entities/Participant/participant.entity";
import { GuestContract, GuestStatus } from "../../../application/contracts/contract";

/** Derive the contract guest status from the participant flags. */
export function deriveGuestStatus(p: Pick<Participant, "isOwner" | "isConfirmed">): GuestStatus {
  if (p.isOwner) return "host";
  if (p.isConfirmed) return "confirmed";
  return "pending";
}

const toContract = (model: Participant): GuestContract => {
  const guest: GuestContract = {
    id: model.id,
    name: model.name,
    email: model.email,
    status: deriveGuestStatus(model),
  };
  if (model.accent) guest.accent = model.accent;
  if (model.avatarUrl) guest.avatarUrl = model.avatarUrl;
  return guest;
};

export const GuestContractMap = { toContract };

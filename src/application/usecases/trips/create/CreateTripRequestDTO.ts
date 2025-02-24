export interface ParticipantToInvite {
  name: string;
  email: string;
}

export interface CreateTripRequestDTO {
  destination: string;
  startsAt: string;
  endsAt: string;
  ownerName: string;
  ownerEmail: string;
  participantToInvite: ParticipantToInvite[];
}
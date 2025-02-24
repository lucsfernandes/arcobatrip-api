export interface CreateParticipantRequestDTO {
  name: string;
  email: string;
  isOwner: boolean;
  isConfirmed: boolean;
  tripId?: string | undefined;
}
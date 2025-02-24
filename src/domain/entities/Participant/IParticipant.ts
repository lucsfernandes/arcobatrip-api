export interface IParticipant {
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
  isConfirmed: boolean;
  tripId?: string;
  createdAt: Date;
  updatedAt: Date;
}
import { IParticipant } from '../../../domain/entities/Participant/IParticipant';
import { ITransactionRepo } from '../../../infra/repositories/ITransactionRepo';

export type CreateParticipantPayload = Omit<IParticipant, "id" | "createdAt" | "updatedAt">;
export type UpdateParticipantPayload = Omit<IParticipant, "id" | "tripId">;


export interface IParticipantRepo extends ITransactionRepo {
  findOneByEmail(email: string): Promise<IParticipant | null>;
  create(payload: CreateParticipantPayload): Promise<IParticipant | null>;
  update(id: string, payload: UpdateParticipantPayload): Promise<IParticipant | null>;
}
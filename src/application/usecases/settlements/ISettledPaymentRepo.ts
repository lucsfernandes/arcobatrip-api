import { SettledPayment } from "../../../domain/entities/SettledPayment/settledPayment.entity";

export interface CreateSettledPaymentData {
  tripId: string;
  fromId: string;
  toId: string;
  amount: number;
}

export interface ISettledPaymentRepo {
  /** All recorded (non-soft-deleted) payments of a trip, oldest first. */
  findByTrip(tripId: string): Promise<SettledPayment[]>;
  /** A single recorded payment scoped to its trip, or null when absent. */
  findByIdForTrip(tripId: string, id: string): Promise<SettledPayment | null>;
  create(data: CreateSettledPaymentData): Promise<SettledPayment>;
  softDelete(id: string): Promise<void>;
}

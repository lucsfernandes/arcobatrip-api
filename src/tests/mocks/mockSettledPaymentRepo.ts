import {
  CreateSettledPaymentData,
  ISettledPaymentRepo,
} from "../../application/usecases/settlements/ISettledPaymentRepo";
import { SettledPayment } from "../../domain/entities/SettledPayment/settledPayment.entity";

/**
 * In-memory {@link ISettledPaymentRepo} for use-case unit tests. Records created
 * payments and honors soft delete (deleted rows are excluded from reads).
 */
export class MockSettledPaymentRepo implements ISettledPaymentRepo {
  public created: CreateSettledPaymentData[] = [];
  private payments: SettledPayment[] = [];
  /** ids passed to softDelete, for assertions. */
  public softDeleted: string[] = [];

  /** Seed a pre-existing payment (e.g. to test discounting or deletion). */
  seed(payment: SettledPayment): void {
    this.payments.push(payment);
  }

  async findByTrip(tripId: string): Promise<SettledPayment[]> {
    return this.payments.filter((p) => p.tripId === tripId && !p.deletedAt);
  }

  async findByIdForTrip(
    tripId: string,
    id: string
  ): Promise<SettledPayment | null> {
    return (
      this.payments.find(
        (p) => p.id === id && p.tripId === tripId && !p.deletedAt
      ) ?? null
    );
  }

  async create(data: CreateSettledPaymentData): Promise<SettledPayment> {
    this.created.push(data);
    const payment = {
      id: `settlement-${this.created.length}`,
      tripId: data.tripId,
      fromId: data.fromId,
      toId: data.toId,
      amount: data.amount,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SettledPayment;
    this.payments.push(payment);
    return payment;
  }

  async softDelete(id: string): Promise<void> {
    this.softDeleted.push(id);
    const payment = this.payments.find((p) => p.id === id);
    if (payment) payment.deletedAt = new Date();
  }

  clear(): void {
    this.created = [];
    this.payments = [];
    this.softDeleted = [];
  }
}

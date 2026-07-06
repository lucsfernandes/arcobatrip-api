import { DataSource, Repository } from "typeorm";
import {
  CreateSettledPaymentData,
  ISettledPaymentRepo,
} from "../../application/usecases/settlements/ISettledPaymentRepo";
import { SettledPayment } from "../../domain/entities/SettledPayment/settledPayment.entity";

export class SettledPaymentRepo implements ISettledPaymentRepo {
  private repository: Repository<SettledPayment>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(SettledPayment);
  }

  async findByTrip(tripId: string): Promise<SettledPayment[]> {
    return this.repository.find({
      where: { tripId },
      order: { createdAt: "ASC" },
    });
  }

  async findByIdForTrip(
    tripId: string,
    id: string
  ): Promise<SettledPayment | null> {
    return this.repository.findOne({ where: { id, tripId } });
  }

  async create(data: CreateSettledPaymentData): Promise<SettledPayment> {
    const payment = this.repository.create({
      tripId: data.tripId,
      fromId: data.fromId,
      toId: data.toId,
      amount: data.amount,
    });
    return this.repository.save(payment);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}

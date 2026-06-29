import { DataSource, Repository } from "typeorm";
import { CreateExpenseData, IExpenseRepo } from "../../application/usecases/expenses/IExpenseRepo";
import { Expense } from "../../domain/entities/Expense/expense.entity";

export class ExpenseRepo implements IExpenseRepo {
  private expenseRepository: Repository<Expense>;

  constructor(private readonly dataSource: DataSource) {
    this.expenseRepository = dataSource.getRepository(Expense);
  }

  async findByTrip(tripId: string): Promise<Expense[]> {
    return this.expenseRepository.find({
      where: { tripId },
      order: { createdAt: "ASC" },
    });
  }

  async create(data: CreateExpenseData): Promise<Expense> {
    const expense = this.expenseRepository.create({
      tripId: data.tripId,
      title: data.title,
      amount: data.amount,
      category: data.category,
      paidById: data.paidById,
      splitBetween: data.splitBetween,
    });
    return this.expenseRepository.save(expense);
  }
}

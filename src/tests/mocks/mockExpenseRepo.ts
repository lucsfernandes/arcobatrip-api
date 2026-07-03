import { CreateExpenseData, IExpenseRepo } from "../../application/usecases/expenses/IExpenseRepo";
import { Expense } from "../../domain/entities/Expense/expense.entity";

/** In-memory {@link IExpenseRepo} recording created expenses for assertions. */
export class MockExpenseRepo implements IExpenseRepo {
  public created: CreateExpenseData[] = [];
  private expenses: Expense[] = [];

  async findByTrip(tripId: string): Promise<Expense[]> {
    return this.expenses.filter((e) => e.tripId === tripId);
  }

  async create(data: CreateExpenseData): Promise<Expense> {
    this.created.push(data);
    const expense = {
      id: `expense-${this.created.length}`,
      tripId: data.tripId,
      title: data.title,
      amount: data.amount,
      category: data.category,
      paidById: data.paidById,
      splitBetween: data.splitBetween,
      activityId: data.activityId ?? null,
    } as Expense;
    this.expenses.push(expense);
    return expense;
  }

  clear(): void {
    this.created = [];
    this.expenses = [];
  }
}

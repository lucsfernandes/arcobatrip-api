import { Expense } from "../../../domain/entities/Expense/expense.entity";
import { ExpenseCategory } from "../../contracts/contract";

export interface CreateExpenseData {
  tripId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paidById: string;
  splitBetween: string[];
}

export interface IExpenseRepo {
  findByTrip(tripId: string): Promise<Expense[]>;
  create(data: CreateExpenseData): Promise<Expense>;
}

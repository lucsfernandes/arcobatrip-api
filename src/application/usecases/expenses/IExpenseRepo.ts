import { Expense } from "../../../domain/entities/Expense/expense.entity";
import { ExpenseCategory } from "../../contracts/contract";

export interface CreateExpenseData {
  tripId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paidById: string;
  splitBetween: string[];
  /** OPTIONAL activity tag (must belong to the same trip; validated upstream). */
  activityId?: string | null;
}

export interface IExpenseRepo {
  findByTrip(tripId: string): Promise<Expense[]>;
  create(data: CreateExpenseData): Promise<Expense>;
}

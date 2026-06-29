import { ExpenseCategory } from "../../../application/contracts/contract";

export interface IExpense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paidById: string;
  splitBetween: string[];
  tripId: string;
}

import { ExpenseCategory } from "../../../contracts/contract";

export interface CreateExpenseRequestDTO {
  tripId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paidById: string;
  splitBetween: string[];
}

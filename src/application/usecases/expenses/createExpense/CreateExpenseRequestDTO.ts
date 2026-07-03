import { ExpenseCategory } from "../../../contracts/contract";

export interface CreateExpenseRequestDTO {
  tripId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paidById: string;
  splitBetween: string[];
  /** OPTIONAL activity to tag the expense to; must belong to the trip. */
  activityId?: string;
}

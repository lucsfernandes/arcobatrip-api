import { Expense } from "../../../domain/entities/Expense/expense.entity";
import { ExpenseContract, ExpenseCategory } from "../../../application/contracts/contract";

const toContract = (model: Expense): ExpenseContract => ({
  id: model.id,
  title: model.title,
  amount: typeof model.amount === "string" ? parseFloat(model.amount) : model.amount,
  category: model.category as ExpenseCategory,
  paidById: model.paidById,
  splitBetween: model.splitBetween ?? [],
});

export const ExpenseContractMap = { toContract };

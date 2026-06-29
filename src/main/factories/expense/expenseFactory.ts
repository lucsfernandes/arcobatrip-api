import { tripContractRepo, expenseRepo } from "../typeOrmRepoFactory";
import { GetExpensesUseCase } from "../../../application/usecases/expenses/getExpenses/GetExpensesUseCase";
import { CreateExpenseUseCase } from "../../../application/usecases/expenses/createExpense/CreateExpenseUseCase";
import { GetExpensesController } from "../../../presentation/controllers/Expense/GetExpensesController";
import { CreateExpenseController } from "../../../presentation/controllers/Expense/CreateExpenseController";

const getExpensesUseCase = new GetExpensesUseCase(tripContractRepo, expenseRepo);
const createExpenseUseCase = new CreateExpenseUseCase(tripContractRepo, expenseRepo);

const getExpensesController = new GetExpensesController(getExpensesUseCase);
const createExpenseController = new CreateExpenseController(createExpenseUseCase);

export { getExpensesController, createExpenseController };

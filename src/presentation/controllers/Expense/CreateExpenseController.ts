import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { CreateExpenseUseCase } from "../../../application/usecases/expenses/createExpense/CreateExpenseUseCase";

export class CreateExpenseController extends BaseController {
  constructor(private createExpenseUseCase: CreateExpenseUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const { body } = req;
    const result = await this.createExpenseUseCase.execute({
      tripId: req.params.id,
      title: body.title,
      amount: body.amount,
      category: body.category,
      paidById: body.paidById,
      splitBetween: body.splitBetween,
    });
    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.created(res, result.getValue());
  }
}

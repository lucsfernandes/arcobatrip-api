import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { GetExpensesUseCase } from "../../../application/usecases/expenses/getExpenses/GetExpensesUseCase";

export class GetExpensesController extends BaseController {
  constructor(private getExpensesUseCase: GetExpensesUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const result = await this.getExpensesUseCase.execute({ tripId: req.params.id });
    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.ok(res, result.getValue());
  }
}

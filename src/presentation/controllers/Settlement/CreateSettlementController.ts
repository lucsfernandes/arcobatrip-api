import { Response } from "express";
import { BaseController } from "../BaseController";
import { CreateSettlementUseCase } from "../../../application/usecases/settlements/createSettlement/CreateSettlementUseCase";
import { AppError } from "../../../application/errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/** Contract: `POST /trips/{id}/settlements`. 201 with the recorded payment. */
export class CreateSettlementController extends BaseController {
  constructor(private readonly createSettlementUseCase: CreateSettlementUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userEmail = req.userEmail;
    if (!userEmail) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    const { body } = req;
    const result = await this.createSettlementUseCase.execute({
      tripId: req.params.id,
      from: body.from,
      to: body.to,
      amount: body.amount,
      userEmail,
    });

    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.created(res, result.getValue());
  }
}

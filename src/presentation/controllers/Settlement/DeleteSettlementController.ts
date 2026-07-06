import { Response } from "express";
import { BaseController } from "../BaseController";
import { DeleteSettlementUseCase } from "../../../application/usecases/settlements/deleteSettlement/DeleteSettlementUseCase";
import { AppError } from "../../../application/errors/AppError";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

/** Contract: `DELETE /trips/{id}/settlements/{settlementId}`. 204. */
export class DeleteSettlementController extends BaseController {
  constructor(private readonly deleteSettlementUseCase: DeleteSettlementUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userEmail = req.userEmail;
    if (!userEmail) {
      return this.fail(res, AppError.unauthorized("Usuário não autenticado"));
    }

    const result = await this.deleteSettlementUseCase.execute({
      tripId: req.params.id,
      settlementId: req.params.settlementId,
      userEmail,
    });

    if (result.isFailure) return this.fail(res, result.errorValue());
    return res.status(204).send();
  }
}

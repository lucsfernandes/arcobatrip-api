import { Response } from "express";
import { BaseController } from "../BaseController";
import { RemoveGuestUseCase } from "../../../application/usecases/trips/removeGuest/RemoveGuestUseCase";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

export class RemoveGuestController extends BaseController {
  constructor(private removeGuestUseCase: RemoveGuestUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const result = await this.removeGuestUseCase.execute({
      tripId: req.params.id,
      guestId: req.params.guestId,
      userEmail: req.userEmail ?? "",
    });
    if (result.isFailure) return this.fail(res, result.errorValue());
    return res.status(204).send();
  }
}

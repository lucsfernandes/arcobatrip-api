import { Response } from "express";
import { BaseController } from "../BaseController";
import { MarkNotificationReadUseCase } from "../../../application/usecases/notifications/markRead/MarkNotificationReadUseCase";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

export class MarkNotificationReadController extends BaseController {
  constructor(private markNotificationReadUseCase: MarkNotificationReadUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const result = await this.markNotificationReadUseCase.execute({
      userId: req.userId ?? "",
      notificationId: req.params.id,
    });
    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.ok(res, result.getValue());
  }
}

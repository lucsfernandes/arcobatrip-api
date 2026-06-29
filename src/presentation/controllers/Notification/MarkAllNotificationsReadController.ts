import { Response } from "express";
import { BaseController } from "../BaseController";
import { MarkAllNotificationsReadUseCase } from "../../../application/usecases/notifications/markAllRead/MarkAllNotificationsReadUseCase";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

export class MarkAllNotificationsReadController extends BaseController {
  constructor(private markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const result = await this.markAllNotificationsReadUseCase.execute({ userId: req.userId ?? "" });
    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.ok(res, result.getValue());
  }
}

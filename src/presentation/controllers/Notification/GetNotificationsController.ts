import { Response } from "express";
import { BaseController } from "../BaseController";
import { GetNotificationsUseCase } from "../../../application/usecases/notifications/getNotifications/GetNotificationsUseCase";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";

export class GetNotificationsController extends BaseController {
  constructor(private getNotificationsUseCase: GetNotificationsUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const result = await this.getNotificationsUseCase.execute({ userId: req.userId ?? "" });
    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.ok(res, result.getValue());
  }
}

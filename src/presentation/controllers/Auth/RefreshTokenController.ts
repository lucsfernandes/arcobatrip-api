import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { RefreshTokenUseCase } from "../../../application/usecases/auth/refresh/RefreshTokenUseCase";

export class RefreshTokenController extends BaseController {
  constructor(private refreshTokenUseCase: RefreshTokenUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const { body } = req;

    const result = await this.refreshTokenUseCase.execute({
      refreshToken: body.refreshToken
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    return this.ok(res, result.getValue());
  }
}

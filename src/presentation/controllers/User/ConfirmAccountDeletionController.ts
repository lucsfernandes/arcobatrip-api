import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { ConfirmAccountDeletionUseCase } from "../../../application/usecases/users/confirmAccountDeletion/ConfirmAccountDeletionUseCase";
import { clearAuthCookies } from "../../http/authCookies";

/**
 * Contract: `POST /users/me/deletion/confirm` with `{ token }`. Public: the link in
 * the e-mail is the proof, so no session is needed. On success the session cookies
 * are cleared; a bad or used link leaves whatever session the browser has alone.
 */
export class ConfirmAccountDeletionController extends BaseController {
  constructor(private readonly useCase: ConfirmAccountDeletionUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const result = await this.useCase.execute({ token: req.body.token });
    if (result.isFailure) return this.fail(res, result.errorValue());

    clearAuthCookies(res);
    return this.ok(res, result.getValue());
  }
}

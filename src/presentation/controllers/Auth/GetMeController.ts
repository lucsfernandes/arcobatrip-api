import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { IUserRepo } from "../../../application/usecases/auth/IUserRepo";
import { UseCaseError } from "../../../application/errors/UseCaseError";

export class GetMeController extends BaseController {
  constructor(private userRepo: IUserRepo) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const userId = (req as any).userId;

    if (!userId) {
      return this.fail(res, new UseCaseError("Usuário não autenticado", 401));
    }

    const user = await this.userRepo.findById(userId);

    if (!user) {
      return this.fail(res, new UseCaseError("Usuário não encontrado", 404));
    }

    return this.ok(res, { data: user });
  }
}

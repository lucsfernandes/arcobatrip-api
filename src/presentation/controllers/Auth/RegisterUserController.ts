import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { RegisterUserUseCase } from "../../../application/usecases/auth/register/RegisterUserUseCase";

export class RegisterUserController extends BaseController {
  constructor(private registerUserUseCase: RegisterUserUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const { body } = req;

    const result = await this.registerUserUseCase.execute({
      fullName: body.full_name,
      phone: body.phone,
      email: body.email,
      password: body.password,
      confirmPassword: body.confirm_password,
      birthDate: body.birth_date
    });

    if (result.isFailure) {
      return this.fail(res, result.errorValue());
    }

    return this.created(res, { data: result.getValue() });
  }
}

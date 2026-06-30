import bcrypt from "bcryptjs";
import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { IUserRepo } from "../IUserRepo";
import { ITokenService } from "../ITokenService";
import { SignupRequestDTO } from "./SignupRequestDTO";
import { SignupResponseDTO } from "./SignupResponseDTO";
import { UserMap } from "../../../../infra/db/mappers/UserMap";
import { AccountEmailEmitter } from "../../../services/AccountEmailEmitter";

/**
 * Register a new account and start a session. Contract: `POST /auth/signup`.
 * Validates the password length, rejects duplicate emails with `email_conflict`,
 * hashes the password (bcryptjs), persists the user and issues a bearer token.
 * After the user is created, fires the welcome + verification emails
 * (best-effort — failures never break signup).
 */
export class SignupUseCase implements IUseCase<SignupRequestDTO, SignupResponseDTO> {
  constructor(
    private readonly userRepo: IUserRepo,
    private readonly tokenService: ITokenService,
    private readonly accountEmailEmitter?: AccountEmailEmitter
  ) {}

  async execute(request: SignupRequestDTO): Promise<Result<SignupResponseDTO>> {
    const { name, email, password } = request;

    if (!password || password.length < 8) {
      return Result.fail(AppError.validation("A senha deve ter pelo menos 8 caracteres", [
        { path: "password", message: "A senha deve ter pelo menos 8 caracteres" },
      ]));
    }

    try {
      const emailExists = await this.userRepo.existsByEmail(email);
      if (emailExists) {
        return Result.fail(AppError.emailConflict());
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await this.userRepo.create({
        fullName: name,
        email,
        password: hashedPassword,
      });

      if (!user) {
        return Result.fail(AppError.internal("Não foi possível criar o usuário"));
      }

      const token = this.tokenService.generateToken({
        userId: user.id,
        email: user.email,
      });

      // Best-effort welcome + verification emails — must not fail the signup.
      await this.accountEmailEmitter?.onSignup({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      });

      return Result.ok({
        token,
        user: UserMap.toContract(user),
      });
    } catch (error) {
      return Result.fail(AppError.internal((error as Error).message));
    }
  }
}

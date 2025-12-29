import bcrypt from "bcryptjs";
import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { UseCaseError } from "../../../errors/UseCaseError";
import { IUserRepo } from "../IUserRepo";
import { LoginUserRequestDTO } from "./LoginUserRequestDTO";
import { LoginUserResponseDTO } from "./LoginUserResponseDTO";
import { ITokenService } from "../ITokenService";
import { env } from "../../../../main/config/env";

export class LoginUserUseCase implements IUseCase<LoginUserRequestDTO, LoginUserResponseDTO> {
  constructor(
    private userRepo: IUserRepo,
    private tokenService: ITokenService
  ) {}

  async execute(request: LoginUserRequestDTO): Promise<Result<LoginUserResponseDTO>> {
    const { email, password } = request;

    try {
      // Buscar usuário com senha
      const user = await this.userRepo.findByEmailWithPassword(email);

      if (!user) {
        return Result.fail(new UseCaseError("Credenciais inválidas", 401));
      }

      // Verificar se usuário está ativo
      if (!user.isActive) {
        return Result.fail(new UseCaseError("Usuário inativo. Entre em contato com o suporte", 403));
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return Result.fail(new UseCaseError("Credenciais inválidas", 401));
      }

      // Gerar par de tokens JWT
      const tokenPair = this.tokenService.generateTokenPair({
        userId: user.id,
        email: user.email
      });

      return Result.ok({
        user: {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          birthDate: user.birthDate,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: env.JWT_EXPIRES_IN
      });
    } catch (error: any) {
      return Result.fail(new UseCaseError(error.message || "Erro interno do servidor", 500));
    }
  }
}

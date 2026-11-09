import bcrypt from "bcryptjs";
import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { UseCaseError } from "../../../errors/UseCaseError";
import { IUserRepo } from "../IUserRepo";
import { LoginUserRequestDTO } from "./LoginUserRequestDTO";
import { LoginUserResponseDTO } from "./LoginUserResponseDTO";
import { ITokenService } from "../ITokenService";
import { env } from "../../../../main/config/env";

/**
 * Fixed bcrypt hash (cost 12) of an arbitrary throwaway string. Used ONLY as a
 * timing decoy: when the email does not exist we still run a bcrypt.compare
 * against this so the response time does not reveal account existence.
 */
const DUMMY_PASSWORD_HASH = "$2b$12$oR9QqvF1EZt.hQgZS7zTluwOKxb0SfcVlgK35MGC2j.BW.1fOP.qG";

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

      // Anti-enumeração: mesma resposta 401 e mesmo custo de tempo quer o email
      // exista ou não. Quando não existe, comparamos contra um hash fixo (decoy)
      // para nivelar o timing do bcrypt e não revelar a existência da conta.
      if (!user) {
        await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
        return Result.fail(new UseCaseError("Credenciais inválidas", 401));
      }

      // Verificar senha ANTES de qualquer distinção de estado da conta: só quem
      // já provou conhecer as credenciais válidas pode observar o status "inativo".
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return Result.fail(new UseCaseError("Credenciais inválidas", 401));
      }

      // Conta desativada — só revelado após credenciais corretas (não vaza
      // existência a quem não conhece a senha).
      if (!user.isActive) {
        return Result.fail(new UseCaseError("Usuário inativo. Entre em contato com o suporte", 403));
      }

      // Gerar par de tokens JWT
      const tokenPair = this.tokenService.generateTokenPair({
        userId: user.id,
        email: user.email
      });

      return Result.ok({
        // The full public user: the clients render the session user right after
        // login (avatar in the header, accent for the initials fallback), so
        // `avatarUrl`/`accent` must be here — they used to be dropped, and the
        // mobile Home/Profile showed initials instead of the photo.
        user: {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          birthDate: user.birthDate,
          avatarUrl: user.avatarUrl,
          avatarPublicId: user.avatarPublicId,
          bio: user.bio,
          city: user.city,
          country: user.country,
          accent: user.accent,
          phoneVerified: user.phoneVerified ?? false,
          isActive: user.isActive,
          emailVerifiedAt: user.emailVerifiedAt,
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

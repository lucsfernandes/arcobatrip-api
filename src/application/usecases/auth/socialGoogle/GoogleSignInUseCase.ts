import crypto from "crypto";
import bcrypt from "bcryptjs";
import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { IUserRepo } from "../IUserRepo";
import { ITokenService } from "../ITokenService";
import { IGoogleTokenVerifier } from "../IGoogleTokenVerifier";
import { GoogleSignInRequestDTO } from "./GoogleSignInRequestDTO";
import { GoogleSignInResponseDTO } from "./GoogleSignInResponseDTO";
import { IUserPublic } from "../../../../domain/entities/User/IUser";

/**
 * Google Sign-In (OIDC). Contract: `POST /auth/social/google`.
 *
 * The mobile app obtains a Google ID token and posts it here. We verify it with
 * {@link IGoogleTokenVerifier}, then:
 *  - existing email → automatic account link (issue a session), or
 *  - unknown email → create a password-less social account (email pre-verified,
 *    avatar from the Google picture).
 *
 * Mirrors {@link LoginUserUseCase}: returns the same `{ accessToken, refreshToken,
 * user }` triple the login controller emits.
 */
export class GoogleSignInUseCase
  implements IUseCase<GoogleSignInRequestDTO, GoogleSignInResponseDTO>
{
  constructor(
    private readonly userRepo: IUserRepo,
    private readonly tokenService: ITokenService,
    private readonly googleVerifier: IGoogleTokenVerifier
  ) {}

  async execute(
    request: GoogleSignInRequestDTO
  ): Promise<Result<GoogleSignInResponseDTO>> {
    // Falha clara (não crash) quando GOOGLE_CLIENT_ID não está configurado.
    if (!this.googleVerifier.isConfigured()) {
      return Result.fail(AppError.googleNotConfigured());
    }

    try {
      const identity = await this.googleVerifier.verify(request.idToken);
      if (!identity) {
        return Result.fail(
          AppError.unauthorized("Não foi possível validar o login do Google")
        );
      }

      // Só confiamos no email quando o próprio Google o marcou como verificado.
      const email = identity.email?.trim();
      if (!email || identity.emailVerified !== true) {
        return Result.fail(AppError.googleEmailUnverified());
      }

      // Conta já existe → link automático: apenas emitimos uma sessão.
      let user: IUserPublic | null = await this.userRepo.findByEmail(email);

      if (!user) {
        // Conta nova (login social, SEM senha). A coluna `password` é NOT NULL,
        // então gravamos o hash de um segredo aleatório: satisfaz o schema e, como
        // ninguém conhece o valor de origem, o login por senha fica impossível
        // para esta conta. O email já vem verificado pelo Google.
        const randomSecret = crypto.randomBytes(32).toString("hex");
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(randomSecret, salt);

        // Nome do Google, ou derivado do email quando o Google não o fornece.
        const fullName = identity.name?.trim() || email.split("@")[0];

        user = await this.userRepo.create({
          fullName,
          email,
          password: hashedPassword,
          avatarUrl: identity.picture ?? undefined,
          emailVerifiedAt: new Date(),
        });

        if (!user) {
          return Result.fail(AppError.internal("Não foi possível criar o usuário"));
        }
      }

      const { accessToken, refreshToken } = this.tokenService.generateTokenPair({
        userId: user.id,
        email: user.email,
      });

      return Result.ok({ user, accessToken, refreshToken });
    } catch (error) {
      return Result.fail(AppError.internal((error as Error).message));
    }
  }
}

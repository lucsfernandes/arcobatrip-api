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

const BCRYPT_ROUNDS = 12;

/** bcrypt hash of a random secret nobody knows — makes password login impossible. */
async function unusablePasswordHash(): Promise<string> {
  const randomSecret = crypto.randomBytes(32).toString("hex");
  return bcrypt.hash(randomSecret, BCRYPT_ROUNDS);
}

/**
 * Google Sign-In (OIDC). Contract: `POST /auth/social/google`.
 *
 * The app obtains a Google ID token and posts it here. After verifying it:
 *  - known e-mail → links to that account and issues a session;
 *  - unknown e-mail → creates a password-less account (e-mail already verified
 *    by Google, avatar from the Google picture).
 *
 * Account pre-takeover guard: if the existing account never confirmed its
 * e-mail, whoever created it may not own the address. Google proves ownership
 * now, so the e-mail is marked verified and the old password is replaced by an
 * unusable one (the real owner can set a password via "Esqueci a senha").
 */
export class GoogleSignInUseCase
  implements IUseCase<GoogleSignInRequestDTO, GoogleSignInResponseDTO>
{
  constructor(
    private readonly userRepo: IUserRepo,
    private readonly tokenService: ITokenService,
    private readonly googleVerifier: IGoogleTokenVerifier
  ) {}

  async execute(request: GoogleSignInRequestDTO): Promise<Result<GoogleSignInResponseDTO>> {
    if (!this.googleVerifier.isConfigured()) {
      return Result.fail(AppError.googleNotConfigured());
    }

    try {
      const identity = await this.googleVerifier.verify(request.idToken);
      if (!identity) {
        return Result.fail(AppError.unauthorized("Não foi possível validar o login do Google"));
      }

      // Only trust the e-mail when Google itself marks it as verified.
      const email = identity.email?.trim();
      if (!email || identity.emailVerified !== true) {
        return Result.fail(AppError.googleEmailUnverified());
      }

      const existingUser = await this.userRepo.findByEmail(email);
      let signedInUser: IUserPublic | null;

      if (existingUser) {
        if (!existingUser.isActive) {
          return Result.fail(AppError.forbidden("Usuário inativo. Entre em contato com o suporte"));
        }
        signedInUser = existingUser.emailVerifiedAt
          ? existingUser
          : await this.userRepo.update(existingUser.id, {
              emailVerifiedAt: new Date(),
              password: await unusablePasswordHash(),
            });
      } else {
        signedInUser = await this.userRepo.create({
          fullName: identity.name?.trim() || email.split("@")[0],
          email,
          password: await unusablePasswordHash(),
          avatarUrl: identity.picture ?? null,
          emailVerifiedAt: new Date(),
        });
      }

      if (!signedInUser) {
        return Result.fail(AppError.internal("Não foi possível concluir o login com Google"));
      }

      const { accessToken, refreshToken } = this.tokenService.generateTokenPair({
        userId: signedInUser.id,
        email: signedInUser.email,
      });

      return Result.ok({ user: signedInUser, accessToken, refreshToken });
    } catch (error) {
      return Result.fail(AppError.internal((error as Error).message));
    }
  }
}

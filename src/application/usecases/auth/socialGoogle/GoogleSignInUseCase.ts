import crypto from "crypto";
import bcrypt from "bcryptjs";
import { IUseCase } from "../../IUseCase";
import { IAuditLog } from "../../../services/AuditLog";
import { AuditEvents } from "../../../services/auditEvents";
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
 * e-mail, whoever created it (and knows its password) may not own the address.
 * Linking it to Google would let that person keep signing in with the
 * password, so the account is NOT taken over and its password is NOT touched:
 * the call answers 409 `account_email_unconfirmed`, telling the user to sign
 * in with the password and confirm the e-mail, or to reset the password.
 *
 * No confirmation link is sent from here on purpose: that would prompt the
 * e-mail's owner to confirm an account someone else may have created, leaving
 * that person's password in place. A password reset proves ownership AND
 * replaces the password, so it also confirms the e-mail.
 *
 * A confirmed account always keeps its password, so both sign-in methods work.
 */
export class GoogleSignInUseCase
  implements IUseCase<GoogleSignInRequestDTO, GoogleSignInResponseDTO>
{
  constructor(
    private readonly userRepo: IUserRepo,
    private readonly tokenService: ITokenService,
    private readonly googleVerifier: IGoogleTokenVerifier,
    private readonly audit?: IAuditLog
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
        if (!existingUser.emailVerifiedAt) {
          return Result.fail(AppError.accountEmailUnconfirmed());
        }
        signedInUser = existingUser;
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

      await this.audit?.record(AuditEvents.AuthLogin, signedInUser.email, { method: "google" });

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

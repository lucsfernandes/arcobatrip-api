import { OAuth2Client } from "google-auth-library";
import {
  GoogleIdentity,
  IGoogleTokenVerifier,
} from "../../application/usecases/auth/IGoogleTokenVerifier";
import { env } from "../../main/config/env";
import logger from "../../main/logger";

/**
 * Verifies Google Sign-In (OIDC) ID tokens with `google-auth-library`.
 *
 * `GOOGLE_CLIENT_ID` may hold a COMMA-SEPARATED list of OAuth client IDs (web +
 * android + ios); every entry is passed to `verifyIdToken` as an `audience` so a
 * token minted for any of the app's platforms is accepted.
 */
export class GoogleTokenVerifier implements IGoogleTokenVerifier {
  private readonly client = new OAuth2Client();

  /** Parse `GOOGLE_CLIENT_ID` into a trimmed, non-empty list of audiences. */
  private audiences(): string[] {
    return env.GOOGLE_CLIENT_ID.split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  }

  isConfigured(): boolean {
    return this.audiences().length > 0;
  }

  async verify(idToken: string): Promise<GoogleIdentity | null> {
    const audience = this.audiences();
    if (audience.length === 0) return null;

    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience });
      const payload = ticket.getPayload();
      if (!payload) return null;

      return {
        sub: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified,
        name: payload.name,
        picture: payload.picture,
      };
    } catch (error) {
      // Invalid/expired token or audience mismatch — treated as an auth failure.
      logger.warn("[GoogleTokenVerifier]: verifyIdToken failed", error);
      return null;
    }
  }
}

/** Singleton wired by the auth factory. */
export const googleTokenVerifier = new GoogleTokenVerifier();

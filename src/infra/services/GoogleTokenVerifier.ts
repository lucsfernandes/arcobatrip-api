import { OAuth2Client } from "google-auth-library";
import {
  GoogleIdentity,
  IGoogleTokenVerifier,
} from "../../application/usecases/auth/IGoogleTokenVerifier";
import { env } from "../../main/config/env";
import logger from "../../main/logger";

/**
 * Verifies Google Sign-In ID tokens with `google-auth-library` (signature via
 * Google's public keys, expiry, issuer and audience).
 *
 * `GOOGLE_CLIENT_ID` holds a COMMA-SEPARATED list of OAuth client ids (web,
 * android, ios). Every entry is an accepted `audience`, so a token minted for
 * any of the app's platforms is valid.
 */
export class GoogleTokenVerifier implements IGoogleTokenVerifier {
  private readonly oauthClient = new OAuth2Client();

  constructor(private readonly configuredClientIds: string = env.GOOGLE_CLIENT_ID) {}

  private audiences(): string[] {
    return this.configuredClientIds
      .split(",")
      .map((clientId) => clientId.trim())
      .filter((clientId) => clientId.length > 0);
  }

  isConfigured(): boolean {
    return this.audiences().length > 0;
  }

  async verify(idToken: string): Promise<GoogleIdentity | null> {
    const audience = this.audiences();
    if (audience.length === 0) return null;

    try {
      const ticket = await this.oauthClient.verifyIdToken({ idToken, audience });
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
      // Invalid/expired token or audience mismatch → an auth failure, not a 500.
      logger.warn("[GoogleTokenVerifier]: verifyIdToken failed", error);
      return null;
    }
  }
}

/** Singleton wired by the auth factory. */
export const googleTokenVerifier = new GoogleTokenVerifier();

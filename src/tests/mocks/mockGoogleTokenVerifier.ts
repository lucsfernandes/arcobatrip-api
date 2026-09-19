import {
  GoogleIdentity,
  IGoogleTokenVerifier,
} from "../../application/usecases/auth/IGoogleTokenVerifier";

/**
 * Test double for {@link IGoogleTokenVerifier}. Lets a test drive the two
 * observable outcomes without touching `google-auth-library` or the network:
 *  - `configured` toggles {@link isConfigured} (→ `google_not_configured`);
 *  - `identity` is what {@link verify} resolves to (`null` = invalid token).
 */
export class MockGoogleTokenVerifier implements IGoogleTokenVerifier {
  public configured = true;
  public identity: GoogleIdentity | null = null;

  isConfigured(): boolean {
    return this.configured;
  }

  async verify(_idToken: string): Promise<GoogleIdentity | null> {
    return this.identity;
  }
}

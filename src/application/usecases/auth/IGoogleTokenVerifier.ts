/**
 * Verified identity extracted from a Google OIDC ID token — the subset of the
 * token payload the auth flow needs. Only `sub` is guaranteed by Google.
 */
export interface GoogleIdentity {
  /** Stable Google user id (the token `sub`). */
  sub: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  picture?: string;
}

/**
 * Port for verifying Google Sign-In ID tokens. The infra implementation
 * ({@link GoogleTokenVerifier}) wraps `google-auth-library`; the interface keeps
 * the use case framework-agnostic and unit-testable with a fake verifier.
 */
export interface IGoogleTokenVerifier {
  /** Whether at least one OAuth client id (`GOOGLE_CLIENT_ID`) is configured. */
  isConfigured(): boolean;

  /**
   * Verifies signature, expiry, issuer and audience. Resolves to the identity on
   * success, or `null` for an invalid/expired token or an audience mismatch.
   */
  verify(idToken: string): Promise<GoogleIdentity | null>;
}

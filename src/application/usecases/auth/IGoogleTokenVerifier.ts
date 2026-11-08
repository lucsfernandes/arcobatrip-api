/**
 * Verified identity extracted from a Google OIDC ID token. Mirrors the subset of
 * the Google token payload the auth flow needs. All fields but `sub` are optional
 * because Google only guarantees the subject identifier.
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
 * Port for verifying Google Sign-In (OIDC) ID tokens. The infra implementation
 * ({@link GoogleTokenVerifier}) wraps `google-auth-library`; keeping it behind an
 * interface lets the use case stay framework-agnostic and be unit tested with a
 * mock verifier.
 */
export interface IGoogleTokenVerifier {
  /**
   * Whether at least one audience (`GOOGLE_CLIENT_ID`) is configured. When false
   * the endpoint must fail with `google_not_configured` instead of attempting a
   * verification that cannot succeed.
   */
  isConfigured(): boolean;

  /**
   * Verify a Google ID token against the configured audience(s). Resolves to the
   * decoded {@link GoogleIdentity} on success, or `null` when the token is
   * invalid/expired or verification is not configured.
   */
  verify(idToken: string): Promise<GoogleIdentity | null>;
}

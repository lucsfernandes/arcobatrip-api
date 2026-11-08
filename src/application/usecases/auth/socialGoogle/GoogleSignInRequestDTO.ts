/** Body for `POST /auth/social/google` — the Google OIDC ID token from the app. */
export interface GoogleSignInRequestDTO {
  idToken: string;
}

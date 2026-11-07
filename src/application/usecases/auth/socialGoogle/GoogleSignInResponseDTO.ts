import { IUserPublic } from "../../../../domain/entities/User/IUser";

/**
 * Result of the Google Sign-In use case — the same session triple the login
 * use case produces. The controller emits `{ token, refreshToken, user }`.
 */
export interface GoogleSignInResponseDTO {
  user: IUserPublic;
  accessToken: string;
  refreshToken: string;
}

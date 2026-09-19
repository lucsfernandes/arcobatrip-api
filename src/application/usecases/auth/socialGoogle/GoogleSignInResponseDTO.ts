import { IUserPublic } from "../../../../domain/entities/User/IUser";

/**
 * Result of the Google Sign-In use case. Mirrors {@link LoginUserResponseDTO}
 * (minus `expiresIn`): the controller maps `user` through `UserMap.toContract`
 * and emits `{ token: accessToken, refreshToken, user }`.
 */
export interface GoogleSignInResponseDTO {
  user: IUserPublic;
  accessToken: string;
  refreshToken: string;
}

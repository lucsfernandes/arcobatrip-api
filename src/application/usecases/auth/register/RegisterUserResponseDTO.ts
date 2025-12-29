import { IUserPublic } from "../../../../domain/entities/User/IUser";

export interface RegisterUserResponseDTO {
  user: IUserPublic;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

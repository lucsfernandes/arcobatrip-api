import { IUserPublic } from "../../../../domain/entities/User/IUser";

export interface LoginUserResponseDTO {
  user: IUserPublic;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

import { IUserPublic } from "../../../../domain/entities/User/IUser";

export interface LoginUserResponseDTO {
  user: IUserPublic;
  token: string;
}

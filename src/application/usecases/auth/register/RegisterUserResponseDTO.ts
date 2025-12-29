import { IUserPublic } from "../../../../domain/entities/User/IUser";

export interface RegisterUserResponseDTO {
  user: IUserPublic;
  token: string;
}

import { ITrip } from "../Trip/ITrip";

export interface IUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
  trips?: ITrip[];
}
import { ITrip } from "../Trip/ITrip";

export interface IUser {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  password?: string;
  birthDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  trips?: ITrip[];
}

export interface IUserPublic {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  birthDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
import { ITrip } from "../Trip/ITrip";

export interface IUser {
  id: string;
  fullName: string;
  phone?: string | null;
  email: string;
  password?: string;
  birthDate?: Date | null;
  avatarUrl?: string | null;
  accent?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  trips?: ITrip[];
}

export interface IUserPublic {
  id: string;
  fullName: string;
  phone?: string | null;
  email: string;
  birthDate?: Date | null;
  avatarUrl?: string | null;
  accent?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

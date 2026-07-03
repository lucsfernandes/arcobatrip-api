import { ITrip } from "../Trip/ITrip";

export interface IUser {
  id: string;
  fullName: string;
  phone?: string | null;
  email: string;
  password?: string;
  birthDate?: Date | null;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  phoneVerified: boolean;
  accent?: string | null;
  isActive: boolean;
  emailVerifiedAt?: Date | null;
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
  avatarPublicId?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  phoneVerified: boolean;
  accent?: string | null;
  isActive: boolean;
  emailVerifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

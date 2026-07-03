import { IUser, IUserPublic } from "../../../domain/entities/User/IUser";
import { User } from "../../../domain/entities/User/user.entity";

export type CreateUserPayload = Omit<
  IUser,
  "id" | "createdAt" | "updatedAt" | "isActive" | "phoneVerified" | "trips"
> & {
  password: string;
};

/**
 * Partial update payload. `birthDate` is widened to also accept a `YYYY-MM-DD`
 * string so callers can forward the validated profile input straight to the
 * TypeORM `date` column without an intermediate `Date` round-trip (which risks a
 * timezone shift).
 */
export type UpdateUserPayload = Partial<
  Omit<IUser, "id" | "createdAt" | "updatedAt" | "trips" | "birthDate">
> & {
  birthDate?: Date | string | null;
};

export interface IUserRepo {
  create(payload: CreateUserPayload): Promise<IUserPublic | null>;
  findById(id: string): Promise<IUserPublic | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByEmailWithPassword(email: string): Promise<User | null>;
  update(id: string, payload: UpdateUserPayload): Promise<IUserPublic | null>;
  existsByEmail(email: string): Promise<boolean>;
}

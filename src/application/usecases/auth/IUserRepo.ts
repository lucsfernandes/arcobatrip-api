import { IUser, IUserPublic } from "../../../domain/entities/User/IUser";
import { User } from "../../../domain/entities/User/user.entity";

export type CreateUserPayload = Omit<IUser, "id" | "createdAt" | "updatedAt" | "isActive" | "trips"> & {
  password: string;
};

export type UpdateUserPayload = Partial<Omit<IUser, "id" | "createdAt" | "updatedAt" | "trips">>;

export interface IUserRepo {
  create(payload: CreateUserPayload): Promise<IUserPublic | null>;
  findById(id: string): Promise<IUserPublic | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByEmailWithPassword(email: string): Promise<User | null>;
  update(id: string, payload: UpdateUserPayload): Promise<IUserPublic | null>;
  existsByEmail(email: string): Promise<boolean>;
}

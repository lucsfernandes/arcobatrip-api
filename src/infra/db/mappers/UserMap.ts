import { IUser, IUserPublic } from "../../../domain/entities/User/IUser";
import { User } from "../../../domain/entities/User/user.entity";

const toDomain = (model: User): IUser => ({
  id: model.id,
  fullName: model.fullName,
  phone: model.phone,
  email: model.email,
  birthDate: model.birthDate,
  isActive: model.isActive,
  createdAt: model.createdAt,
  updatedAt: model.updatedAt,
});

const toPublic = (model: User): IUserPublic => ({
  id: model.id,
  fullName: model.fullName,
  phone: model.phone,
  email: model.email,
  birthDate: model.birthDate,
  isActive: model.isActive,
  createdAt: model.createdAt,
  updatedAt: model.updatedAt,
});

const UserMap = {
  toDomain,
  toPublic,
};

export { UserMap };

import { IUser, IUserPublic } from "../../../domain/entities/User/IUser";
import { User } from "../../../domain/entities/User/user.entity";
import { UserContract } from "../../../application/contracts/contract";
import { dayjs } from "../../../presentation/utils/dayjs";

const toDomain = (model: User): IUser => ({
  id: model.id,
  fullName: model.fullName,
  phone: model.phone,
  email: model.email,
  birthDate: model.birthDate,
  avatarUrl: model.avatarUrl,
  accent: model.accent,
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
  avatarUrl: model.avatarUrl,
  accent: model.accent,
  isActive: model.isActive,
  createdAt: model.createdAt,
  updatedAt: model.updatedAt,
});

/** Minimal structural input the contract mapper needs (entity or public DTO). */
export interface UserContractSource {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  accent?: string | null;
  createdAt: Date;
}

/** Map a persisted user (entity or public DTO) into the API contract `User`. */
const toContract = (model: UserContractSource): UserContract => {
  const contract: UserContract = {
    id: model.id,
    name: model.fullName,
    email: model.email,
    memberSince: dayjs(model.createdAt).format("YYYY-MM-DD"),
  };
  if (model.avatarUrl) contract.avatarUrl = model.avatarUrl;
  if (model.accent) contract.accent = model.accent;
  return contract;
};

const UserMap = {
  toDomain,
  toPublic,
  toContract,
};

export { UserMap };

import { IUser, IUserPublic } from "../../../domain/entities/User/IUser";
import { User } from "../../../domain/entities/User/user.entity";
import { UserContract, UserProfileContract } from "../../../application/contracts/contract";
import { dayjs } from "../../../presentation/utils/dayjs";

const toDomain = (model: User): IUser => ({
  id: model.id,
  fullName: model.fullName,
  phone: model.phone,
  email: model.email,
  birthDate: model.birthDate,
  avatarUrl: model.avatarUrl,
  avatarPublicId: model.avatarPublicId,
  bio: model.bio,
  city: model.city,
  country: model.country,
  phoneVerified: model.phoneVerified,
  accent: model.accent,
  isActive: model.isActive,
  emailVerifiedAt: model.emailVerifiedAt,
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
  avatarPublicId: model.avatarPublicId,
  bio: model.bio,
  city: model.city,
  country: model.country,
  phoneVerified: model.phoneVerified,
  accent: model.accent,
  isActive: model.isActive,
  emailVerifiedAt: model.emailVerifiedAt,
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

/**
 * Structural input the profile mapper needs — satisfied by the entity or the
 * public DTO ({@link IUserPublic}).
 */
export interface UserProfileSource {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  phoneVerified: boolean;
  birthDate?: Date | string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  avatarUrl?: string | null;
  accent?: string | null;
  emailVerifiedAt?: Date | null;
  createdAt: Date;
}

/** Map a persisted user (entity or public DTO) into the rich profile contract. */
const toProfile = (model: UserProfileSource): UserProfileContract => ({
  id: model.id,
  name: model.fullName,
  email: model.email,
  phone: model.phone ?? null,
  phoneVerified: model.phoneVerified,
  emailVerified: Boolean(model.emailVerifiedAt),
  birthDate: model.birthDate ? dayjs(model.birthDate).format("YYYY-MM-DD") : null,
  bio: model.bio ?? null,
  city: model.city ?? null,
  country: model.country ?? null,
  avatarUrl: model.avatarUrl ?? null,
  accent: model.accent ?? null,
  memberSince: dayjs(model.createdAt).format("YYYY-MM-DD"),
});

const UserMap = {
  toDomain,
  toPublic,
  toContract,
  toProfile,
};

export { UserMap };

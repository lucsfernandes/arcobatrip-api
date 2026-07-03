import { CreateUserPayload, IUserRepo, UpdateUserPayload } from "../../application/usecases/auth/IUserRepo";
import { IUser, IUserPublic } from "../../domain/entities/User/IUser";
import { User } from "../../domain/entities/User/user.entity";

/** Project a stored entity into the public DTO shape (no password). */
function toPublic(user: User): IUserPublic {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    birthDate: user.birthDate,
    avatarUrl: user.avatarUrl,
    avatarPublicId: user.avatarPublicId,
    bio: user.bio,
    city: user.city,
    country: user.country,
    phoneVerified: user.phoneVerified ?? false,
    accent: user.accent,
    isActive: user.isActive,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class MockUserRepo implements IUserRepo {
  private users: User[] = [];

  async create(payload: CreateUserPayload): Promise<IUserPublic | null> {
    const user: User = {
      id: `user-${Date.now()}-${this.users.length}`,
      fullName: payload.fullName,
      phone: payload.phone,
      email: payload.email,
      password: payload.password,
      birthDate: payload.birthDate,
      phoneVerified: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    this.users.push(user);

    return toPublic(user);
  }

  async findById(id: string): Promise<IUserPublic | null> {
    const user = this.users.find(u => u.id === id);
    if (!user) return null;
    return toPublic(user);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = this.users.find(u => u.email === email);
    if (!user) return null;
    return { ...toPublic(user) };
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async update(id: string, payload: UpdateUserPayload): Promise<IUserPublic | null> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...payload,
      updatedAt: new Date(),
    } as User;

    return toPublic(this.users[userIndex]);
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.users.some(u => u.email === email);
  }

  // Test helpers
  clear(): void {
    this.users = [];
  }

  addUser(user: User): void {
    this.users.push(user);
  }
}

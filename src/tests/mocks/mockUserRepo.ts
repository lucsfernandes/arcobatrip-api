import { CreateUserPayload, IUserRepo, UpdateUserPayload } from "../../application/usecases/auth/IUserRepo";
import { IUser, IUserPublic } from "../../domain/entities/User/IUser";
import { User } from "../../domain/entities/User/user.entity";

export class MockUserRepo implements IUserRepo {
  private users: User[] = [];

  async create(payload: CreateUserPayload): Promise<IUserPublic | null> {
    const user: User = {
      id: `user-${Date.now()}`,
      fullName: payload.fullName,
      phone: payload.phone,
      email: payload.email,
      password: payload.password,
      birthDate: payload.birthDate,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    this.users.push(user);

    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      birthDate: user.birthDate,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findById(id: string): Promise<IUserPublic | null> {
    const user = this.users.find(u => u.id === id);
    if (!user) return null;

    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      birthDate: user.birthDate,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = this.users.find(u => u.email === email);
    if (!user) return null;

    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      birthDate: user.birthDate,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
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
      updatedAt: new Date()
    } as User;

    const user = this.users[userIndex];
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      birthDate: user.birthDate,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.users.some(u => u.email === email);
  }

  // Métodos auxiliares para testes
  clear(): void {
    this.users = [];
  }

  addUser(user: User): void {
    this.users.push(user);
  }
}

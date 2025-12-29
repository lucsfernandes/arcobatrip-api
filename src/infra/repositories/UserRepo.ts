import { DataSource, Repository } from "typeorm";
import { CreateUserPayload, IUserRepo, UpdateUserPayload } from "../../application/usecases/auth/IUserRepo";
import { IUser, IUserPublic } from "../../domain/entities/User/IUser";
import { User } from "../../domain/entities/User/user.entity";
import { UserMap } from "../db/mappers/UserMap";

export class UserRepo implements IUserRepo {
  private userRepository: Repository<User>;

  constructor(private readonly dataSource: DataSource) {
    this.userRepository = dataSource.getRepository(User);
  }

  async create(payload: CreateUserPayload): Promise<IUserPublic | null> {
    const { fullName, phone, email, password, birthDate } = payload;

    const user = this.userRepository.create({
      fullName,
      phone,
      email,
      password,
      birthDate,
      isActive: true
    });

    const savedUser = await this.userRepository.save(user);

    if (!savedUser) {
      return null;
    }

    return UserMap.toPublic(savedUser);
  }

  async findById(id: string): Promise<IUserPublic | null> {
    const user = await this.userRepository.findOne({
      where: { id }
    });

    if (!user) {
      return null;
    }

    return UserMap.toPublic(user);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = await this.userRepository.findOne({
      where: { email }
    });

    if (!user) {
      return null;
    }

    return UserMap.toDomain(user);
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .where("user.email = :email", { email })
      .addSelect("user.password")
      .getOne();

    return user;
  }

  async update(id: string, payload: UpdateUserPayload): Promise<IUserPublic | null> {
    await this.userRepository.update(id, payload);

    const updatedUser = await this.userRepository.findOne({
      where: { id }
    });

    if (!updatedUser) {
      return null;
    }

    return UserMap.toPublic(updatedUser);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userRepository.count({
      where: { email }
    });

    return count > 0;
  }
}

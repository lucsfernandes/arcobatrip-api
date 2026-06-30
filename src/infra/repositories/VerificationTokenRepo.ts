import { DataSource, IsNull, MoreThan, Repository } from "typeorm";
import {
  CreateVerificationTokenData,
  IVerificationTokenRepo,
} from "../../application/usecases/auth/IVerificationTokenRepo";
import { VerificationTokenType } from "../../domain/entities/VerificationToken/IVerificationToken";
import { VerificationToken } from "../../domain/entities/VerificationToken/verification.token.entity";

export class VerificationTokenRepo implements IVerificationTokenRepo {
  private verificationTokenRepository: Repository<VerificationToken>;

  constructor(private readonly dataSource: DataSource) {
    this.verificationTokenRepository = dataSource.getRepository(VerificationToken);
  }

  async create(data: CreateVerificationTokenData): Promise<VerificationToken> {
    const token = this.verificationTokenRepository.create({
      userId: data.userId,
      tokenHash: data.tokenHash,
      type: data.type,
      expiresAt: data.expiresAt,
      usedAt: null,
    });
    return this.verificationTokenRepository.save(token);
  }

  async findValidByHash(
    tokenHash: string,
    type: VerificationTokenType
  ): Promise<VerificationToken | null> {
    return this.verificationTokenRepository.findOne({
      where: {
        tokenHash,
        type,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async markUsed(token: VerificationToken): Promise<VerificationToken> {
    token.usedAt = new Date();
    return this.verificationTokenRepository.save(token);
  }

  async invalidateAllForUser(
    userId: string,
    type: VerificationTokenType
  ): Promise<void> {
    await this.verificationTokenRepository.update(
      { userId, type, usedAt: IsNull() },
      { usedAt: new Date() }
    );
  }
}

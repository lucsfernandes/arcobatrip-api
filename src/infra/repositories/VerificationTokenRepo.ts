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

  async findLatestForUser(
    userId: string,
    type: VerificationTokenType
  ): Promise<VerificationToken | null> {
    return this.verificationTokenRepository.findOne({
      where: { userId, type },
      order: { createdAt: "DESC" },
    });
  }

  async findActiveForUser(
    userId: string,
    type: VerificationTokenType
  ): Promise<VerificationToken | null> {
    return this.verificationTokenRepository.findOne({
      where: {
        userId,
        type,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: "DESC" },
    });
  }

  async markUsed(token: VerificationToken): Promise<VerificationToken> {
    token.usedAt = new Date();
    return this.verificationTokenRepository.save(token);
  }

  async incrementAttempts(token: VerificationToken): Promise<number> {
    // Single atomic UPDATE with RETURNING — the read-modify-write race that let
    // concurrent requests overshoot the attempt ceiling is eliminated because the
    // counter is bumped and read back in one statement.
    const result = await this.verificationTokenRepository
      .createQueryBuilder()
      .update(VerificationToken)
      .set({ attempts: () => '"attempts" + 1' })
      .where("id = :id", { id: token.id })
      .returning("attempts")
      .execute();

    const raw = result.raw as Array<{ attempts: number }> | undefined;
    const attempts = raw?.[0]?.attempts ?? token.attempts + 1;
    token.attempts = attempts;
    return attempts;
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

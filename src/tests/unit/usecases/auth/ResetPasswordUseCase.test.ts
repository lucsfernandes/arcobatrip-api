import bcrypt from "bcryptjs";
import { ResetPasswordUseCase } from "../../../../application/usecases/auth/resetPassword/ResetPasswordUseCase";
import { hashToken } from "../../../../application/utils/token";
import { MockUserRepo } from "../../../mocks/mockUserRepo";
import { MockVerificationTokenRepo } from "../../../mocks/mockVerificationTokenRepo";
import { User } from "../../../../domain/entities/User/user.entity";

/**
 * A reset link is delivered to the account's e-mail, so using it proves the
 * user owns the address: an unconfirmed e-mail becomes confirmed, and the
 * password set before (possibly by someone else) is replaced in the same step.
 */
describe("ResetPasswordUseCase", () => {
  let userRepo: MockUserRepo;
  let tokenRepo: MockVerificationTokenRepo;

  const user = (overrides: Partial<User> = {}): User =>
    ({
      id: "user-ana",
      fullName: "Ana",
      email: "ana@gmail.com",
      password: "$2b$12$old.hash.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      isActive: true,
      phoneVerified: false,
      emailVerifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as User;

  async function resetLink(rawToken = "reset-token") {
    await tokenRepo.create({
      userId: "user-ana",
      tokenHash: hashToken(rawToken),
      type: "password_reset",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    return rawToken;
  }

  beforeEach(() => {
    userRepo = new MockUserRepo();
    tokenRepo = new MockVerificationTokenRepo();
  });

  it("sets the new password and confirms an unconfirmed e-mail", async () => {
    userRepo.addUser(user());
    const token = await resetLink();

    const result = await new ResetPasswordUseCase(userRepo, tokenRepo).execute({
      token,
      password: "NovaSenha@2026",
    });

    expect(result.isSuccess).toBe(true);
    const stored = await userRepo.findByEmailWithPassword("ana@gmail.com");
    expect(await bcrypt.compare("NovaSenha@2026", stored!.password)).toBe(true);
    expect(stored?.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it("keeps the original confirmation date of an already confirmed e-mail", async () => {
    const confirmedAt = new Date("2026-01-01T10:00:00Z");
    userRepo.addUser(user({ emailVerifiedAt: confirmedAt }));
    const token = await resetLink();

    await new ResetPasswordUseCase(userRepo, tokenRepo).execute({
      token,
      password: "NovaSenha@2026",
    });

    const stored = await userRepo.findByEmailWithPassword("ana@gmail.com");
    expect(stored?.emailVerifiedAt).toEqual(confirmedAt);
  });

  it("rejects an invalid link without touching the account", async () => {
    userRepo.addUser(user());
    await resetLink("the-real-token");

    const result = await new ResetPasswordUseCase(userRepo, tokenRepo).execute({
      token: "a-guessed-token",
      password: "NovaSenha@2026",
    });

    expect(result.isFailure).toBe(true);
    const stored = await userRepo.findByEmailWithPassword("ana@gmail.com");
    expect(stored?.emailVerifiedAt ?? null).toBeNull();
    expect(stored?.password).toBe(user().password);
  });
});

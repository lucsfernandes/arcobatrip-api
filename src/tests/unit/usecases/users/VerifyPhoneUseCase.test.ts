import { VerifyPhoneUseCase } from "../../../../application/usecases/users/verifyPhone/VerifyPhoneUseCase";
import { hashToken } from "../../../../application/utils/token";
import { MockUserRepo } from "../../../mocks/mockUserRepo";
import { MockVerificationTokenRepo } from "../../../mocks/mockVerificationTokenRepo";

const CODE = "123456";

describe("VerifyPhoneUseCase", () => {
  let userRepo: MockUserRepo;
  let tokenRepo: MockVerificationTokenRepo;
  let useCase: VerifyPhoneUseCase;
  let userId: string;

  beforeEach(async () => {
    userRepo = new MockUserRepo();
    tokenRepo = new MockVerificationTokenRepo();
    useCase = new VerifyPhoneUseCase(userRepo, tokenRepo);

    const created = await userRepo.create({
      fullName: "Ana",
      email: "ana@email.com",
      password: "hashed",
    });
    userId = created!.id;
  });

  afterEach(() => {
    userRepo.clear();
    tokenRepo.clear();
  });

  function seedActiveCode(attempts = 0): void {
    tokenRepo.seed({
      userId,
      tokenHash: hashToken(CODE),
      type: "phone_verification",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts,
    });
  }

  it("verifies a correct code, flips phoneVerified and consumes the token", async () => {
    seedActiveCode();

    const result = await useCase.execute({ userId, code: CODE });

    expect(result.isSuccess).toBe(true);
    const user = await userRepo.findById(userId);
    expect(user!.phoneVerified).toBe(true);
    expect(tokenRepo.tokens[0].usedAt).not.toBeNull();
  });

  it("rejects a wrong code with 400 invalid_code and increments attempts", async () => {
    seedActiveCode();

    const result = await useCase.execute({ userId, code: "000000" });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(400);
    expect(result.errorValue().code).toBe("invalid_code");
    expect(tokenRepo.tokens[0].attempts).toBe(1);
  });

  it("returns 410 code_expired when there is no active code", async () => {
    const result = await useCase.execute({ userId, code: CODE });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(410);
    expect(result.errorValue().code).toBe("code_expired");
  });

  it("returns 410 when the code has expired", async () => {
    tokenRepo.seed({
      userId,
      tokenHash: hashToken(CODE),
      type: "phone_verification",
      expiresAt: new Date(Date.now() - 60 * 1000),
    });

    const result = await useCase.execute({ userId, code: CODE });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(410);
  });

  it("locks the code with 429 too_many_attempts once the limit is reached", async () => {
    // One below the limit (5) — the failing attempt tips it over.
    seedActiveCode(4);

    const result = await useCase.execute({ userId, code: "000000" });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(429);
    expect(result.errorValue().code).toBe("too_many_attempts");
    expect(tokenRepo.tokens[0].usedAt).not.toBeNull();
  });

  it("rejects immediately with 429 when the token is already at the attempt limit", async () => {
    seedActiveCode(5);

    const result = await useCase.execute({ userId, code: CODE });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(429);
    expect(result.errorValue().code).toBe("too_many_attempts");
  });

  it("cannot reuse a consumed code (410 on the second verify)", async () => {
    seedActiveCode();

    await useCase.execute({ userId, code: CODE });
    const second = await useCase.execute({ userId, code: CODE });

    expect(second.isFailure).toBe(true);
    expect(second.errorValue().statusCode).toBe(410);
  });
});

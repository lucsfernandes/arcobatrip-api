import { RequestPhoneVerificationUseCase } from "../../../../application/usecases/users/requestPhoneVerification/RequestPhoneVerificationUseCase";
import { PhoneVerificationEmitter } from "../../../../application/services/PhoneVerificationEmitter";
import { MockUserRepo } from "../../../mocks/mockUserRepo";
import { MockVerificationTokenRepo } from "../../../mocks/mockVerificationTokenRepo";
import { MockEmailService } from "../../../mocks/mockEmailService";

describe("RequestPhoneVerificationUseCase", () => {
  let userRepo: MockUserRepo;
  let tokenRepo: MockVerificationTokenRepo;
  let emailService: MockEmailService;
  let useCase: RequestPhoneVerificationUseCase;
  let userId: string;

  beforeEach(async () => {
    userRepo = new MockUserRepo();
    tokenRepo = new MockVerificationTokenRepo();
    emailService = new MockEmailService();
    const emitter = new PhoneVerificationEmitter(emailService, tokenRepo);
    useCase = new RequestPhoneVerificationUseCase(userRepo, emitter);

    const created = await userRepo.create({
      fullName: "Ana Souza",
      email: "ana@email.com",
      password: "hashed",
    });
    userId = created!.id;
  });

  afterEach(() => {
    userRepo.clear();
    tokenRepo.clear();
    emailService.clear();
  });

  it("stores the number (unverified), generates a code and emails it", async () => {
    const result = await useCase.execute({ userId, phoneNumber: "+5511988887777" });

    expect(result.isSuccess).toBe(true);
    expect(emailService.phoneCodes).toHaveLength(1);
    expect(emailService.phoneCodes[0].code).toMatch(/^\d{6}$/);
    expect(emailService.phoneCodes[0].to).toBe("ana@email.com");

    const user = await userRepo.findById(userId);
    expect(user!.phone).toBe("+5511988887777");
    expect(user!.phoneVerified).toBe(false);

    // Only the hash is persisted — never the raw code.
    const token = tokenRepo.tokens[0];
    expect(token.tokenHash).not.toBe(emailService.phoneCodes[0].code);
    expect(token.type).toBe("phone_verification");
  });

  it("normalizes human separators into E.164", async () => {
    await useCase.execute({ userId, phoneNumber: "+55 (11) 98888-7777" });

    const user = await userRepo.findById(userId);
    expect(user!.phone).toBe("+5511988887777");
  });

  it("rejects an invalid phone with 400 validation_error", async () => {
    const result = await useCase.execute({ userId, phoneNumber: "abc" });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(400);
    expect(result.errorValue().code).toBe("validation_error");
    expect(emailService.phoneCodes).toHaveLength(0);
  });

  it("enforces the resend cooldown with 429 too_many_requests", async () => {
    await useCase.execute({ userId, phoneNumber: "+5511988887777" });
    const second = await useCase.execute({ userId, phoneNumber: "+5511988887777" });

    expect(second.isFailure).toBe(true);
    expect(second.errorValue().statusCode).toBe(429);
    expect(second.errorValue().code).toBe("too_many_requests");
    // No second code was sent.
    expect(emailService.phoneCodes).toHaveLength(1);
  });

  it("invalidates a prior code when a new one is issued after cooldown", async () => {
    // Seed an old (still valid) token created well before the cooldown window.
    tokenRepo.seed({
      userId,
      tokenHash: "old-hash",
      type: "phone_verification",
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const result = await useCase.execute({ userId, phoneNumber: "+5511988887777" });

    expect(result.isSuccess).toBe(true);
    // The old token is now consumed (invalidated), the new one is active.
    const active = tokenRepo.tokens.filter(t => !t.usedAt && t.type === "phone_verification");
    expect(active).toHaveLength(1);
    expect(active[0].tokenHash).not.toBe("old-hash");
  });

  it("returns 404 when the user does not exist", async () => {
    const result = await useCase.execute({ userId: "ghost", phoneNumber: "+5511988887777" });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(404);
  });
});

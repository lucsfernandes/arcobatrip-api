import { UpdateProfileUseCase } from "../../../../application/usecases/users/updateProfile/UpdateProfileUseCase";
import { PhoneVerificationEmitter } from "../../../../application/services/PhoneVerificationEmitter";
import { MockUserRepo } from "../../../mocks/mockUserRepo";
import { MockVerificationTokenRepo } from "../../../mocks/mockVerificationTokenRepo";
import { MockEmailService } from "../../../mocks/mockEmailService";

describe("UpdateProfileUseCase", () => {
  let userRepo: MockUserRepo;
  let tokenRepo: MockVerificationTokenRepo;
  let emailService: MockEmailService;
  let emitter: PhoneVerificationEmitter;
  let useCase: UpdateProfileUseCase;
  let userId: string;

  beforeEach(async () => {
    userRepo = new MockUserRepo();
    tokenRepo = new MockVerificationTokenRepo();
    emailService = new MockEmailService();
    emitter = new PhoneVerificationEmitter(emailService, tokenRepo);
    useCase = new UpdateProfileUseCase(userRepo, emitter);

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

  it("updates the whitelisted profile fields and returns the rich profile", async () => {
    const result = await useCase.execute({
      userId,
      fullName: "Ana Beatriz",
      bio: "Viajante",
      city: "Floripa",
      country: "Brasil",
      birthDate: "1995-04-20",
    });

    expect(result.isSuccess).toBe(true);
    const profile = result.getValue();
    expect(profile.name).toBe("Ana Beatriz");
    expect(profile.bio).toBe("Viajante");
    expect(profile.city).toBe("Floripa");
    expect(profile.country).toBe("Brasil");
    expect(profile.birthDate).toBe("1995-04-20");
    expect(profile.phoneVerified).toBe(false);
  });

  it("returns 404 when the user does not exist", async () => {
    const result = await useCase.execute({ userId: "ghost", fullName: "X" });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(404);
  });

  it("rejects an invalid phone with 400 validation_error", async () => {
    const result = await useCase.execute({ userId, phone: "12345" });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(400);
    expect(result.errorValue().code).toBe("validation_error");
  });

  it("on phone change: marks phoneVerified=false and emails a code", async () => {
    const result = await useCase.execute({ userId, phone: "+55 11 99999-9999" });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().phone).toBe("+5511999999999");
    expect(result.getValue().phoneVerified).toBe(false);
    // A verification code was generated and emailed.
    expect(emailService.phoneCodes).toHaveLength(1);
    expect(tokenRepo.tokens.filter(t => t.type === "phone_verification")).toHaveLength(1);
  });

  it("does not re-issue a code when the phone is unchanged", async () => {
    await useCase.execute({ userId, phone: "+5511999999999" });
    emailService.clear();

    const result = await useCase.execute({ userId, phone: "+5511999999999" });

    expect(result.isSuccess).toBe(true);
    expect(emailService.phoneCodes).toHaveLength(0);
  });
});

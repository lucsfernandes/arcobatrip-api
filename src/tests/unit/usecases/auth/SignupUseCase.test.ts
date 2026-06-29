import { SignupUseCase } from "../../../../application/usecases/auth/signup/SignupUseCase";
import { MockUserRepo } from "../../../mocks/mockUserRepo";
import { MockTokenService } from "../../../mocks/mockTokenService";

describe("SignupUseCase", () => {
  let signupUseCase: SignupUseCase;
  let mockUserRepo: MockUserRepo;
  let mockTokenService: MockTokenService;

  beforeEach(() => {
    mockUserRepo = new MockUserRepo();
    mockTokenService = new MockTokenService();
    signupUseCase = new SignupUseCase(mockUserRepo, mockTokenService);
  });

  afterEach(() => {
    mockUserRepo.clear();
    mockTokenService.clear();
  });

  const validRequest = {
    name: "Ana Souza",
    email: "ana.souza@email.com",
    password: "supersecret",
  };

  it("creates an account and returns the contract { token, user }", async () => {
    const result = await signupUseCase.execute(validRequest);

    expect(result.isSuccess).toBe(true);
    const value = result.getValue();
    expect(value.token).toBeDefined();
    expect(value.user.name).toBe(validRequest.name);
    expect(value.user.email).toBe(validRequest.email);
    expect(value.user.memberSince).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect((value.user as unknown as Record<string, unknown>).password).toBeUndefined();
  });

  it("fails with 409 email_conflict when the email already exists", async () => {
    await signupUseCase.execute(validRequest);
    const result = await signupUseCase.execute(validRequest);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(409);
    expect(result.errorValue().code).toBe("email_conflict");
  });

  it("fails with 400 validation_error when the password is too short", async () => {
    const result = await signupUseCase.execute({ ...validRequest, password: "short" });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(400);
    expect(result.errorValue().code).toBe("validation_error");
  });
});

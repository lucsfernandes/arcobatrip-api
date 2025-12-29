import { RegisterUserUseCase } from "../../../../src/application/usecases/auth/register/RegisterUserUseCase";
import { MockUserRepo } from "../../../mocks/mockUserRepo";
import { MockTokenService } from "../../../mocks/mockTokenService";

describe("RegisterUserUseCase", () => {
  let registerUserUseCase: RegisterUserUseCase;
  let mockUserRepo: MockUserRepo;
  let mockTokenService: MockTokenService;

  beforeEach(() => {
    mockUserRepo = new MockUserRepo();
    mockTokenService = new MockTokenService();
    registerUserUseCase = new RegisterUserUseCase(mockUserRepo, mockTokenService);
  });

  afterEach(() => {
    mockUserRepo.clear();
    mockTokenService.clear();
  });

  const validRequest = {
    fullName: "João Silva",
    phone: "11999999999",
    email: "joao@test.com",
    password: "Senha@123",
    confirmPassword: "Senha@123",
    birthDate: "1990-01-15"
  };

  describe("Sucesso", () => {
    it("deve registrar um novo usuário com sucesso", async () => {
      const result = await registerUserUseCase.execute(validRequest);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().user).toBeDefined();
      expect(result.getValue().user.email).toBe(validRequest.email);
      expect(result.getValue().user.fullName).toBe(validRequest.fullName);
      expect(result.getValue().accessToken).toBeDefined();
      expect(result.getValue().refreshToken).toBeDefined();
    });

    it("deve gerar um par de tokens JWT válido", async () => {
      const result = await registerUserUseCase.execute(validRequest);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().accessToken).toContain("mock-token");
      expect(result.getValue().refreshToken).toContain("mock-refresh-token");
      expect(result.getValue().expiresIn).toBeDefined();
    });

    it("não deve retornar a senha do usuário na resposta", async () => {
      const result = await registerUserUseCase.execute(validRequest);

      expect(result.isSuccess).toBe(true);
      expect((result.getValue().user as any).password).toBeUndefined();
    });
  });

  describe("Validação de senha", () => {
    it("deve falhar quando as senhas não coincidem", async () => {
      const request = {
        ...validRequest,
        confirmPassword: "SenhaDiferente@123"
      };

      const result = await registerUserUseCase.execute(request);

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(400);
    });

    it("deve falhar quando a senha tem menos de 8 caracteres", async () => {
      const request = {
        ...validRequest,
        password: "Abc@12",
        confirmPassword: "Abc@12"
      };

      const result = await registerUserUseCase.execute(request);

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(400);
    });
  });

  describe("Validação de email", () => {
    it("deve falhar quando o email já está cadastrado", async () => {
      // Primeiro registro
      await registerUserUseCase.execute(validRequest);

      // Tentativa de registro com mesmo email
      const result = await registerUserUseCase.execute(validRequest);

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(409);
    });
  });

  describe("Validação de idade", () => {
    it("deve falhar quando o usuário tem menos de 13 anos", async () => {
      const request = {
        ...validRequest,
        birthDate: new Date().toISOString() // Data atual = 0 anos
      };

      const result = await registerUserUseCase.execute(request);

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(400);
    });

    it("deve aceitar usuário com exatamente 13 anos", async () => {
      const thirteenYearsAgo = new Date();
      thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);
      
      const request = {
        ...validRequest,
        email: "usuario13anos@test.com",
        birthDate: thirteenYearsAgo.toISOString()
      };

      const result = await registerUserUseCase.execute(request);

      expect(result.isSuccess).toBe(true);
    });
  });
});

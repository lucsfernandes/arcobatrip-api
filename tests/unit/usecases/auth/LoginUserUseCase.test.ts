import bcrypt from "bcryptjs";
import { LoginUserUseCase } from "../../../../src/application/usecases/auth/login/LoginUserUseCase";
import { MockUserRepo } from "../../../mocks/mockUserRepo";
import { MockTokenService } from "../../../mocks/mockTokenService";
import { User } from "../../../../src/domain/entities/User/user.entity";

describe("LoginUserUseCase", () => {
  let loginUserUseCase: LoginUserUseCase;
  let mockUserRepo: MockUserRepo;
  let mockTokenService: MockTokenService;

  const testPassword = "Senha@123";
  let hashedPassword: string;

  beforeAll(async () => {
    hashedPassword = await bcrypt.hash(testPassword, 12);
  });

  beforeEach(() => {
    mockUserRepo = new MockUserRepo();
    mockTokenService = new MockTokenService();
    loginUserUseCase = new LoginUserUseCase(mockUserRepo, mockTokenService);
  });

  afterEach(() => {
    mockUserRepo.clear();
    mockTokenService.clear();
  });

  const createTestUser = (overrides?: Partial<User>): User => ({
    id: "user-123",
    fullName: "João Silva",
    phone: "11999999999",
    email: "joao@test.com",
    password: hashedPassword,
    birthDate: new Date("1990-01-15"),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  } as User);

  describe("Sucesso", () => {
    it("deve fazer login com credenciais válidas", async () => {
      const user = createTestUser();
      mockUserRepo.addUser(user);

      const result = await loginUserUseCase.execute({
        email: "joao@test.com",
        password: testPassword
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().user).toBeDefined();
      expect(result.getValue().user.email).toBe("joao@test.com");
      expect(result.getValue().token).toBeDefined();
    });

    it("deve gerar um token JWT válido no login", async () => {
      const user = createTestUser();
      mockUserRepo.addUser(user);

      const result = await loginUserUseCase.execute({
        email: "joao@test.com",
        password: testPassword
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().token).toContain("mock-token");
    });

    it("não deve retornar a senha do usuário na resposta", async () => {
      const user = createTestUser();
      mockUserRepo.addUser(user);

      const result = await loginUserUseCase.execute({
        email: "joao@test.com",
        password: testPassword
      });

      expect(result.isSuccess).toBe(true);
      expect((result.getValue().user as any).password).toBeUndefined();
    });
  });

  describe("Credenciais inválidas", () => {
    it("deve falhar com email não cadastrado", async () => {
      const result = await loginUserUseCase.execute({
        email: "inexistente@test.com",
        password: testPassword
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(401);
    });

    it("deve falhar com senha incorreta", async () => {
      const user = createTestUser();
      mockUserRepo.addUser(user);

      const result = await loginUserUseCase.execute({
        email: "joao@test.com",
        password: "SenhaErrada@123"
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(401);
    });
  });

  describe("Usuário inativo", () => {
    it("deve falhar quando o usuário está inativo", async () => {
      const user = createTestUser({ isActive: false });
      mockUserRepo.addUser(user);

      const result = await loginUserUseCase.execute({
        email: "joao@test.com",
        password: testPassword
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(403);
    });
  });
});

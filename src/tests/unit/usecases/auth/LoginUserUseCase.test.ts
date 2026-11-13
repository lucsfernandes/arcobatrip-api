import bcrypt from "bcryptjs";
import { LoginUserUseCase } from "../../../../application/usecases/auth/login/LoginUserUseCase";
import { MockUserRepo } from "../../../mocks/mockUserRepo";
import { MockTokenService } from "../../../mocks/mockTokenService";
import { User } from "../../../../domain/entities/User/user.entity";
import { AuditLog } from "../../../../application/services/AuditLog";
import { AuditEvents } from "../../../../application/services/auditEvents";
import { MockAuditLogRepo } from "../../../mocks/mockAuditLogRepo";

describe("LoginUserUseCase", () => {
  let loginUserUseCase: LoginUserUseCase;
  let mockUserRepo: MockUserRepo;
  let mockTokenService: MockTokenService;
  let auditRepo: MockAuditLogRepo;

  const testPassword = "Senha@123";
  let hashedPassword: string;

  beforeAll(async () => {
    hashedPassword = await bcrypt.hash(testPassword, 12);
  });

  beforeEach(() => {
    mockUserRepo = new MockUserRepo();
    mockTokenService = new MockTokenService();
    auditRepo = new MockAuditLogRepo();
    loginUserUseCase = new LoginUserUseCase(mockUserRepo, mockTokenService, new AuditLog(auditRepo));
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
    it("returns the photo and accent so the app header shows the avatar", async () => {
      mockUserRepo.addUser(
        createTestUser({
          avatarUrl: "https://res.cloudinary.com/demo/avatar.jpg",
          accent: "#16c0e9",
        })
      );

      const result = await loginUserUseCase.execute({
        email: "joao@test.com",
        password: testPassword,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().user.avatarUrl).toBe("https://res.cloudinary.com/demo/avatar.jpg");
      expect(result.getValue().user.accent).toBe("#16c0e9");
    });

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
      expect(result.getValue().accessToken).toBeDefined();
      expect(result.getValue().refreshToken).toBeDefined();
    });

    it("deve gerar um par de tokens JWT válido no login", async () => {
      const user = createTestUser();
      mockUserRepo.addUser(user);

      const result = await loginUserUseCase.execute({
        email: "joao@test.com",
        password: testPassword
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().accessToken).toContain("mock-token");
      expect(result.getValue().refreshToken).toContain("mock-refresh-token");
      expect(result.getValue().expiresIn).toBeDefined();
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

  describe("Auditoria", () => {
    it("records a login with no e-mail in text", async () => {
      mockUserRepo.addUser(createTestUser());

      await loginUserUseCase.execute({ email: "joao@test.com", password: testPassword });

      expect(auditRepo.events).toHaveLength(1);
      expect(auditRepo.events[0]).toMatchObject({
        event: AuditEvents.AuthLogin,
        outcome: "ok",
        details: { method: "password" },
      });
      expect(JSON.stringify(auditRepo.events[0])).not.toContain("joao");
    });

    it("records a failed login for a wrong password and for an unknown e-mail alike", async () => {
      mockUserRepo.addUser(createTestUser());

      await loginUserUseCase.execute({ email: "joao@test.com", password: "wrong-password" });
      await loginUserUseCase.execute({ email: "nobody@test.com", password: "whatever" });

      expect(auditRepo.events.map((e) => e.event)).toEqual([
        AuditEvents.AuthLoginFailed,
        AuditEvents.AuthLoginFailed,
      ]);
      expect(auditRepo.events.every((e) => e.outcome === "failed")).toBe(true);
      expect(auditRepo.events[0].subjectRef).not.toBe(auditRepo.events[1].subjectRef);
    });

    it("records an inactive account's failed login", async () => {
      mockUserRepo.addUser(createTestUser({ isActive: false }));

      const result = await loginUserUseCase.execute({ email: "joao@test.com", password: testPassword });

      expect(result.isFailure).toBe(true);
      expect(auditRepo.events[0]).toMatchObject({
        event: AuditEvents.AuthLoginFailed,
        details: { reason: "inactive" },
      });
    });

    it("still logs the user in when the audit trail is down", async () => {
      mockUserRepo.addUser(createTestUser());
      auditRepo.failOnCreate = true;

      const result = await loginUserUseCase.execute({ email: "joao@test.com", password: testPassword });

      expect(result.isSuccess).toBe(true);
    });
  });
});

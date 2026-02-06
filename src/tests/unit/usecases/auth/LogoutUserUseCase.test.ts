import { LogoutUserUseCase } from "../../../../application/usecases/auth/logout/LogoutUserUseCase";
import { MockTokenService } from "../../../mocks/mockTokenService";

describe("LogoutUserUseCase", () => {
  let logoutUserUseCase: LogoutUserUseCase;
  let mockTokenService: MockTokenService;

  beforeEach(() => {
    mockTokenService = new MockTokenService();
    logoutUserUseCase = new LogoutUserUseCase(mockTokenService);
  });

  afterEach(() => {
    mockTokenService.clear();
  });

  describe("Sucesso", () => {
    it("deve fazer logout com sucesso", async () => {
      const result = await logoutUserUseCase.execute({
        token: "mock-token-1-user-123",
        userId: "user-123"
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().message).toBe("Logout realizado com sucesso");
    });

    it("deve invalidar o token após logout", async () => {
      const token = "mock-token-1-user-123";

      await logoutUserUseCase.execute({
        token,
        userId: "user-123"
      });

      const isBlacklisted = await mockTokenService.isTokenBlacklisted(token);
      expect(isBlacklisted).toBe(true);
    });

    it("deve impedir uso do token após logout", async () => {
      const token = "mock-token-1-user-123";

      await logoutUserUseCase.execute({
        token,
        userId: "user-123"
      });

      const decoded = mockTokenService.verifyToken(token);
      expect(decoded).toBeNull();
    });
  });

  describe("Múltiplos logouts", () => {
    it("deve permitir logout mesmo se o token já estiver invalidado", async () => {
      const token = "mock-token-1-user-123";

      // Primeiro logout
      await logoutUserUseCase.execute({
        token,
        userId: "user-123"
      });

      // Segundo logout com mesmo token
      const result = await logoutUserUseCase.execute({
        token,
        userId: "user-123"
      });

      expect(result.isSuccess).toBe(true);
    });
  });
});

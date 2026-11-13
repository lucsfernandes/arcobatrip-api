import { RefreshTokenUseCase } from "../../../../application/usecases/auth/refresh/RefreshTokenUseCase";
import { MockTokenService } from "../../../mocks/mockTokenService";
import { MockUserRepo } from "../../../mocks/mockUserRepo";
import { User } from "../../../../domain/entities/User/user.entity";

describe("RefreshTokenUseCase", () => {
  let refreshTokenUseCase: RefreshTokenUseCase;
  let mockTokenService: MockTokenService;
  let mockUserRepo: MockUserRepo;

  beforeEach(() => {
    mockTokenService = new MockTokenService();
    mockUserRepo = new MockUserRepo();
    // The tokens below belong to this account, which exists.
    mockUserRepo.addUser({ id: "user-123", email: "test@test.com", isActive: true } as User);
    refreshTokenUseCase = new RefreshTokenUseCase(mockTokenService, mockUserRepo);
  });

  afterEach(() => {
    mockTokenService.clear();
    mockUserRepo.clear();
  });

  describe("Sucesso", () => {
    it("deve renovar tokens com refresh token válido", async () => {
      const userId = "user-123";
      const refreshToken = mockTokenService.generateRefreshToken({
        userId,
        email: "test@test.com"
      });

      const result = await refreshTokenUseCase.execute({ refreshToken });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().accessToken).toBeDefined();
      expect(result.getValue().refreshToken).toBeDefined();
      expect(result.getValue().expiresIn).toBeDefined();
    });

    it("deve gerar novos tokens diferentes dos anteriores", async () => {
      const userId = "user-123";
      const oldRefreshToken = mockTokenService.generateRefreshToken({
        userId,
        email: "test@test.com"
      });

      const result = await refreshTokenUseCase.execute({ refreshToken: oldRefreshToken });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().refreshToken).not.toBe(oldRefreshToken);
    });

    it("deve invalidar o refresh token antigo após uso (Rotation Strategy)", async () => {
      const userId = "user-123";
      const oldRefreshToken = mockTokenService.generateRefreshToken({
        userId,
        email: "test@test.com"
      });

      await refreshTokenUseCase.execute({ refreshToken: oldRefreshToken });

      const isBlacklisted = await mockTokenService.isRefreshTokenBlacklisted(oldRefreshToken);
      expect(isBlacklisted).toBe(true);
    });

    it("deve retornar tokens com o mesmo userId do token original", async () => {
      const userId = "user-456";
      mockUserRepo.addUser({ id: userId, email: "test@test.com", isActive: true } as User);
      const refreshToken = mockTokenService.generateRefreshToken({
        userId,
        email: "test@test.com"
      });

      const result = await refreshTokenUseCase.execute({ refreshToken });

      expect(result.isSuccess).toBe(true);
      // O novo access token deve conter o userId
      expect(result.getValue().accessToken).toContain(userId);
    });
  });

  describe("Falhas", () => {
    it("deve falhar com refresh token inválido", async () => {
      const result = await refreshTokenUseCase.execute({
        refreshToken: "token-invalido"
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().errors).toContain("inválido ou expirado");
      expect(result.errorValue().statusCode).toBe(401);
    });

    it("deve falhar com refresh token já utilizado (blacklist)", async () => {
      const userId = "user-123";
      const refreshToken = mockTokenService.generateRefreshToken({
        userId,
        email: "test@test.com"
      });

      // Usar o token uma vez
      await refreshTokenUseCase.execute({ refreshToken });

      // Tentar usar o mesmo token novamente
      const result = await refreshTokenUseCase.execute({ refreshToken });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().errors).toContain("inválido ou expirado");
    });

    it("deve falhar com refresh token malformado", async () => {
      const result = await refreshTokenUseCase.execute({
        refreshToken: "abc.def.ghi"
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().errors).toContain("inválido ou expirado");
    });

    it("deve falhar quando refresh token está na blacklist antes do uso", async () => {
      const userId = "user-123";
      const refreshToken = mockTokenService.generateRefreshToken({
        userId,
        email: "test@test.com"
      });

      // Invalidar token manualmente
      await mockTokenService.invalidateRefreshToken(refreshToken);

      const result = await refreshTokenUseCase.execute({ refreshToken });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().errors).toContain("inválido ou expirado");
    });
  });

  describe("Token Rotation Security", () => {
    it("não deve permitir reutilização de refresh tokens", async () => {
      const userId = "user-123";
      const refreshToken = mockTokenService.generateRefreshToken({
        userId,
        email: "test@test.com"
      });

      // Primeiro uso - deve funcionar
      const firstResult = await refreshTokenUseCase.execute({ refreshToken });
      expect(firstResult.isSuccess).toBe(true);

      // Segundo uso - deve falhar (token rotation)
      const secondResult = await refreshTokenUseCase.execute({ refreshToken });
      expect(secondResult.isFailure).toBe(true);
    });

    it("deve permitir refresh com o novo token gerado", async () => {
      const userId = "user-123";
      const originalRefreshToken = mockTokenService.generateRefreshToken({
        userId,
        email: "test@test.com"
      });

      // Primeiro refresh
      const firstResult = await refreshTokenUseCase.execute({ 
        refreshToken: originalRefreshToken 
      });
      expect(firstResult.isSuccess).toBe(true);

      // Segundo refresh com o novo token
      const newRefreshToken = firstResult.getValue().refreshToken;
      const secondResult = await refreshTokenUseCase.execute({ 
        refreshToken: newRefreshToken 
      });
      expect(secondResult.isSuccess).toBe(true);
    });
  });

  describe("conta excluída", () => {
    it("recusa um refresh token válido cuja conta não existe mais, e não emite tokens novos", async () => {
      const refreshToken = mockTokenService.generateRefreshToken({
        userId: "user-123",
        email: "test@test.com",
      });
      mockUserRepo.clear(); // the account was deleted

      const result = await refreshTokenUseCase.execute({ refreshToken });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(401);
    });
  });
});

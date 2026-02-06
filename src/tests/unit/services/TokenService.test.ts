import { TokenService } from "../../../infra/services/TokenService";

describe("TokenService", () => {
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService();
  });

  describe("generateToken", () => {
    it("deve gerar um token JWT válido", () => {
      const payload = {
        userId: "user-123",
        email: "test@test.com"
      };

      const token = tokenService.generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT tem 3 partes
    });

    it("deve gerar tokens com estrutura JWT válida", () => {
      const payload = {
        userId: "user-123",
        email: "test@test.com"
      };

      const token = tokenService.generateToken(payload);
      const parts = token.split(".");

      // Token JWT tem 3 partes: header.payload.signature
      expect(parts.length).toBe(3);
      expect(parts[0]).toBeTruthy();
      expect(parts[1]).toBeTruthy();
      expect(parts[2]).toBeTruthy();
    });
  });

  describe("generateRefreshToken", () => {
    it("deve gerar um refresh token JWT válido", () => {
      const payload = {
        userId: "user-123",
        email: "test@test.com"
      };

      const refreshToken = tokenService.generateRefreshToken(payload);

      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe("string");
      expect(refreshToken.split(".").length).toBe(3);
    });

    it("deve gerar refresh token diferente do access token", () => {
      const payload = {
        userId: "user-123",
        email: "test@test.com"
      };

      const accessToken = tokenService.generateToken(payload);
      const refreshToken = tokenService.generateRefreshToken(payload);

      expect(accessToken).not.toBe(refreshToken);
    });
  });

  describe("generateTokenPair", () => {
    it("deve gerar um par de tokens (access e refresh)", () => {
      const payload = {
        userId: "user-123",
        email: "test@test.com"
      };

      const tokenPair = tokenService.generateTokenPair(payload);

      expect(tokenPair.accessToken).toBeDefined();
      expect(tokenPair.refreshToken).toBeDefined();
      expect(tokenPair.accessToken).not.toBe(tokenPair.refreshToken);
    });
  });

  describe("verifyToken", () => {
    it("deve verificar e decodificar um token válido", () => {
      const payload = {
        userId: "user-123",
        email: "test@test.com"
      };

      const token = tokenService.generateToken(payload);
      const decoded = tokenService.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
    });

    it("deve retornar null para token inválido", () => {
      const decoded = tokenService.verifyToken("token-invalido");

      expect(decoded).toBeNull();
    });

    it("deve retornar null para token malformado", () => {
      const decoded = tokenService.verifyToken("abc.def.ghi");

      expect(decoded).toBeNull();
    });
  });

  describe("verifyRefreshToken", () => {
    it("deve verificar e decodificar um refresh token válido", () => {
      const payload = {
        userId: "user-123",
        email: "test@test.com"
      };

      const refreshToken = tokenService.generateRefreshToken(payload);
      const decoded = tokenService.verifyRefreshToken(refreshToken);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
    });

    it("deve retornar null para refresh token inválido", () => {
      const decoded = tokenService.verifyRefreshToken("token-invalido");

      expect(decoded).toBeNull();
    });

    it("não deve verificar access token como refresh token", () => {
      const payload = {
        userId: "user-123",
        email: "test@test.com"
      };

      const accessToken = tokenService.generateToken(payload);
      const decoded = tokenService.verifyRefreshToken(accessToken);

      // Access token usa secret diferente, então deve falhar
      expect(decoded).toBeNull();
    });
  });

  describe("invalidateToken e isTokenBlacklisted", () => {
    it("deve adicionar token à blacklist", async () => {
      const payload = {
        userId: "user-123",
        email: "test@test.com"
      };

      const token = tokenService.generateToken(payload);
      
      await tokenService.invalidateToken(token);
      const isBlacklisted = await tokenService.isTokenBlacklisted(token);

      expect(isBlacklisted).toBe(true);
    });

    it("deve retornar false para token não blacklistado", async () => {
      const payload = {
        userId: "user-123",
        email: "test@test.com"
      };

      const token = tokenService.generateToken(payload);
      const isBlacklisted = await tokenService.isTokenBlacklisted(token);

      expect(isBlacklisted).toBe(false);
    });
  });

  describe("invalidateRefreshToken e isRefreshTokenBlacklisted", () => {
    it("deve adicionar refresh token à blacklist", async () => {
      const payload = {
        userId: "user-123",
        email: "test@test.com"
      };

      const refreshToken = tokenService.generateRefreshToken(payload);
      
      await tokenService.invalidateRefreshToken(refreshToken);
      const isBlacklisted = await tokenService.isRefreshTokenBlacklisted(refreshToken);

      expect(isBlacklisted).toBe(true);
    });

    it("deve retornar false para refresh token não blacklistado", async () => {
      const payload = {
        userId: "user-123",
        email: "test@test.com"
      };

      const refreshToken = tokenService.generateRefreshToken(payload);
      const isBlacklisted = await tokenService.isRefreshTokenBlacklisted(refreshToken);

      expect(isBlacklisted).toBe(false);
    });

    it("blacklists de access e refresh tokens devem ser independentes", async () => {
      const payload = {
        userId: "user-123",
        email: "test@test.com"
      };

      const accessToken = tokenService.generateToken(payload);
      const refreshToken = tokenService.generateRefreshToken(payload);
      
      await tokenService.invalidateToken(accessToken);

      const isAccessBlacklisted = await tokenService.isTokenBlacklisted(accessToken);
      const isRefreshBlacklisted = await tokenService.isRefreshTokenBlacklisted(refreshToken);

      expect(isAccessBlacklisted).toBe(true);
      expect(isRefreshBlacklisted).toBe(false);
    });
  });
});

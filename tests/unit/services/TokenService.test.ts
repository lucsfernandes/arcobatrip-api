import { TokenService } from "../../../src/infra/services/TokenService";

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
});

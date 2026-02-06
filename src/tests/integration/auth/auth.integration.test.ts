import request from "supertest";
import express, { Express } from "express";
import { RegisterUserUseCase } from "../../../application/usecases/auth/register/RegisterUserUseCase";
import { LoginUserUseCase } from "../../../application/usecases/auth/login/LoginUserUseCase";
import { LogoutUserUseCase } from "../../../application/usecases/auth/logout/LogoutUserUseCase";
import { RefreshTokenUseCase } from "../../../application/usecases/auth/refresh/RefreshTokenUseCase";
import { RegisterUserController } from "../../../presentation/controllers/Auth/RegisterUserController";
import { LoginUserController } from "../../../presentation/controllers/Auth/LoginUserController";
import { LogoutUserController } from "../../../presentation/controllers/Auth/LogoutUserController";
import { RefreshTokenController } from "../../../presentation/controllers/Auth/RefreshTokenController";
import { GetMeController } from "../../../presentation/controllers/Auth/GetMeController";
import { MockUserRepo } from "../../mocks/mockUserRepo";
import { MockTokenService } from "../../mocks/mockTokenService";
import { authMiddleware } from "../../../presentation/middlewares/authMiddleware";

// Mock do tokenService global para o middleware
jest.mock("../../../infra/services/TokenService", () => {
  const mockTokenService = new (require("../../mocks/mockTokenService").MockTokenService)();
  return {
    tokenService: mockTokenService,
    TokenService: jest.fn(() => mockTokenService)
  };
});

describe("Auth Integration Tests", () => {
  let app: Express;
  let mockUserRepo: MockUserRepo;
  let mockTokenService: MockTokenService;

  beforeEach(() => {
    mockUserRepo = new MockUserRepo();
    mockTokenService = new MockTokenService();

    // Configurar Express para testes
    app = express();
    app.use(express.json());

    // Configurar use cases
    const registerUserUseCase = new RegisterUserUseCase(mockUserRepo, mockTokenService);
    const loginUserUseCase = new LoginUserUseCase(mockUserRepo, mockTokenService);
    const logoutUserUseCase = new LogoutUserUseCase(mockTokenService);
    const refreshTokenUseCase = new RefreshTokenUseCase(mockTokenService);

    // Configurar controllers
    const registerUserController = new RegisterUserController(registerUserUseCase);
    const loginUserController = new LoginUserController(loginUserUseCase);
    const logoutUserController = new LogoutUserController(logoutUserUseCase);
    const refreshTokenController = new RefreshTokenController(refreshTokenUseCase);
    const getMeController = new GetMeController(mockUserRepo);

    // Configurar rotas
    app.post("/api/v1/auth/register", async (req, res) => {
      await registerUserController.execute(req, res);
    });

    app.post("/api/v1/auth/login", async (req, res) => {
      await loginUserController.execute(req, res);
    });

    app.post("/api/v1/auth/logout", (req, res, next) => {
      // Mock simples do middleware
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ message: "Token não fornecido" });
        return;
      }
      const [, token] = authHeader.split(" ");
      const decoded = mockTokenService.verifyToken(token);
      if (!decoded) {
        res.status(401).json({ message: "Token inválido" });
        return;
      }
      (req as any).userId = decoded.userId;
      logoutUserController.execute(req, res);
    });

    app.get("/api/v1/auth/me", (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ message: "Token não fornecido" });
        return;
      }
      const [, token] = authHeader.split(" ");
      const decoded = mockTokenService.verifyToken(token);
      if (!decoded) {
        res.status(401).json({ message: "Token inválido" });
        return;
      }
      (req as any).userId = decoded.userId;
      getMeController.execute(req, res);
    });

    app.post("/api/v1/auth/refresh", async (req, res) => {
      await refreshTokenController.execute(req, res);
    });
  });

  afterEach(() => {
    mockUserRepo.clear();
    mockTokenService.clear();
  });

  const validRegisterPayload = {
    full_name: "João Silva",
    phone: "11999999999",
    email: "joao@test.com",
    password: "Senha@123",
    confirm_password: "Senha@123",
    birth_date: "1990-01-15"
  };

  describe("POST /api/v1/auth/register", () => {
    it("deve registrar um novo usuário com sucesso", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(validRegisterPayload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(validRegisterPayload.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.expiresIn).toBeDefined();
    });

    it("deve retornar 409 quando email já existe", async () => {
      // Primeiro registro
      await request(app)
        .post("/api/v1/auth/register")
        .send(validRegisterPayload);

      // Segundo registro com mesmo email
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(validRegisterPayload)
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it("deve retornar 400 quando senhas não coincidem", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          ...validRegisterPayload,
          confirm_password: "SenhaDiferente@123"
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      // Registrar usuário antes dos testes de login
      await request(app)
        .post("/api/v1/auth/register")
        .send(validRegisterPayload);
    });

    it("deve fazer login com credenciais válidas", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: validRegisterPayload.email,
          password: validRegisterPayload.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.expiresIn).toBeDefined();
    });

    it("deve retornar 401 com credenciais inválidas", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: validRegisterPayload.email,
          password: "SenhaErrada@123"
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("deve retornar 401 para email não cadastrado", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "inexistente@test.com",
          password: validRegisterPayload.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    let authToken: string;

    beforeEach(async () => {
      // Registrar e fazer login
      const registerResponse = await request(app)
        .post("/api/v1/auth/register")
        .send(validRegisterPayload);

      authToken = registerResponse.body.data.accessToken;
    });

    it("deve fazer logout com sucesso", async () => {
      const response = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe("Logout realizado com sucesso");
    });

    it("deve retornar 401 sem token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/logout")
        .expect(401);

      expect(response.body.message).toBeDefined();
    });
  });

  describe("GET /api/v1/auth/me", () => {
    let authToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post("/api/v1/auth/register")
        .send(validRegisterPayload);

      authToken = registerResponse.body.data.accessToken;
    });

    it("deve retornar dados do usuário autenticado", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(validRegisterPayload.email);
      expect(response.body.data.fullName).toBe(validRegisterPayload.full_name);
    });

    it("deve retornar 401 sem token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it("deve retornar 401 com token inválido", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer token-invalido")
        .expect(401);

      expect(response.body.message).toBeDefined();
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    let refreshToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post("/api/v1/auth/register")
        .send(validRegisterPayload);

      refreshToken = registerResponse.body.data.refreshToken;
    });

    it("deve renovar tokens com refresh token válido", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.expiresIn).toBeDefined();
    });

    it("deve gerar novos tokens diferentes dos anteriores", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken })
        .expect(200);

      expect(response.body.data.refreshToken).not.toBe(refreshToken);
    });

    it("deve retornar 401 com refresh token inválido", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: "token-invalido" })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("deve retornar 401 ao tentar reutilizar refresh token (token rotation)", async () => {
      // Primeiro uso
      await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken })
        .expect(200);

      // Segundo uso - deve falhar
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("deve permitir acesso com novo access token após refresh", async () => {
      const refreshResponse = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken })
        .expect(200);

      const newAccessToken = refreshResponse.body.data.accessToken;

      const meResponse = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${newAccessToken}`)
        .expect(200);

      expect(meResponse.body.data.email).toBe(validRegisterPayload.email);
    });
  });

  describe("Fluxo completo de autenticação", () => {
    it("deve permitir registro, login, refresh e logout em sequência", async () => {
      // 1. Registrar
      const registerResponse = await request(app)
        .post("/api/v1/auth/register")
        .send(validRegisterPayload)
        .expect(201);

      expect(registerResponse.body.data.accessToken).toBeDefined();
      expect(registerResponse.body.data.refreshToken).toBeDefined();

      // 2. Login
      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: validRegisterPayload.email,
          password: validRegisterPayload.password
        })
        .expect(200);

      const accessToken = loginResponse.body.data.accessToken;
      const refreshToken = loginResponse.body.data.refreshToken;
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();

      // 3. Acessar perfil
      const meResponse = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(meResponse.body.data.email).toBe(validRegisterPayload.email);

      // 4. Refresh token
      const refreshResponse = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken })
        .expect(200);

      const newAccessToken = refreshResponse.body.data.accessToken;
      expect(newAccessToken).toBeDefined();

      // 5. Acessar perfil com novo token
      const meResponse2 = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${newAccessToken}`)
        .expect(200);

      expect(meResponse2.body.data.email).toBe(validRegisterPayload.email);

      // 6. Logout
      const logoutResponse = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${newAccessToken}`)
        .expect(200);

      expect(logoutResponse.body.data.message).toBe("Logout realizado com sucesso");
    });
  });
});

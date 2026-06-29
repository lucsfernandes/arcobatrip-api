import request from "supertest";
import express, { Express } from "express";
import { SignupUseCase } from "../../../application/usecases/auth/signup/SignupUseCase";
import { LoginUserUseCase } from "../../../application/usecases/auth/login/LoginUserUseCase";
import { LogoutUserUseCase } from "../../../application/usecases/auth/logout/LogoutUserUseCase";
import { RefreshTokenUseCase } from "../../../application/usecases/auth/refresh/RefreshTokenUseCase";
import { SignupController } from "../../../presentation/controllers/Auth/SignupController";
import { LoginUserController } from "../../../presentation/controllers/Auth/LoginUserController";
import { LogoutUserController } from "../../../presentation/controllers/Auth/LogoutUserController";
import { RefreshTokenController } from "../../../presentation/controllers/Auth/RefreshTokenController";
import { GetMeController } from "../../../presentation/controllers/Auth/GetMeController";
import { MockUserRepo } from "../../mocks/mockUserRepo";
import { MockTokenService } from "../../mocks/mockTokenService";

describe("Auth Integration Tests (contract envelope)", () => {
  let app: Express;
  let mockUserRepo: MockUserRepo;
  let mockTokenService: MockTokenService;

  beforeEach(() => {
    mockUserRepo = new MockUserRepo();
    mockTokenService = new MockTokenService();

    app = express();
    app.use(express.json());

    const signupUseCase = new SignupUseCase(mockUserRepo, mockTokenService);
    const loginUserUseCase = new LoginUserUseCase(mockUserRepo, mockTokenService);
    const logoutUserUseCase = new LogoutUserUseCase(mockTokenService);
    const refreshTokenUseCase = new RefreshTokenUseCase(mockTokenService);

    const signupController = new SignupController(signupUseCase);
    const loginUserController = new LoginUserController(loginUserUseCase);
    const logoutUserController = new LogoutUserController(logoutUserUseCase);
    const refreshTokenController = new RefreshTokenController(refreshTokenUseCase);
    const getMeController = new GetMeController(mockUserRepo);

    // Minimal auth gate mirroring the real middleware's 401 envelope.
    const gate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(" ")[1];
      const decoded = token ? mockTokenService.verifyToken(token) : null;
      if (!decoded) {
        res.status(401).json({ error: { code: "unauthorized", message: "Token inválido" } });
        return;
      }
      (req as { userId?: string }).userId = decoded.userId;
      next();
    };

    app.post("/api/v1/auth/signup", (req, res) => {
      void signupController.execute(req, res);
    });
    app.post("/api/v1/auth/login", (req, res) => {
      void loginUserController.execute(req, res);
    });
    app.post("/api/v1/auth/logout", gate, (req, res) => {
      void logoutUserController.execute(req, res);
    });
    app.get("/api/v1/me", gate, (req, res) => {
      void getMeController.execute(req, res);
    });
    app.post("/api/v1/auth/refresh", (req, res) => {
      void refreshTokenController.execute(req, res);
    });
  });

  afterEach(() => {
    mockUserRepo.clear();
    mockTokenService.clear();
  });

  const signupPayload = {
    name: "Ana Souza",
    email: "ana.souza@email.com",
    password: "supersecret",
  };

  describe("POST /api/v1/auth/signup", () => {
    it("creates an account and returns 201 { token, user }", async () => {
      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send(signupPayload)
        .expect(201);

      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(signupPayload.email);
      expect(response.body.user.name).toBe(signupPayload.name);
    });

    it("returns 409 email_conflict when the email already exists", async () => {
      await request(app).post("/api/v1/auth/signup").send(signupPayload);
      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send(signupPayload)
        .expect(409);

      expect(response.body.error.code).toBe("email_conflict");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/v1/auth/signup").send(signupPayload);
    });

    it("returns 200 { token, user } for valid credentials", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: signupPayload.email, password: signupPayload.password })
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(signupPayload.email);
    });

    it("returns 401 with the error envelope for invalid credentials", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: signupPayload.email, password: "wrong-password" })
        .expect(401);

      expect(response.body.error.code).toBe("unauthorized");
    });
  });

  describe("GET /api/v1/me", () => {
    let token: string;

    beforeEach(async () => {
      const res = await request(app).post("/api/v1/auth/signup").send(signupPayload);
      token = res.body.token;
    });

    it("returns the bare contract user", async () => {
      const response = await request(app)
        .get("/api/v1/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.email).toBe(signupPayload.email);
      expect(response.body.name).toBe(signupPayload.name);
    });

    it("returns 401 envelope without a token", async () => {
      const response = await request(app).get("/api/v1/me").expect(401);
      expect(response.body.error.code).toBe("unauthorized");
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    let token: string;

    beforeEach(async () => {
      const res = await request(app).post("/api/v1/auth/signup").send(signupPayload);
      token = res.body.token;
    });

    it("logs out successfully", async () => {
      const response = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe("Logout realizado com sucesso");
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    let refreshToken: string;

    beforeEach(async () => {
      await request(app).post("/api/v1/auth/signup").send(signupPayload);
      const user = await mockUserRepo.findByEmail(signupPayload.email);
      refreshToken = mockTokenService.generateRefreshToken({
        userId: user?.id ?? "user-x",
        email: signupPayload.email,
      });
    });

    it("rotates tokens for a valid refresh token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.refreshToken).not.toBe(refreshToken);
    });

    it("returns 401 envelope for an invalid refresh token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: "token-invalido" })
        .expect(401);

      expect(response.body.error.code).toBe("unauthorized");
    });
  });
});

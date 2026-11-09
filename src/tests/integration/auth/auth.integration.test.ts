import request from "supertest";
import express, { Express } from "express";
import cookieParser from "cookie-parser";
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
    // cookie-parser popula req.cookies — exercita o fluxo web (cookie HttpOnly).
    app.use(cookieParser());

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

  /** Normaliza o header set-cookie (string | string[]) num array. */
  const setCookieArray = (res: request.Response): string[] => {
    const raw = res.headers["set-cookie"];
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  };

  /** Extrai o VALOR de um cookie pelo nome a partir do header set-cookie. */
  const getCookieValue = (
    res: request.Response,
    name: string
  ): string | undefined => {
    const entry = setCookieArray(res).find((c) => c.startsWith(`${name}=`));
    return entry ? entry.split(";")[0].split("=")[1] : undefined;
  };

  describe("POST /api/v1/auth/signup", () => {
    it("creates an account and returns 201 { token, user } + sets auth cookies", async () => {
      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send(signupPayload)
        .expect(201);

      // Web: cookies HttpOnly emitidos. Mobile: o refreshToken TAMBÉM vai no corpo.
      expect(getCookieValue(response, "access_token")).toBeTruthy();
      expect(getCookieValue(response, "refresh_token")).toBeTruthy();
      expect(setCookieArray(response).join(";")).toContain("HttpOnly");
      expect(response.body.refreshToken).toBeDefined();

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

    it("returns 200 { token, user } for valid credentials + sets auth cookies", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: signupPayload.email, password: signupPayload.password })
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(signupPayload.email);
      // Web: cookies HttpOnly emitidos; mobile: refreshToken TAMBÉM no corpo.
      expect(getCookieValue(response, "access_token")).toBeTruthy();
      expect(getCookieValue(response, "refresh_token")).toBeTruthy();
      expect(response.body.refreshToken).toBeDefined();
    });

    it("includes the avatar and accent in the login user", async () => {
      const stored = await mockUserRepo.findByEmailWithPassword(signupPayload.email);
      await mockUserRepo.update(stored!.id, {
        avatarUrl: "https://res.cloudinary.com/demo/avatar.jpg",
        accent: "#16c0e9",
      });

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: signupPayload.email, password: signupPayload.password })
        .expect(200);

      expect(response.body.user.avatarUrl).toBe("https://res.cloudinary.com/demo/avatar.jpg");
      expect(response.body.user.accent).toBe("#16c0e9");
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

    it("logs out successfully and clears the auth cookies", async () => {
      const response = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe("Logout realizado com sucesso");
      // clearCookie emite Set-Cookie com o cookie expirado (valor vazio).
      const cookies = setCookieArray(response).join(";");
      expect(cookies).toContain("access_token=;");
      expect(cookies).toContain("refresh_token=;");
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

    it("rotates tokens for a valid refresh token (mobile: body)", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.refreshToken).not.toBe(refreshToken);
    });

    it("rotates tokens via the HttpOnly cookie with NO body (web flow)", async () => {
      // Web: faz login para receber o cookie refresh_token...
      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: signupPayload.email, password: signupPayload.password })
        .expect(200);
      const refreshCookie = getCookieValue(login, "refresh_token");
      expect(refreshCookie).toBeTruthy();

      // ...e renova enviando SÓ o cookie, sem corpo.
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", `refresh_token=${refreshCookie}`)
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      // Rotação: novos cookies emitidos no refresh.
      expect(getCookieValue(response, "access_token")).toBeTruthy();
      expect(getCookieValue(response, "refresh_token")).toBeTruthy();
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

import request from "supertest";
import express, { Express } from "express";
import cookieParser from "cookie-parser";
import { GoogleSignInUseCase } from "../../../application/usecases/auth/socialGoogle/GoogleSignInUseCase";
import { GoogleSignInController } from "../../../presentation/controllers/Auth/GoogleSignInController";
import { MockUserRepo } from "../../mocks/mockUserRepo";
import { MockTokenService } from "../../mocks/mockTokenService";
import { MockGoogleTokenVerifier } from "../../mocks/mockGoogleTokenVerifier";

describe("Google Sign-In Integration (POST /api/v1/auth/social/google)", () => {
  let app: Express;
  let mockUserRepo: MockUserRepo;
  let mockTokenService: MockTokenService;
  let mockVerifier: MockGoogleTokenVerifier;

  beforeEach(() => {
    mockUserRepo = new MockUserRepo();
    mockTokenService = new MockTokenService();
    mockVerifier = new MockGoogleTokenVerifier();

    app = express();
    app.use(express.json());
    app.use(cookieParser());

    const useCase = new GoogleSignInUseCase(
      mockUserRepo,
      mockTokenService,
      mockVerifier
    );
    const controller = new GoogleSignInController(useCase);

    app.post("/api/v1/auth/social/google", (req, res) => {
      void controller.execute(req, res);
    });
  });

  afterEach(() => {
    mockUserRepo.clear();
    mockTokenService.clear();
  });

  const setCookieArray = (res: request.Response): string[] => {
    const raw = res.headers["set-cookie"];
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  };
  const getCookieValue = (
    res: request.Response,
    name: string
  ): string | undefined => {
    const entry = setCookieArray(res).find((c) => c.startsWith(`${name}=`));
    return entry ? entry.split(";")[0].split("=")[1] : undefined;
  };

  it("logs in an EXISTING user (automatic account link) and returns { token, refreshToken, user }", async () => {
    await mockUserRepo.create({
      fullName: "Ana Souza",
      email: "ana.souza@email.com",
      password: "hashed-password",
    });
    mockVerifier.identity = {
      sub: "google-uid-1",
      email: "ana.souza@email.com",
      emailVerified: true,
      name: "Ana Souza",
      picture: "https://lh3.googleusercontent.com/a/ana",
    };

    const response = await request(app)
      .post("/api/v1/auth/social/google")
      .send({ idToken: "valid-google-id-token" })
      .expect(200);

    expect(response.body.token).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.user.email).toBe("ana.souza@email.com");
    expect(response.body.user.name).toBe("Ana Souza");
    // Web também recebe os cookies HttpOnly.
    expect(getCookieValue(response, "access_token")).toBeTruthy();
    expect(getCookieValue(response, "refresh_token")).toBeTruthy();

    // Não criou uma segunda conta — apenas linkou a existente.
    expect(await mockUserRepo.existsByEmail("ana.souza@email.com")).toBe(true);
  });

  it("CREATES a new user when the Google email is unknown (name + avatar from Google)", async () => {
    mockVerifier.identity = {
      sub: "google-uid-2",
      email: "novo.viajante@gmail.com",
      emailVerified: true,
      name: "Novo Viajante",
      picture: "https://lh3.googleusercontent.com/a/novo",
    };
    expect(await mockUserRepo.existsByEmail("novo.viajante@gmail.com")).toBe(false);

    const response = await request(app)
      .post("/api/v1/auth/social/google")
      .send({ idToken: "valid-google-id-token" })
      .expect(200);

    expect(response.body.token).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.user.email).toBe("novo.viajante@gmail.com");
    expect(response.body.user.name).toBe("Novo Viajante");
    expect(response.body.user.avatarUrl).toBe(
      "https://lh3.googleusercontent.com/a/novo"
    );

    // A conta foi persistida com o email verificado pelo Google.
    const created = await mockUserRepo.findByEmail("novo.viajante@gmail.com");
    expect(created).not.toBeNull();
    expect(created?.emailVerifiedAt).toBeTruthy();
  });

  it("REJECTS a Google account whose email is not verified (google_email_unverified)", async () => {
    mockVerifier.identity = {
      sub: "google-uid-3",
      email: "unverified@gmail.com",
      emailVerified: false,
      name: "Sem Verificar",
    };

    const response = await request(app)
      .post("/api/v1/auth/social/google")
      .send({ idToken: "valid-google-id-token" })
      .expect(401);

    expect(response.body.error.code).toBe("google_email_unverified");
    expect(await mockUserRepo.existsByEmail("unverified@gmail.com")).toBe(false);
  });

  it("returns 401 for an invalid/unverifiable ID token", async () => {
    mockVerifier.identity = null; // verify() falha

    const response = await request(app)
      .post("/api/v1/auth/social/google")
      .send({ idToken: "garbage" })
      .expect(401);

    expect(response.body.error.code).toBe("unauthorized");
  });

  it("returns 400 google_not_configured when GOOGLE_CLIENT_ID is empty", async () => {
    mockVerifier.configured = false;

    const response = await request(app)
      .post("/api/v1/auth/social/google")
      .send({ idToken: "valid-google-id-token" })
      .expect(400);

    expect(response.body.error.code).toBe("google_not_configured");
  });
});

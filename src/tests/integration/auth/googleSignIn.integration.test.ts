import request from "supertest";
import express, { Express } from "express";
import { GoogleSignInUseCase } from "../../../application/usecases/auth/socialGoogle/GoogleSignInUseCase";
import {
  GoogleIdentity,
  IGoogleTokenVerifier,
} from "../../../application/usecases/auth/IGoogleTokenVerifier";
import { GoogleSignInController } from "../../../presentation/controllers/Auth/GoogleSignInController";
import { validateBody } from "../../../presentation/utils/validator";
import { googleSignInPayloadValidation } from "../../../presentation/validators/auth/authPayloadValidation";
import { MockUserRepo } from "../../mocks/mockUserRepo";
import { MockTokenService } from "../../mocks/mockTokenService";

class FakeGoogleVerifier implements IGoogleTokenVerifier {
  constructor(private configured = true) {}

  isConfigured(): boolean {
    return this.configured;
  }

  async verify(idToken: string): Promise<GoogleIdentity | null> {
    if (idToken !== "valid-token") return null;
    return { sub: "sub-1", email: "ana@gmail.com", emailVerified: true, name: "Ana Souza" };
  }
}

function buildApp(verifier: IGoogleTokenVerifier): Express {
  const app = express();
  app.use(express.json());
  const controller = new GoogleSignInController(
    new GoogleSignInUseCase(new MockUserRepo(), new MockTokenService(), verifier)
  );
  app.post(
    "/api/v1/auth/social/google",
    validateBody(googleSignInPayloadValidation),
    (req, res) => {
      void controller.execute(req, res);
    }
  );
  return app;
}

describe("POST /api/v1/auth/social/google", () => {
  it("returns the login envelope { token, refreshToken, user } and sets the cookies", async () => {
    const response = await request(buildApp(new FakeGoogleVerifier()))
      .post("/api/v1/auth/social/google")
      .send({ idToken: "valid-token" });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({ email: "ana@gmail.com", name: "Ana Souza" });
    expect(response.body.user.password).toBeUndefined();
    const cookies = ([] as string[]).concat(response.headers["set-cookie"] ?? []);
    expect(cookies.some((cookie) => cookie.startsWith("refresh_token="))).toBe(true);
  });

  it("rejects a body without idToken (400 validation_error)", async () => {
    const response = await request(buildApp(new FakeGoogleVerifier()))
      .post("/api/v1/auth/social/google")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("validation_error");
  });

  it("rejects an invalid token (401 unauthorized)", async () => {
    const response = await request(buildApp(new FakeGoogleVerifier()))
      .post("/api/v1/auth/social/google")
      .send({ idToken: "forged" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("unauthorized");
  });

  it("answers 503 google_not_configured without client ids", async () => {
    const response = await request(buildApp(new FakeGoogleVerifier(false)))
      .post("/api/v1/auth/social/google")
      .send({ idToken: "valid-token" });

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("google_not_configured");
  });
});

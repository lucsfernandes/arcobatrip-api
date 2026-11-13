import bcrypt from "bcryptjs";
import { GoogleSignInUseCase } from "../../../../application/usecases/auth/socialGoogle/GoogleSignInUseCase";
import {
  GoogleIdentity,
  IGoogleTokenVerifier,
} from "../../../../application/usecases/auth/IGoogleTokenVerifier";
import { MockUserRepo } from "../../../mocks/mockUserRepo";
import { MockTokenService } from "../../../mocks/mockTokenService";
import { User } from "../../../../domain/entities/User/user.entity";
import { AuditLog } from "../../../../application/services/AuditLog";
import { AuditEvents } from "../../../../application/services/auditEvents";
import { MockAuditLogRepo } from "../../../mocks/mockAuditLogRepo";

/** Fake verifier: returns `identity` for the token "valid-token", null otherwise. */
class FakeGoogleVerifier implements IGoogleTokenVerifier {
  constructor(
    private identity: GoogleIdentity | null,
    private configured = true
  ) {}

  isConfigured(): boolean {
    return this.configured;
  }

  async verify(idToken: string): Promise<GoogleIdentity | null> {
    return idToken === "valid-token" ? this.identity : null;
  }
}

const googleIdentity: GoogleIdentity = {
  sub: "google-sub-1",
  email: "ana@gmail.com",
  emailVerified: true,
  name: "Ana Souza",
  picture: "https://lh3.googleusercontent.com/ana.jpg",
};

describe("GoogleSignInUseCase", () => {
  let userRepo: MockUserRepo;
  let tokenService: MockTokenService;

  const buildUseCase = (verifier: IGoogleTokenVerifier) =>
    new GoogleSignInUseCase(userRepo, tokenService, verifier);

  const existingUser = (overrides: Partial<User> = {}): User =>
    ({
      id: "user-ana",
      fullName: "Ana (cadastro)",
      email: "ana@gmail.com",
      password: "$2b$12$existing.hash.of.a.known.password.xxxxxxxxxxxxxxxxxxxxx",
      isActive: true,
      phoneVerified: false,
      emailVerifiedAt: new Date("2026-01-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as User;

  beforeEach(() => {
    userRepo = new MockUserRepo();
    tokenService = new MockTokenService();
  });

  afterEach(() => {
    userRepo.clear();
    tokenService.clear();
  });

  it("creates a verified, password-less account on the first Google sign-in", async () => {
    const result = await buildUseCase(new FakeGoogleVerifier(googleIdentity)).execute({
      idToken: "valid-token",
    });

    expect(result.isSuccess).toBe(true);
    const session = result.getValue();
    expect(session.user.email).toBe("ana@gmail.com");
    expect(session.user.fullName).toBe("Ana Souza");
    expect(session.user.avatarUrl).toBe(googleIdentity.picture);
    expect(session.user.emailVerifiedAt).toBeInstanceOf(Date);
    expect(session.accessToken).toBeDefined();
    expect(session.refreshToken).toBeDefined();

    // The stored password is a hash of a random secret: no password login.
    const stored = await userRepo.findByEmailWithPassword("ana@gmail.com");
    expect(stored?.password).toMatch(/^\$2[aby]\$12\$/);
  });

  it("derives the name from the e-mail when Google sends none", async () => {
    const result = await buildUseCase(
      new FakeGoogleVerifier({ ...googleIdentity, name: undefined })
    ).execute({ idToken: "valid-token" });
    expect(result.getValue().user.fullName).toBe("ana");
  });

  it("signs in to the existing account with the same e-mail (no duplicate)", async () => {
    userRepo.addUser(existingUser());

    const result = await buildUseCase(new FakeGoogleVerifier(googleIdentity)).execute({
      idToken: "valid-token",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().user.id).toBe("user-ana");
    expect(result.getValue().user.fullName).toBe("Ana (cadastro)");
    const stored = await userRepo.findByEmailWithPassword("ana@gmail.com");
    expect(stored?.password).toBe(existingUser().password);
  });

  it("does NOT link an UNCONFIRMED account: keeps the password and answers 409", async () => {
    // Account pre-takeover guard: whoever created this account may not own the
    // e-mail, so Google does not take it over (and no confirmation link is
    // sent, which could make the owner confirm someone else's account).
    userRepo.addUser(existingUser({ emailVerifiedAt: null }));

    const result = await buildUseCase(new FakeGoogleVerifier(googleIdentity)).execute({
      idToken: "valid-token",
    });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(409);
    expect(result.errorValue().code).toBe("account_email_unconfirmed");

    const stored = await userRepo.findByEmailWithPassword("ana@gmail.com");
    expect(stored?.password).toBe(existingUser().password);
    expect(stored?.emailVerifiedAt ?? null).toBeNull();
  });

  it("keeps the password of a CONFIRMED account, so both sign-in methods work", async () => {
    userRepo.addUser(existingUser());

    const result = await buildUseCase(new FakeGoogleVerifier(googleIdentity)).execute({
      idToken: "valid-token",
    });

    expect(result.isSuccess).toBe(true);
    const stored = await userRepo.findByEmailWithPassword("ana@gmail.com");
    expect(stored?.password).toBe(existingUser().password);
  });

  it("refuses an inactive account (403)", async () => {
    userRepo.addUser(existingUser({ isActive: false }));

    const result = await buildUseCase(new FakeGoogleVerifier(googleIdentity)).execute({
      idToken: "valid-token",
    });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(403);
  });

  it("rejects an invalid or expired ID token (401)", async () => {
    const result = await buildUseCase(new FakeGoogleVerifier(googleIdentity)).execute({
      idToken: "forged-token",
    });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(401);
    expect(result.errorValue().code).toBe("unauthorized");
  });

  it("rejects a Google account whose e-mail is not verified (401)", async () => {
    const result = await buildUseCase(
      new FakeGoogleVerifier({ ...googleIdentity, emailVerified: false })
    ).execute({ idToken: "valid-token" });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().code).toBe("google_email_unverified");
    expect(await userRepo.existsByEmail("ana@gmail.com")).toBe(false);
  });

  it("answers google_not_configured (503) when GOOGLE_CLIENT_ID is empty", async () => {
    const result = await buildUseCase(new FakeGoogleVerifier(googleIdentity, false)).execute({
      idToken: "valid-token",
    });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(503);
    expect(result.errorValue().code).toBe("google_not_configured");
  });

  describe("auditoria", () => {
    it("records a Google login with the method and no e-mail in text", async () => {
      const auditRepo = new MockAuditLogRepo();
      const useCase = new GoogleSignInUseCase(
        userRepo,
        tokenService,
        new FakeGoogleVerifier(googleIdentity),
        new AuditLog(auditRepo)
      );

      const result = await useCase.execute({ idToken: "valid-token" });

      expect(result.isSuccess).toBe(true);
      expect(auditRepo.events).toHaveLength(1);
      expect(auditRepo.events[0]).toMatchObject({ event: AuditEvents.AuthLogin, details: { method: "google" } });
      expect(JSON.stringify(auditRepo.events[0])).not.toContain("ana@gmail.com");
    });

    it("records nothing when the Google token is invalid", async () => {
      const auditRepo = new MockAuditLogRepo();
      const useCase = new GoogleSignInUseCase(
        userRepo,
        tokenService,
        new FakeGoogleVerifier(googleIdentity),
        new AuditLog(auditRepo)
      );

      await useCase.execute({ idToken: "bad-token" });

      expect(auditRepo.events).toHaveLength(0);
    });
  });
});

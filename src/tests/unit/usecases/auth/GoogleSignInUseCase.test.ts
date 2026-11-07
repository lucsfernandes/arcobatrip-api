import bcrypt from "bcryptjs";
import { GoogleSignInUseCase } from "../../../../application/usecases/auth/socialGoogle/GoogleSignInUseCase";
import {
  GoogleIdentity,
  IGoogleTokenVerifier,
} from "../../../../application/usecases/auth/IGoogleTokenVerifier";
import { MockUserRepo } from "../../../mocks/mockUserRepo";
import { MockTokenService } from "../../../mocks/mockTokenService";
import { User } from "../../../../domain/entities/User/user.entity";

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

  it("takes over an UNCONFIRMED account safely: verifies it and voids the old password", async () => {
    userRepo.addUser(existingUser({ emailVerifiedAt: null }));

    const result = await buildUseCase(new FakeGoogleVerifier(googleIdentity)).execute({
      idToken: "valid-token",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().user.emailVerifiedAt).toBeInstanceOf(Date);
    const stored = await userRepo.findByEmailWithPassword("ana@gmail.com");
    expect(stored?.password).not.toBe(existingUser().password);
    expect(await bcrypt.compare("any-guess", stored!.password)).toBe(false);
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
});

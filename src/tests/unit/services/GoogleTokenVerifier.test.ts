import { OAuth2Client } from "google-auth-library";
import { GoogleTokenVerifier } from "../../../infra/services/GoogleTokenVerifier";

describe("GoogleTokenVerifier", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("is not configured without client ids", () => {
    expect(new GoogleTokenVerifier("").isConfigured()).toBe(false);
    expect(new GoogleTokenVerifier(" , ").isConfigured()).toBe(false);
  });

  it("accepts every comma-separated client id as an audience", async () => {
    const verifySpy = jest
      .spyOn(OAuth2Client.prototype, "verifyIdToken")
      .mockImplementation(async () => ({
        getPayload: () => ({
          iss: "https://accounts.google.com",
          sub: "google-sub-1",
          aud: "android-id",
          iat: 0,
          exp: 0,
          email: "ana@gmail.com",
          email_verified: true,
          name: "Ana",
          picture: "https://example.com/ana.jpg",
        }),
      }) as never);

    const verifier = new GoogleTokenVerifier(" web-id , android-id,ios-id ");
    const identity = await verifier.verify("id-token");

    expect(verifySpy).toHaveBeenCalledWith({
      idToken: "id-token",
      audience: ["web-id", "android-id", "ios-id"],
    });
    expect(identity).toEqual({
      sub: "google-sub-1",
      email: "ana@gmail.com",
      emailVerified: true,
      name: "Ana",
      picture: "https://example.com/ana.jpg",
    });
  });

  it("returns null (not a throw) when Google rejects the token", async () => {
    jest
      .spyOn(OAuth2Client.prototype, "verifyIdToken")
      .mockImplementation(async () => {
        throw new Error("Wrong recipient, payload audience != requiredAudience");
      });

    await expect(new GoogleTokenVerifier("web-id").verify("bad-token")).resolves.toBeNull();
  });
});

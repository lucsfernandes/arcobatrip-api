import request from "supertest";
import express, { Express } from "express";
import cookieParser from "cookie-parser";
import { authMiddleware, setAccountExistsCheck } from "../../../presentation/middlewares/authMiddleware";
import { validateBody } from "../../../presentation/utils/validator";
import { confirmAccountDeletionValidation } from "../../../presentation/validators/user/confirmAccountDeletionValidation";
import { RequestAccountDeletionController } from "../../../presentation/controllers/User/RequestAccountDeletionController";
import { ConfirmAccountDeletionController } from "../../../presentation/controllers/User/ConfirmAccountDeletionController";
import { RefreshTokenController } from "../../../presentation/controllers/Auth/RefreshTokenController";
import { RequestAccountDeletionUseCase } from "../../../application/usecases/users/requestAccountDeletion/RequestAccountDeletionUseCase";
import { ConfirmAccountDeletionUseCase } from "../../../application/usecases/users/confirmAccountDeletion/ConfirmAccountDeletionUseCase";
import { DeleteAccountUseCase } from "../../../application/usecases/users/deleteAccount/DeleteAccountUseCase";
import { RefreshTokenUseCase } from "../../../application/usecases/auth/refresh/RefreshTokenUseCase";
import { AccountEmailEmitter } from "../../../application/services/AccountEmailEmitter";
import { AuditLog } from "../../../application/services/AuditLog";
import { tokenService } from "../../../infra/services/TokenService";
import { MockUserRepo } from "../../mocks/mockUserRepo";
import { MockEmailService } from "../../mocks/mockEmailService";
import { MockVerificationTokenRepo } from "../../mocks/mockVerificationTokenRepo";
import { MockAccountDeletionRepo } from "../../mocks/mockAccountDeletionRepo";
import { MockStorageService } from "../../mocks/mockStorageService";
import { MockAuditLogRepo } from "../../mocks/mockAuditLogRepo";
import { User } from "../../../domain/entities/User/user.entity";

/**
 * The account deletion over HTTP, with the REAL auth middleware and the REAL
 * token service: the point is that once the deletion is confirmed, the cookies
 * that were valid a moment before stop working.
 */
describe("account deletion over HTTP", () => {
  let app: Express;
  let users: MockUserRepo;
  let email: MockEmailService;
  let accounts: MockAccountDeletionRepo;
  let cookie: string;
  let refreshCookie: string;

  const tokenFrom = (url: string) => new URL(url).searchParams.get("token") ?? "";

  beforeEach(() => {
    users = new MockUserRepo();
    email = new MockEmailService();
    accounts = new MockAccountDeletionRepo();
    const tokens = new MockVerificationTokenRepo();
    const audit = new AuditLog(new MockAuditLogRepo());

    users.addUser({
      id: "user-maria",
      fullName: "Maria Souza",
      email: "maria@exemplo.com",
      password: "x",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User);
    // The deletion removes the account, as the real transaction does.
    accounts.onApply = (plan) => users.removeUser(plan.userId);
    setAccountExistsCheck((id) => users.existsById(id));

    const deleteAccount = new DeleteAccountUseCase(users, accounts, new MockStorageService(), audit);
    const requestController = new RequestAccountDeletionController(
      new RequestAccountDeletionUseCase(users, new AccountEmailEmitter(email, tokens), audit)
    );
    const confirmController = new ConfirmAccountDeletionController(
      new ConfirmAccountDeletionUseCase(users, tokens, deleteAccount, audit)
    );
    const refreshController = new RefreshTokenController(new RefreshTokenUseCase(tokenService, users));

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    // Same shape as the real routes: the confirm route is public, the rest authenticated.
    app.post("/v1/users/me/deletion/confirm", validateBody(confirmAccountDeletionValidation), (req, res) => {
      void confirmController.execute(req, res);
    });
    app.post("/v1/users/me/deletion", authMiddleware, (req, res) => {
      void requestController.execute(req, res);
    });
    app.get("/v1/me", authMiddleware, (req, res) => {
      res.json({ id: (req as { userId?: string }).userId });
    });
    app.post("/v1/auth/refresh", (req, res) => {
      void refreshController.execute(req, res);
    });

    const pair = tokenService.generateTokenPair({ userId: "user-maria", email: "maria@exemplo.com" });
    cookie = `access_token=${pair.accessToken}`;
    refreshCookie = `refresh_token=${pair.refreshToken}`;
  });

  afterEach(() => {
    setAccountExistsCheck(null);
  });

  it("asking for the deletion needs a session", async () => {
    const res = await request(app).post("/v1/users/me/deletion");

    expect(res.status).toBe(401);
    expect(email.accountDeletions).toHaveLength(0);
  });

  it("asking sends the link and keeps the account working", async () => {
    const res = await request(app).post("/v1/users/me/deletion").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/link de confirmação/);
    expect(email.accountDeletions).toHaveLength(1);
    expect((await request(app).get("/v1/me").set("Cookie", cookie)).status).toBe(200);
  });

  it("confirming needs NO session: the link is the proof", async () => {
    await request(app).post("/v1/users/me/deletion").set("Cookie", cookie);
    const token = tokenFrom(email.accountDeletions[0].confirmUrl);

    const res = await request(app).post("/v1/users/me/deletion/confirm").send({ token });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Conta excluída.");
  });

  it("clears the session cookies when the deletion is confirmed", async () => {
    await request(app).post("/v1/users/me/deletion").set("Cookie", cookie);
    const token = tokenFrom(email.accountDeletions[0].confirmUrl);

    const res = await request(app).post("/v1/users/me/deletion/confirm").send({ token });

    const setCookies = (res.headers["set-cookie"] as unknown as string[]) ?? [];
    expect(setCookies.some((c) => c.startsWith("access_token=;"))).toBe(true);
    expect(setCookies.some((c) => c.startsWith("refresh_token=;"))).toBe(true);
  });

  it("after the confirmation the old access cookie stops working at once (401)", async () => {
    expect((await request(app).get("/v1/me").set("Cookie", cookie)).status).toBe(200);
    await request(app).post("/v1/users/me/deletion").set("Cookie", cookie);
    const token = tokenFrom(email.accountDeletions[0].confirmUrl);

    await request(app).post("/v1/users/me/deletion/confirm").send({ token });

    const after = await request(app).get("/v1/me").set("Cookie", cookie);
    expect(after.status).toBe(401);
    expect(after.body.error.code).toBe("unauthorized");
  });

  it("after the confirmation the old refresh cookie cannot get new tokens", async () => {
    await request(app).post("/v1/users/me/deletion").set("Cookie", cookie);
    const token = tokenFrom(email.accountDeletions[0].confirmUrl);
    await request(app).post("/v1/users/me/deletion/confirm").send({ token });

    const res = await request(app).post("/v1/auth/refresh").set("Cookie", refreshCookie);

    expect(res.status).toBe(401);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("a bad link answers 400 and leaves the session alone", async () => {
    const res = await request(app)
      .post("/v1/users/me/deletion/confirm")
      .set("Cookie", cookie)
      .send({ token: "not-a-real-token" });

    expect(res.status).toBe(400);
    expect(res.headers["set-cookie"]).toBeUndefined();
    expect((await request(app).get("/v1/me").set("Cookie", cookie)).status).toBe(200);
  });

  it("rejects a confirm body without a token or with extra fields (validation envelope)", async () => {
    const missing = await request(app).post("/v1/users/me/deletion/confirm").send({});
    const extra = await request(app).post("/v1/users/me/deletion/confirm").send({ token: "x", email: "maria@exemplo.com" });

    expect(missing.status).toBe(400);
    expect(missing.body.error.code).toBe("validation_error");
    expect(extra.status).toBe(400);
  });
});

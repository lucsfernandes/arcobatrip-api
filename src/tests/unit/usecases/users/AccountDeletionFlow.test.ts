import { RequestAccountDeletionUseCase } from "../../../../application/usecases/users/requestAccountDeletion/RequestAccountDeletionUseCase";
import { ConfirmAccountDeletionUseCase } from "../../../../application/usecases/users/confirmAccountDeletion/ConfirmAccountDeletionUseCase";
import { DeleteAccountUseCase } from "../../../../application/usecases/users/deleteAccount/DeleteAccountUseCase";
import { AccountEmailEmitter } from "../../../../application/services/AccountEmailEmitter";
import { AuditLog } from "../../../../application/services/AuditLog";
import { AuditEvents } from "../../../../application/services/auditEvents";
import { hashToken } from "../../../../application/utils/token";
import { MockUserRepo } from "../../../mocks/mockUserRepo";
import { MockEmailService } from "../../../mocks/mockEmailService";
import { MockVerificationTokenRepo } from "../../../mocks/mockVerificationTokenRepo";
import { MockAccountDeletionRepo } from "../../../mocks/mockAccountDeletionRepo";
import { MockStorageService } from "../../../mocks/mockStorageService";
import { MockAuditLogRepo } from "../../../mocks/mockAuditLogRepo";
import { User } from "../../../../domain/entities/User/user.entity";

const maria = (): User =>
  ({
    id: "user-maria",
    fullName: "Maria Souza",
    email: "maria@exemplo.com",
    password: "x",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as User;

/** The raw token is only in the e-mailed link: read it back from there, as the person would. */
const tokenFrom = (url: string) => new URL(url).searchParams.get("token") ?? "";

describe("account deletion flow (request → e-mailed link → confirm)", () => {
  let users: MockUserRepo;
  let tokens: MockVerificationTokenRepo;
  let email: MockEmailService;
  let accounts: MockAccountDeletionRepo;
  let auditRepo: MockAuditLogRepo;
  let request: RequestAccountDeletionUseCase;
  let confirm: ConfirmAccountDeletionUseCase;

  beforeEach(() => {
    users = new MockUserRepo();
    tokens = new MockVerificationTokenRepo();
    email = new MockEmailService();
    accounts = new MockAccountDeletionRepo();
    auditRepo = new MockAuditLogRepo();
    const audit = new AuditLog(auditRepo);
    const deleteAccount = new DeleteAccountUseCase(users, accounts, new MockStorageService(), audit);
    request = new RequestAccountDeletionUseCase(users, new AccountEmailEmitter(email, tokens), audit);
    confirm = new ConfirmAccountDeletionUseCase(users, tokens, deleteAccount, audit);
    users.addUser(maria());
  });

  describe("pedido", () => {
    it("sends a confirmation link to the account's e-mail and deletes nothing", async () => {
      const result = await request.execute({ userId: "user-maria" });

      expect(result.isSuccess).toBe(true);
      expect(email.accountDeletions).toHaveLength(1);
      expect(email.accountDeletions[0].to).toBe("maria@exemplo.com");
      expect(email.accountDeletions[0].confirmUrl).toMatch(/\/delete-account\?token=[0-9a-f]{64}$/);
      expect(accounts.applied).toHaveLength(0);
      expect(auditRepo.events.map((e) => e.event)).toEqual([AuditEvents.AccountDeletionRequested]);
    });

    it("stores only the hash of the token, never the token", async () => {
      await request.execute({ userId: "user-maria" });
      const raw = tokenFrom(email.accountDeletions[0].confirmUrl);

      expect(tokens.tokens).toHaveLength(1);
      expect(tokens.tokens[0].tokenHash).toBe(hashToken(raw));
      expect(tokens.tokens[0].tokenHash).not.toBe(raw);
      expect(tokens.tokens[0].type).toBe("account_deletion");
    });

    it("gives the link a short validity", async () => {
      await request.execute({ userId: "user-maria" });
      const ttl = tokens.tokens[0].expiresAt.getTime() - Date.now();
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(60 * 60 * 1000);
      expect(email.accountDeletions[0].ttlMinutes).toBe(60);
    });

    it("invalidates the previous link when a new one is requested", async () => {
      await request.execute({ userId: "user-maria" });
      await request.execute({ userId: "user-maria" });
      const [first, second] = email.accountDeletions.map((e) => tokenFrom(e.confirmUrl));

      expect((await confirm.execute({ token: first })).isFailure).toBe(true);
      expect((await confirm.execute({ token: second })).isSuccess).toBe(true);
    });

    it("fails for an account that does not exist, sending nothing", async () => {
      const result = await request.execute({ userId: "ghost" });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(401);
      expect(email.accountDeletions).toHaveLength(0);
    });
  });

  describe("confirmação", () => {
    const requestLink = async () => {
      await request.execute({ userId: "user-maria" });
      return tokenFrom(email.accountDeletions[0].confirmUrl);
    };

    it("deletes the account when the link is valid, auditing the confirmation", async () => {
      const token = await requestLink();

      const result = await confirm.execute({ token });

      expect(result.isSuccess).toBe(true);
      expect(accounts.applied).toHaveLength(1);
      expect(auditRepo.events.map((e) => e.event)).toEqual([
        AuditEvents.AccountDeletionRequested,
        AuditEvents.AccountDeletionConfirmed,
        AuditEvents.AccountDeleted,
      ]);
    });

    it("is single use: the same link cannot delete twice", async () => {
      const token = await requestLink();
      await confirm.execute({ token });
      users.addUser(maria()); // even if the account came back, the used link is dead

      const again = await confirm.execute({ token });

      expect(again.isFailure).toBe(true);
      expect(again.errorValue().statusCode).toBe(400);
      expect(accounts.applied).toHaveLength(1);
    });

    it("refuses an unknown or malformed token without touching anything", async () => {
      await requestLink();

      for (const token of ["nope", "0".repeat(64), "' OR 1=1 --"]) {
        const result = await confirm.execute({ token });
        expect(result.isFailure).toBe(true);
        expect(result.errorValue().statusCode).toBe(400);
      }
      expect(accounts.applied).toHaveLength(0);
    });

    it("refuses an expired link", async () => {
      const token = await requestLink();
      tokens.tokens[0].expiresAt = new Date(Date.now() - 1000);

      const result = await confirm.execute({ token });

      expect(result.isFailure).toBe(true);
      expect(accounts.applied).toHaveLength(0);
    });

    it("refuses a token of another kind (a password-reset link cannot delete an account)", async () => {
      const raw = "a".repeat(64);
      await tokens.create({
        userId: "user-maria",
        tokenHash: hashToken(raw),
        type: "password_reset",
        expiresAt: new Date(Date.now() + 60_000),
      });

      const result = await confirm.execute({ token: raw });

      expect(result.isFailure).toBe(true);
      expect(accounts.applied).toHaveLength(0);
    });

    it("burns the link before deleting: when the deletion fails, the same link is dead", async () => {
      const token = await requestLink();
      accounts.failApply = true;

      const first = await confirm.execute({ token });
      accounts.failApply = false;
      const retry = await confirm.execute({ token });

      expect(first.isFailure).toBe(true);
      expect(first.errorValue().statusCode).toBe(500);
      expect(retry.isFailure).toBe(true);
      expect(retry.errorValue().statusCode).toBe(400);
      expect(accounts.applied).toHaveLength(0);
    });

    it("refuses when the account behind the link is already gone", async () => {
      const token = await requestLink();
      users.clear();

      const result = await confirm.execute({ token });

      expect(result.isFailure).toBe(true);
      expect(accounts.applied).toHaveLength(0);
    });
  });
});

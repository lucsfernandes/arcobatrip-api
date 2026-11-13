import { DeleteAccountUseCase } from "../../../../application/usecases/users/deleteAccount/DeleteAccountUseCase";
import { SnapshotTrip } from "../../../../application/usecases/users/deleteAccount/accountDeletionPlan";
import { AuditLog } from "../../../../application/services/AuditLog";
import { AuditEvents } from "../../../../application/services/auditEvents";
import { MockUserRepo } from "../../../mocks/mockUserRepo";
import { MockAccountDeletionRepo } from "../../../mocks/mockAccountDeletionRepo";
import { MockStorageService } from "../../../mocks/mockStorageService";
import { MockAuditLogRepo } from "../../../mocks/mockAuditLogRepo";
import { User } from "../../../../domain/entities/User/user.entity";

const EMAIL = "maria@exemplo.com";

const maria = (over: Partial<User> = {}): User =>
  ({
    id: "user-maria",
    fullName: "Maria Souza",
    email: EMAIL,
    password: "x",
    isActive: true,
    avatarPublicId: "zarpa/avatars/maria",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }) as User;

/** One trip only she kept alive (with a cover) and one shared trip. */
const trips = (): SnapshotTrip[] => [
  {
    id: "t-alone",
    destination: "Floripa",
    coverPublicId: "zarpa/trips/capa",
    participants: [
      { id: "p1", name: "Maria Souza", email: EMAIL, isOwner: true, isConfirmed: true, deleted: false, createdAt: new Date(1) },
    ],
    activities: [],
    comments: [],
    expenses: [],
    payments: [],
  },
  {
    id: "t-shared",
    destination: "Serra",
    coverPublicId: "zarpa/trips/serra",
    participants: [
      { id: "p2", name: "Ana", email: "ana@exemplo.com", isOwner: true, isConfirmed: true, deleted: false, createdAt: new Date(2) },
      { id: "p3", name: "Maria Souza", email: EMAIL, isOwner: false, isConfirmed: true, deleted: false, createdAt: new Date(3) },
    ],
    activities: [],
    comments: [],
    expenses: [],
    payments: [],
  },
];

describe("DeleteAccountUseCase", () => {
  let users: MockUserRepo;
  let accounts: MockAccountDeletionRepo;
  let storage: MockStorageService;
  let auditRepo: MockAuditLogRepo;
  let useCase: DeleteAccountUseCase;

  beforeEach(() => {
    users = new MockUserRepo();
    accounts = new MockAccountDeletionRepo();
    storage = new MockStorageService();
    auditRepo = new MockAuditLogRepo();
    useCase = new DeleteAccountUseCase(users, accounts, storage, new AuditLog(auditRepo));
    users.addUser(maria());
    accounts.snapshot = trips();
  });

  afterEach(() => {
    users.clear();
    accounts.clear();
    storage.clear();
    auditRepo.clear();
  });

  describe("simulação", () => {
    it("reports what would happen without changing anything", async () => {
      const result = await useCase.execute({ email: EMAIL, dryRun: true });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().status).toBe("dry_run");
      expect(result.getValue().counts).toMatchObject({ tripsDeleted: 1, tripsUnlinked: 1, imagesToRemove: 2 });
      expect(accounts.applied).toHaveLength(0);
      expect(storage.deleted).toHaveLength(0);
      expect(auditRepo.events).toHaveLength(0);
    });
  });

  describe("exclusão", () => {
    it("applies the plan once, removes the images after it and audits the result", async () => {
      const result = await useCase.execute({ email: EMAIL });

      expect(result.getValue().status).toBe("deleted");
      expect(accounts.applied).toHaveLength(1);
      expect(accounts.applied[0].deleteTrips.map((t) => t.tripId)).toEqual(["t-alone"]);
      expect(storage.deleted.sort()).toEqual(["zarpa/avatars/maria", "zarpa/trips/capa"]);

      expect(auditRepo.events).toHaveLength(1);
      expect(auditRepo.events[0]).toMatchObject({
        event: AuditEvents.AccountDeleted,
        outcome: "ok",
        actorType: "user",
        details: { tripsDeleted: 1, tripsUnlinked: 1, imagesRemoved: 2, pendingImages: [] },
      });
    });

    it("keeps no e-mail in text in the audit trail and records an operator as the actor", async () => {
      await useCase.execute({ email: EMAIL, actor: "system" });

      expect(auditRepo.events[0].actorType).toBe("system");
      expect(JSON.stringify(auditRepo.events[0])).not.toContain("maria");
      expect(JSON.stringify(auditRepo.events[0])).not.toContain("exemplo.com");
    });

    it("answers not_found when there is no such account, touching nothing", async () => {
      users.clear();

      const result = await useCase.execute({ email: EMAIL });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().status).toBe("not_found");
      expect(accounts.transactions).toBe(0);
      expect(storage.deleted).toHaveLength(0);
      expect(auditRepo.events).toHaveLength(0);
    });

    it("is safe to run twice: the second run finds nothing", async () => {
      await useCase.execute({ email: EMAIL });
      users.clear(); // the first run removed the account
      accounts.snapshot = [];

      const second = await useCase.execute({ email: EMAIL });

      expect(second.getValue().status).toBe("not_found");
      expect(accounts.applied).toHaveLength(1);
      expect(auditRepo.events).toHaveLength(1);
    });
  });

  describe("falhas", () => {
    it("rolls back, removes no image and audits a failure when the transaction fails", async () => {
      accounts.failApply = true;

      const result = await useCase.execute({ email: EMAIL });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(500);
      expect(accounts.applied).toHaveLength(0);
      expect(storage.deleted).toHaveLength(0);
      expect(auditRepo.events).toHaveLength(1);
      expect(auditRepo.events[0]).toMatchObject({
        event: AuditEvents.AccountDeletionFailed,
        outcome: "failed",
        details: { reason: "transaction_failed" },
      });
    });

    it("does not audit a failure on a simulation", async () => {
      accounts.failApply = true;
      await useCase.execute({ email: EMAIL, dryRun: true });
      expect(auditRepo.events).toHaveLength(0);
    });

    it("does not claim images were removed when the provider has no credentials", async () => {
      storage.configured = false;

      const result = await useCase.execute({ email: EMAIL });

      expect(result.getValue().status).toBe("deleted");
      expect(result.getValue().pendingImages.sort()).toEqual(["zarpa/avatars/maria", "zarpa/trips/capa"]);
      expect(storage.deleted).toHaveLength(0);
      expect(auditRepo.events[0].details).toMatchObject({ imagesRemoved: 0 });
    });

    it("keeps the deletion when the storage provider fails, recording the pending images", async () => {
      storage.failDeleteFor.add("zarpa/trips/capa");

      const result = await useCase.execute({ email: EMAIL });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().status).toBe("deleted");
      expect(result.getValue().pendingImages).toEqual(["zarpa/trips/capa"]);
      expect(storage.deleted).toEqual(["zarpa/avatars/maria"]);
      expect(auditRepo.events[0].details).toMatchObject({ imagesRemoved: 1, pendingImages: ["zarpa/trips/capa"] });
    });
  });

  describe("nova tentativa das imagens", () => {
    beforeEach(async () => {
      storage.failDeleteFor.add("zarpa/trips/capa");
      await useCase.execute({ email: EMAIL });
      users.clear();
    });

    it("removes the images that were pending and records it", async () => {
      storage.failDeleteFor.clear();

      const result = await useCase.retryPendingImages(EMAIL);

      expect(result.getValue()).toEqual({ retried: 1, remaining: [] });
      expect(storage.deleted).toContain("zarpa/trips/capa");
      const last = auditRepo.events[auditRepo.events.length - 1];
      expect(last).toMatchObject({ event: AuditEvents.AccountImagesRetried, outcome: "ok" });
    });

    it("reports what is still left when the provider keeps failing", async () => {
      const result = await useCase.retryPendingImages(EMAIL);

      expect(result.getValue()).toEqual({ retried: 0, remaining: ["zarpa/trips/capa"] });
      expect(auditRepo.events[auditRepo.events.length - 1].outcome).toBe("failed");
    });

    it("does nothing for an account that had no pending images", async () => {
      const result = await useCase.retryPendingImages("ninguem@exemplo.com");
      expect(result.getValue()).toEqual({ retried: 0, remaining: [] });
    });
  });
});

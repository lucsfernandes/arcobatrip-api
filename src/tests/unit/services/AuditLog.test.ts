import { AuditLog } from "../../../application/services/AuditLog";
import { AuditEvents } from "../../../application/services/auditEvents";
import {
  allAuditEventsHaveRetention,
  auditCutoff,
  auditRetentionMonths,
} from "../../../application/services/auditRetention";
import { hashAuditSubject } from "../../../application/utils/auditHash";
import { MockAuditLogRepo } from "../../mocks/mockAuditLogRepo";

describe("AuditLog", () => {
  let repo: MockAuditLogRepo;
  let audit: AuditLog;

  beforeEach(() => {
    repo = new MockAuditLogRepo();
    audit = new AuditLog(repo);
  });

  describe("subject reference", () => {
    it("stores only a keyed hash of the e-mail, never the e-mail", async () => {
      await audit.record(AuditEvents.AccountDeleted, "Maria@Exemplo.com", { trips: 2 });

      expect(repo.events).toHaveLength(1);
      const stored = JSON.stringify(repo.events[0]);
      expect(stored).not.toMatch(/maria/i);
      expect(stored).not.toContain("exemplo.com");
      expect(repo.events[0].subjectRef).toBe(hashAuditSubject("maria@exemplo.com"));
      expect(repo.events[0].subjectRef).toMatch(/^[0-9a-f]{64}$/);
    });

    it("gives the same reference for the same person however the e-mail is typed", () => {
      expect(hashAuditSubject("  Maria@Exemplo.com ")).toBe(hashAuditSubject("maria@exemplo.com"));
      expect(hashAuditSubject("maria@exemplo.com")).not.toBe(hashAuditSubject("outra@exemplo.com"));
    });

    it("keeps no reference when there is no subject", async () => {
      await audit.record(AuditEvents.AccountDeletionFailed, null, {}, "failed", "system");
      expect(repo.events[0].subjectRef).toBeNull();
      expect(repo.events[0].actorType).toBe("system");
      expect(repo.events[0].outcome).toBe("failed");
    });
  });

  describe("details", () => {
    it("redacts anything that looks like an e-mail, at any depth", async () => {
      await audit.record(AuditEvents.AccountDeleted, "a@b.com", {
        trips: 3,
        note: "pedido de joao@x.com",
        nested: { list: ["ok", "ana@y.org"] },
      });

      const stored = JSON.stringify(repo.events[0].details);
      expect(stored).not.toContain("@");
      expect(repo.events[0].details).toMatchObject({ trips: 3 });
    });
  });

  it("never breaks the audited action when the database fails", async () => {
    repo.failOnCreate = true;
    await expect(audit.record(AuditEvents.AuthLogin, "a@b.com")).resolves.toBeUndefined();
  });
});

describe("audit retention", () => {
  it("keeps account events for 5 years and login events for 6 months", () => {
    expect(auditRetentionMonths(AuditEvents.AccountDeleted)).toBe(60);
    expect(auditRetentionMonths(AuditEvents.AccountDeletionRequested)).toBe(60);
    expect(auditRetentionMonths(AuditEvents.AuthLogin)).toBe(6);
    expect(auditRetentionMonths(AuditEvents.AuthLoginFailed)).toBe(6);
    expect(auditRetentionMonths(AuditEvents.AuthPasswordChanged)).toBe(6);
    expect(auditRetentionMonths("something.else")).toBeNull();
  });

  it("covers every defined event with a retention rule", () => {
    expect(allAuditEventsHaveRetention()).toBe(true);
  });

  it("computes the cutoff in calendar months", () => {
    expect(auditCutoff(new Date("2026-11-13T00:00:00Z"), 6).toISOString()).toBe("2026-05-13T00:00:00.000Z");
    expect(auditCutoff(new Date("2026-11-13T00:00:00Z"), 60).toISOString()).toBe("2021-11-13T00:00:00.000Z");
  });

  describe("purge", () => {
    const now = new Date("2026-11-13T12:00:00Z");
    let repo: MockAuditLogRepo;
    let audit: AuditLog;

    beforeEach(() => {
      repo = new MockAuditLogRepo();
      audit = new AuditLog(repo);
    });

    it("drops login events older than 6 months and keeps the newer ones", async () => {
      repo.seed(AuditEvents.AuthLogin, new Date("2026-05-01T00:00:00Z")); // 6+ months
      repo.seed(AuditEvents.AuthLoginFailed, new Date("2026-05-14T00:00:00Z")); // just under 6 months
      repo.seed(AuditEvents.AuthLogin, new Date("2026-11-01T00:00:00Z")); // recent

      const removed = await audit.purgeExpired(now);

      expect(removed).toBe(1);
      expect(repo.events).toHaveLength(2);
    });

    it("keeps account-deletion proof for 5 years, even past the login retention", async () => {
      repo.seed(AuditEvents.AccountDeleted, new Date("2024-01-01T00:00:00Z")); // ~2.9 years
      repo.seed(AuditEvents.AccountDeleted, new Date("2021-11-12T00:00:00Z")); // just over 5 years

      const removed = await audit.purgeExpired(now);

      expect(removed).toBe(1);
      expect(repo.events.map((e) => e.event)).toEqual([AuditEvents.AccountDeleted]);
      expect(repo.events[0].occurredAt.getUTCFullYear()).toBe(2024);
    });

    it("removes nothing when nothing expired", async () => {
      repo.seed(AuditEvents.AuthLogin, new Date("2026-11-10T00:00:00Z"));
      expect(await audit.purgeExpired(now)).toBe(0);
    });
  });
});

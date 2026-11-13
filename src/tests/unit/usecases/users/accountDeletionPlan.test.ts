import {
  REMOVED_MARK,
  SnapshotParticipant,
  SnapshotTrip,
  anonymizedEmail,
  anonymizedName,
  buildDeletionPlan,
} from "../../../../application/usecases/users/deleteAccount/accountDeletionPlan";

const USER = { id: "user-maria", email: "maria@exemplo.com", avatarPublicId: "zarpa/avatars/maria" };

let seq = 0;
const day = (n: number) => new Date(Date.UTC(2026, 0, n));
const person = (over: Partial<SnapshotParticipant> & { id: string }): SnapshotParticipant => ({
  name: `Pessoa ${over.id}`,
  email: `${over.id}@exemplo.com`,
  isOwner: false,
  isConfirmed: true,
  deleted: false,
  createdAt: day(++seq),
  ...over,
});
const maria = (over: Partial<SnapshotParticipant> = {}) =>
  person({ id: "p-maria", name: "Maria Souza", email: "maria@exemplo.com", ...over });
const trip = (over: Partial<SnapshotTrip> & { participants: SnapshotParticipant[] }): SnapshotTrip => ({
  id: "t1",
  destination: "Florianópolis",
  coverPublicId: null,
  activities: [],
  comments: [],
  expenses: [],
  payments: [],
  ...over,
});
const plan = (...trips: SnapshotTrip[]) => buildDeletionPlan({ user: USER, trips });

describe("buildDeletionPlan — trips only this person kept alive", () => {
  it("deletes a trip where the organiser is the only participant, with its images and comments", () => {
    const result = plan(
      trip({
        coverPublicId: "zarpa/trips/capa",
        participants: [maria({ isOwner: true })],
        activities: [
          { id: "a1", bannerPublicId: "zarpa/acts/a1", createdBy: USER.id },
          { id: "a2", bannerPublicId: null, createdBy: null },
        ],
        comments: [{ id: "c1", authorId: "someone-else" }, { id: "c2", authorId: USER.id }],
      })
    );

    expect(result.deleteTrips).toEqual([{ tripId: "t1", commentIds: ["c1", "c2"] }]);
    expect(result.unlinkTrips).toEqual([]);
    expect(result.imagePublicIds.sort()).toEqual(
      ["zarpa/acts/a1", "zarpa/avatars/maria", "zarpa/trips/capa"].sort()
    );
    expect(result.counts).toMatchObject({ tripsDeleted: 1, tripsUnlinked: 0, commentsDeleted: 2 });
  });

  it("deletes the trip when the others never confirmed (D1: pending guests do not count)", () => {
    const result = plan(
      trip({
        participants: [
          maria({ isOwner: true }),
          person({ id: "p-bia", isConfirmed: false }),
          person({ id: "p-caio", isConfirmed: false }),
        ],
      })
    );
    expect(result.deleteTrips.map((t) => t.tripId)).toEqual(["t1"]);
    expect(result.unlinkTrips).toEqual([]);
  });

  it("does not count a guest the owner already removed as a confirmed participant", () => {
    const result = plan(
      trip({
        participants: [maria({ isOwner: true }), person({ id: "p-bia", deleted: true })],
      })
    );
    expect(result.deleteTrips).toHaveLength(1);
  });

  it("deletes an already soft-deleted trip that only she kept alive", () => {
    const result = plan(trip({ id: "t-old", participants: [maria({ isOwner: true })] }));
    expect(result.deleteTrips[0].tripId).toBe("t-old");
  });
});

describe("buildDeletionPlan — shared trips stay for the others", () => {
  it("keeps the trip and only removes a confirmed guest with no expenses", () => {
    const result = plan(
      trip({ participants: [person({ id: "p-ana", isOwner: true }), maria()] })
    );

    expect(result.deleteTrips).toEqual([]);
    expect(result.unlinkTrips).toHaveLength(1);
    expect(result.unlinkTrips[0]).toMatchObject({
      tripId: "t1",
      removeParticipantIds: ["p-maria"],
      anonymize: [],
      transferOwnershipTo: null,
    });
    // Only her own avatar goes; the trip's images stay.
    expect(result.imagePublicIds).toEqual(["zarpa/avatars/maria"]);
  });

  it.each([
    ["paid an expense", { expenses: [{ paidById: "p-maria", splitBetween: ["p-ana"] }] }],
    ["shares an expense", { expenses: [{ paidById: "p-ana", splitBetween: ["p-ana", "p-maria"] }] }],
    ["paid a recorded payment", { payments: [{ fromId: "p-maria", toId: "p-ana" }] }],
    ["received a recorded payment", { payments: [{ fromId: "p-ana", toId: "p-maria" }] }],
  ])("anonymizes instead of deleting when she %s (D3)", (_label, accounts) => {
    const result = plan(
      trip({ participants: [person({ id: "p-ana", isOwner: true }), maria()], ...accounts })
    );

    expect(result.unlinkTrips[0].removeParticipantIds).toEqual([]);
    expect(result.unlinkTrips[0].anonymize).toEqual([
      { participantId: "p-maria", name: `Maria Souza ${REMOVED_MARK}` },
    ]);
    expect(result.counts).toMatchObject({ participantsAnonymized: 1, participantsRemoved: 0 });
  });

  it("keeps the name with the mark and never adds the mark twice", () => {
    expect(anonymizedName("Maria Souza")).toBe("Maria Souza (Participante removido)");
    expect(anonymizedName("Maria Souza (Participante removido)")).toBe("Maria Souza (Participante removido)");
  });

  it("replaces the e-mail with a unique address that holds no personal data", () => {
    expect(anonymizedEmail("p-maria")).toBe("removed-p-maria@removed.invalid");
    expect(anonymizedEmail("p-maria")).not.toBe(anonymizedEmail("p-bia"));
  });

  it("removes the invitation she received in someone else's trip", () => {
    const result = plan(
      trip({
        participants: [person({ id: "p-ana", isOwner: true }), maria({ isConfirmed: false })],
      })
    );
    expect(result.deleteTrips).toEqual([]);
    expect(result.unlinkTrips[0].removeParticipantIds).toEqual(["p-maria"]);
  });

  it("also removes her row when the owner had already removed her from the trip", () => {
    const result = plan(
      trip({ participants: [person({ id: "p-ana", isOwner: true }), maria({ deleted: true })] })
    );
    expect(result.unlinkTrips[0].removeParticipantIds).toEqual(["p-maria"]);
  });

  it("detaches only the activities she created, and deletes only her comments (D4)", () => {
    const result = plan(
      trip({
        participants: [person({ id: "p-ana", isOwner: true }), maria()],
        activities: [
          { id: "a-mine", bannerPublicId: "zarpa/acts/mine", createdBy: USER.id },
          { id: "a-hers", bannerPublicId: "zarpa/acts/hers", createdBy: "user-ana" },
          { id: "a-old", bannerPublicId: null, createdBy: null },
        ],
        comments: [
          { id: "c-mine", authorId: USER.id },
          { id: "c-hers", authorId: "user-ana" },
        ],
      })
    );

    expect(result.unlinkTrips[0].detachActivityIds).toEqual(["a-mine"]);
    expect(result.unlinkTrips[0].deleteCommentIds).toEqual(["c-mine"]);
    // The banners belong to activities that stay.
    expect(result.imagePublicIds).toEqual(["zarpa/avatars/maria"]);
    expect(result.counts).toMatchObject({ activitiesDetached: 1, commentsDeleted: 1 });
  });

  it("records the names to clean from the others' 'confirmou presença' notices", () => {
    const result = plan(trip({ participants: [person({ id: "p-ana", isOwner: true }), maria()] }));
    expect(result.unlinkTrips[0].confirmationNoticeNames).toEqual(["Maria Souza"]);
  });
});

describe("buildDeletionPlan — ownership (D2)", () => {
  it("passes the organisation to the oldest confirmed participant", () => {
    const result = plan(
      trip({
        participants: [
          maria({ isOwner: true, createdAt: day(1) }),
          person({ id: "p-pending", isConfirmed: false, createdAt: day(2) }),
          person({ id: "p-removed", deleted: true, createdAt: day(3) }),
          person({ id: "p-old", email: "old@exemplo.com", createdAt: day(4) }),
          person({ id: "p-new", createdAt: day(9) }),
        ],
      })
    );

    expect(result.unlinkTrips[0].transferOwnershipTo).toEqual({
      participantId: "p-old",
      email: "old@exemplo.com",
    });
    expect(result.counts.ownershipsTransferred).toBe(1);
  });

  it("breaks a tie on the creation date by id, so the choice is stable", () => {
    const same = day(5);
    const result = plan(
      trip({
        participants: [
          maria({ isOwner: true, createdAt: day(1) }),
          person({ id: "p-b", createdAt: same }),
          person({ id: "p-a", createdAt: same }),
        ],
      })
    );
    expect(result.unlinkTrips[0].transferOwnershipTo?.participantId).toBe("p-a");
  });

  it("does not transfer when someone else already organises the trip", () => {
    const result = plan(
      trip({ participants: [person({ id: "p-ana", isOwner: true }), maria()] })
    );
    expect(result.unlinkTrips[0].transferOwnershipTo).toBeNull();
    expect(result.counts.ownershipsTransferred).toBe(0);
  });
});

describe("buildDeletionPlan — matching and totals", () => {
  it("matches her e-mail ignoring case and spaces", () => {
    const result = plan(
      trip({
        participants: [person({ id: "p-ana", isOwner: true }), maria({ email: "  Maria@Exemplo.COM " })],
      })
    );
    expect(result.unlinkTrips).toHaveLength(1);
  });

  it("ignores trips where she has no participant row", () => {
    const result = plan(trip({ participants: [person({ id: "p-ana", isOwner: true })] }));
    expect(result.deleteTrips).toEqual([]);
    expect(result.unlinkTrips).toEqual([]);
  });

  it("only her avatar to remove when she is in no trip", () => {
    const result = plan();
    expect(result.imagePublicIds).toEqual(["zarpa/avatars/maria"]);
    expect(result.counts.tripsDeleted).toBe(0);
  });

  it("totals a mix of trips", () => {
    const result = plan(
      trip({ id: "alone", participants: [maria({ isOwner: true })], comments: [{ id: "c9", authorId: USER.id }] }),
      trip({ id: "shared", participants: [person({ id: "p-ana", isOwner: true }), maria()] }),
      trip({
        id: "owned",
        participants: [maria({ isOwner: true }), person({ id: "p-bia" })],
        expenses: [{ paidById: "p-maria", splitBetween: ["p-bia"] }],
      })
    );

    expect(result.counts).toEqual({
      tripsDeleted: 1,
      tripsUnlinked: 2,
      ownershipsTransferred: 1,
      participantsRemoved: 1,
      participantsAnonymized: 1,
      commentsDeleted: 1,
      activitiesDetached: 0,
      imagesToRemove: 1,
    });
  });
});

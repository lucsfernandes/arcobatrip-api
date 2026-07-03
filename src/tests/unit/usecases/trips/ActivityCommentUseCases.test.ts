import { AddCommentUseCase } from "../../../../application/usecases/trips/addComment/AddCommentUseCase";
import { ListCommentsUseCase } from "../../../../application/usecases/trips/listComments/ListCommentsUseCase";
import { DeleteCommentUseCase } from "../../../../application/usecases/trips/deleteComment/DeleteCommentUseCase";
import {
  MockTripContractRepo,
  buildTrip,
  buildActivity,
} from "../../../mocks/mockTripContractRepo";
import { Participant } from "../../../../domain/entities/Participant/participant.entity";

const OWNER_EMAIL = "owner@test.com";
const GUEST_EMAIL = "guest@test.com";
const GUEST_ID = "user-guest";

/** A trip with an owner plus a confirmed guest participant. */
const tripWithGuest = () =>
  buildTrip({
    participants: [
      {
        id: "participant-owner",
        name: "Dono",
        email: OWNER_EMAIL,
        isOwner: true,
        isConfirmed: true,
        tripId: "trip-1",
      } as Participant,
      {
        id: "participant-guest",
        name: "Maria Guest",
        email: GUEST_EMAIL,
        isOwner: false,
        isConfirmed: true,
        tripId: "trip-1",
      } as Participant,
    ],
  });

describe("Activity comments", () => {
  let repo: MockTripContractRepo;

  beforeEach(() => {
    repo = new MockTripContractRepo();
    repo.seedTrip(tripWithGuest());
    repo.seedActivity(buildActivity({ createdBy: "user-creator" }));
  });

  afterEach(() => repo.clear());

  describe("AddCommentUseCase", () => {
    it("lets any participant comment and snapshots their display name", async () => {
      const useCase = new AddCommentUseCase(repo);

      const result = await useCase.execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: GUEST_ID,
        userEmail: GUEST_EMAIL,
        body: "Bora!",
      });

      expect(result.isSuccess).toBe(true);
      const comment = result.getValue();
      expect(comment.authorId).toBe(GUEST_ID);
      expect(comment.authorName).toBe("Maria Guest");
      expect(comment.activityId).toBe("activity-1");
      expect(comment.body).toBe("Bora!");
    });

    it("denies (403) a non-participant", async () => {
      const useCase = new AddCommentUseCase(repo);

      const result = await useCase.execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: "intruder",
        userEmail: "intruder@test.com",
        body: "hey",
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(403);
    });

    it("returns 404 when the activity belongs to another trip", async () => {
      repo.clear();
      repo.seedTrip(tripWithGuest());
      repo.seedActivity(buildActivity({ id: "activity-1", tripId: "other-trip" }));
      const useCase = new AddCommentUseCase(repo);

      const result = await useCase.execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: GUEST_ID,
        userEmail: GUEST_EMAIL,
        body: "x",
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(404);
    });
  });

  describe("ListCommentsUseCase", () => {
    it("returns non-deleted comments for a participant", async () => {
      await new AddCommentUseCase(repo).execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: GUEST_ID,
        userEmail: GUEST_EMAIL,
        body: "primeiro",
      });

      const result = await new ListCommentsUseCase(repo).execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userEmail: OWNER_EMAIL,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toHaveLength(1);
      expect(result.getValue()[0].body).toBe("primeiro");
    });

    it("denies (403) a non-participant", async () => {
      const result = await new ListCommentsUseCase(repo).execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userEmail: "intruder@test.com",
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(403);
    });
  });

  describe("DeleteCommentUseCase", () => {
    const seedComment = async (authorId: string, authorEmail: string) => {
      const created = await new AddCommentUseCase(repo).execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: authorId,
        userEmail: authorEmail,
        body: "to delete",
      });
      return created.getValue().id;
    };

    it("lets the author delete their own comment", async () => {
      const commentId = await seedComment(GUEST_ID, GUEST_EMAIL);

      const result = await new DeleteCommentUseCase(repo).execute({
        tripId: "trip-1",
        activityId: "activity-1",
        commentId,
        userId: GUEST_ID,
        userEmail: GUEST_EMAIL,
      });

      expect(result.isSuccess).toBe(true);
      expect(repo.softDeletedComments).toContain(commentId);
    });

    it("lets the trip owner delete any comment", async () => {
      const commentId = await seedComment(GUEST_ID, GUEST_EMAIL);

      const result = await new DeleteCommentUseCase(repo).execute({
        tripId: "trip-1",
        activityId: "activity-1",
        commentId,
        userId: "not-the-author",
        userEmail: OWNER_EMAIL,
      });

      expect(result.isSuccess).toBe(true);
      expect(repo.softDeletedComments).toContain(commentId);
    });

    it("denies (403) a non-author non-owner participant", async () => {
      const commentId = await seedComment(GUEST_ID, GUEST_EMAIL);

      const result = await new DeleteCommentUseCase(repo).execute({
        tripId: "trip-1",
        activityId: "activity-1",
        commentId,
        userId: "someone-else",
        userEmail: "someone@test.com",
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(403);
      expect(repo.softDeletedComments).toHaveLength(0);
    });

    it("returns 404 for a comment on another activity", async () => {
      const commentId = await seedComment(GUEST_ID, GUEST_EMAIL);
      repo.seedActivity(buildActivity({ id: "activity-2", tripId: "trip-1" }));

      const result = await new DeleteCommentUseCase(repo).execute({
        tripId: "trip-1",
        activityId: "activity-2",
        commentId,
        userId: GUEST_ID,
        userEmail: GUEST_EMAIL,
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(404);
    });
  });
});

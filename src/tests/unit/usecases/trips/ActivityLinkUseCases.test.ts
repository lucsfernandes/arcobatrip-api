import { AddActivityLinkUseCase } from "../../../../application/usecases/trips/addActivityLink/AddActivityLinkUseCase";
import { ListActivityLinksUseCase } from "../../../../application/usecases/trips/listActivityLinks/ListActivityLinksUseCase";
import { DeleteActivityLinkUseCase } from "../../../../application/usecases/trips/deleteActivityLink/DeleteActivityLinkUseCase";
import {
  MockTripContractRepo,
  buildTrip,
  buildActivity,
} from "../../../mocks/mockTripContractRepo";
import { Participant } from "../../../../domain/entities/Participant/participant.entity";

const OWNER_EMAIL = "owner@test.com";
const GUEST_EMAIL = "guest@test.com";
const CREATOR_ID = "user-creator";

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
        name: "Guest",
        email: GUEST_EMAIL,
        isOwner: false,
        isConfirmed: true,
        tripId: "trip-1",
      } as Participant,
    ],
  });

describe("Activity links", () => {
  let repo: MockTripContractRepo;

  beforeEach(() => {
    repo = new MockTripContractRepo();
    repo.seedTrip(tripWithGuest());
    repo.seedActivity(buildActivity({ createdBy: CREATOR_ID }));
  });

  afterEach(() => repo.clear());

  describe("AddActivityLinkUseCase", () => {
    it("lets the activity creator add a link tagged to the activity", async () => {
      const result = await new AddActivityLinkUseCase(repo).execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: CREATOR_ID,
        userEmail: "not-owner@test.com",
        label: "Ingressos",
        url: "https://example.com",
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().activityId).toBe("activity-1");
      expect(result.getValue().label).toBe("Ingressos");
    });

    it("lets the trip owner add a link", async () => {
      const result = await new AddActivityLinkUseCase(repo).execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: "not-creator",
        userEmail: OWNER_EMAIL,
        label: "Mapa",
        url: "https://maps.example.com",
      });

      expect(result.isSuccess).toBe(true);
    });

    it("denies (403) a plain participant who is neither creator nor owner", async () => {
      const result = await new AddActivityLinkUseCase(repo).execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: "user-guest",
        userEmail: GUEST_EMAIL,
        label: "x",
        url: "https://example.com",
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(403);
    });
  });

  describe("ListActivityLinksUseCase", () => {
    it("returns links for any participant", async () => {
      await new AddActivityLinkUseCase(repo).execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: CREATOR_ID,
        userEmail: OWNER_EMAIL,
        label: "Site",
        url: "https://example.com",
      });

      const result = await new ListActivityLinksUseCase(repo).execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userEmail: GUEST_EMAIL,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toHaveLength(1);
      expect(result.getValue()[0].activityId).toBe("activity-1");
    });

    it("denies (403) a non-participant", async () => {
      const result = await new ListActivityLinksUseCase(repo).execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userEmail: "intruder@test.com",
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(403);
    });
  });

  describe("DeleteActivityLinkUseCase", () => {
    const seedLink = async () => {
      const created = await new AddActivityLinkUseCase(repo).execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: CREATOR_ID,
        userEmail: OWNER_EMAIL,
        label: "Del",
        url: "https://example.com",
      });
      return created.getValue().id;
    };

    it("lets the creator delete (soft delete)", async () => {
      const linkId = await seedLink();

      const result = await new DeleteActivityLinkUseCase(repo).execute({
        tripId: "trip-1",
        activityId: "activity-1",
        linkId,
        userId: CREATOR_ID,
        userEmail: "not-owner@test.com",
      });

      expect(result.isSuccess).toBe(true);
      expect(repo.softDeletedLinks).toContain(linkId);
    });

    it("denies (403) a plain participant", async () => {
      const linkId = await seedLink();

      const result = await new DeleteActivityLinkUseCase(repo).execute({
        tripId: "trip-1",
        activityId: "activity-1",
        linkId,
        userId: "user-guest",
        userEmail: GUEST_EMAIL,
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(403);
    });

    it("returns 404 for a link that is not on the activity", async () => {
      const result = await new DeleteActivityLinkUseCase(repo).execute({
        tripId: "trip-1",
        activityId: "activity-1",
        linkId: "ghost-link",
        userId: CREATOR_ID,
        userEmail: OWNER_EMAIL,
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(404);
    });
  });
});

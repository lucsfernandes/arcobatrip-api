import { DeleteActivityUseCase } from "../../../../application/usecases/trips/deleteActivity/DeleteActivityUseCase";
import {
  MockTripContractRepo,
  buildTrip,
  buildActivity,
} from "../../../mocks/mockTripContractRepo";

describe("DeleteActivityUseCase", () => {
  let repo: MockTripContractRepo;
  let useCase: DeleteActivityUseCase;

  const OWNER_EMAIL = "owner@test.com";
  const CREATOR_ID = "user-creator";

  beforeEach(() => {
    repo = new MockTripContractRepo();
    useCase = new DeleteActivityUseCase(repo);
  });

  afterEach(() => repo.clear());

  describe("Autorização", () => {
    it("permite ao criador excluir (soft delete)", async () => {
      repo.seedTrip(buildTrip());
      repo.seedActivity(buildActivity({ createdBy: CREATOR_ID }));

      const result = await useCase.execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: CREATOR_ID,
        userEmail: "not-owner@test.com",
      });

      expect(result.isSuccess).toBe(true);
      expect(repo.softDeleted).toContain("activity-1");
    });

    it("permite ao dono da viagem excluir", async () => {
      repo.seedTrip(buildTrip());
      repo.seedActivity(buildActivity({ createdBy: "another-user" }));

      const result = await useCase.execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: "not-creator",
        userEmail: OWNER_EMAIL,
      });

      expect(result.isSuccess).toBe(true);
      expect(repo.softDeleted).toContain("activity-1");
    });

    it("permite ao dono excluir atividade antiga (created_by null)", async () => {
      repo.seedTrip(buildTrip());
      repo.seedActivity(buildActivity({ createdBy: null }));

      const result = await useCase.execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: "irrelevant",
        userEmail: OWNER_EMAIL,
      });

      expect(result.isSuccess).toBe(true);
    });

    it("nega (403) quando não é criador nem dono", async () => {
      repo.seedTrip(buildTrip());
      repo.seedActivity(buildActivity({ createdBy: "another-user" }));

      const result = await useCase.execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: "intruder",
        userEmail: "intruder@test.com",
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(403);
      expect(repo.softDeleted).toHaveLength(0);
    });

    it("nega (403) para atividade antiga (created_by null) quando não é o dono", async () => {
      repo.seedTrip(buildTrip());
      repo.seedActivity(buildActivity({ createdBy: null }));

      const result = await useCase.execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: "creator-was-null",
        userEmail: "someone@test.com",
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(403);
    });
  });

  describe("Not found", () => {
    it("retorna 404 quando a viagem não existe", async () => {
      const result = await useCase.execute({
        tripId: "missing-trip",
        activityId: "activity-1",
        userId: CREATOR_ID,
        userEmail: OWNER_EMAIL,
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(404);
    });

    it("retorna 404 quando a atividade não existe", async () => {
      repo.seedTrip(buildTrip());

      const result = await useCase.execute({
        tripId: "trip-1",
        activityId: "missing-activity",
        userId: CREATOR_ID,
        userEmail: OWNER_EMAIL,
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(404);
    });

    it("retorna 404 quando a atividade pertence a outra viagem", async () => {
      repo.seedTrip(buildTrip());
      repo.seedActivity(buildActivity({ id: "activity-1", tripId: "other-trip" }));

      const result = await useCase.execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: CREATOR_ID,
        userEmail: OWNER_EMAIL,
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(404);
    });
  });
});

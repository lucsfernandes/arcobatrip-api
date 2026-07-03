import { UpdateActivityUseCase } from "../../../../application/usecases/trips/updateActivity/UpdateActivityUseCase";
import {
  MockTripContractRepo,
  buildTrip,
  buildActivity,
} from "../../../mocks/mockTripContractRepo";

describe("UpdateActivityUseCase", () => {
  let repo: MockTripContractRepo;
  let useCase: UpdateActivityUseCase;

  const OWNER_EMAIL = "owner@test.com";
  const CREATOR_ID = "user-creator";

  beforeEach(() => {
    repo = new MockTripContractRepo();
    useCase = new UpdateActivityUseCase(repo);
  });

  afterEach(() => repo.clear());

  describe("Autorização", () => {
    it("permite ao criador da atividade editar", async () => {
      repo.seedTrip(buildTrip());
      repo.seedActivity(buildActivity({ createdBy: CREATOR_ID }));

      const result = await useCase.execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: CREATOR_ID,
        userEmail: "someone-else@test.com",
        title: "Novo título",
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().title).toBe("Novo título");
    });

    it("permite ao dono da viagem editar mesmo sem ser o criador", async () => {
      repo.seedTrip(buildTrip());
      repo.seedActivity(buildActivity({ createdBy: "another-user" }));

      const result = await useCase.execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: "not-the-creator",
        userEmail: OWNER_EMAIL,
        status: "done",
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().status).toBe("done");
    });

    it("permite ao dono editar atividade antiga (created_by null)", async () => {
      repo.seedTrip(buildTrip());
      repo.seedActivity(buildActivity({ createdBy: null }));

      const result = await useCase.execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: "irrelevant",
        userEmail: OWNER_EMAIL,
        title: "Editado pelo dono",
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
        title: "Hack",
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(403);
    });

    it("nega (403) para atividade antiga (created_by null) quando não é o dono", async () => {
      repo.seedTrip(buildTrip());
      repo.seedActivity(buildActivity({ createdBy: null }));

      const result = await useCase.execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: "someone",
        userEmail: "someone@test.com",
        title: "Nope",
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
        title: "x",
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
        title: "x",
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
        title: "x",
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue().statusCode).toBe(404);
    });
  });

  describe("Atualização de campos", () => {
    it("atualiza title, at e status juntos", async () => {
      repo.seedTrip(buildTrip());
      repo.seedActivity(buildActivity({ createdBy: CREATOR_ID }));

      const newAt = "2026-08-05T15:00:00.000Z";
      const result = await useCase.execute({
        tripId: "trip-1",
        activityId: "activity-1",
        userId: CREATOR_ID,
        userEmail: OWNER_EMAIL,
        title: "Passeio de barco",
        at: newAt,
        status: "done",
      });

      expect(result.isSuccess).toBe(true);
      const dto = result.getValue();
      expect(dto.title).toBe("Passeio de barco");
      expect(dto.at).toBe(new Date(newAt).toISOString());
      expect(dto.status).toBe("done");
    });
  });
});

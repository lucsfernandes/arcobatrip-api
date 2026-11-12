import { DeleteTripUseCase } from "../../../../application/usecases/trips/deleteTrip/DeleteTripUseCase";
import { MockTripContractRepo, buildTrip } from "../../../mocks/mockTripContractRepo";
import { Participant } from "../../../../domain/entities/Participant/participant.entity";

describe("DeleteTripUseCase", () => {
  let repo: MockTripContractRepo;
  let useCase: DeleteTripUseCase;

  const OWNER_EMAIL = "owner@test.com";

  beforeEach(() => {
    repo = new MockTripContractRepo();
    useCase = new DeleteTripUseCase(repo);
  });

  afterEach(() => repo.clear());

  it("o dono exclui a viagem (soft delete) e ela some", async () => {
    repo.seedTrip(buildTrip());

    const result = await useCase.execute({ tripId: "trip-1", userEmail: OWNER_EMAIL });

    expect(result.isSuccess).toBe(true);
    expect(repo.softDeletedTrips).toEqual(["trip-1"]);
    expect(await repo.findTripById("trip-1")).toBeNull();
  });

  it("nega (403) a um convidado confirmado, que não é o dono", async () => {
    const guest = {
      id: "participant-guest",
      name: "Convidada",
      email: "guest@test.com",
      isOwner: false,
      isConfirmed: true,
      tripId: "trip-1",
    } as Participant;
    repo.seedTrip(buildTrip({ participants: [...buildTrip().participants, guest] }));

    const result = await useCase.execute({ tripId: "trip-1", userEmail: "guest@test.com" });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(403);
    expect(repo.softDeletedTrips).toHaveLength(0);
  });

  it("nega (403) a quem não participa da viagem", async () => {
    repo.seedTrip(buildTrip());

    const result = await useCase.execute({ tripId: "trip-1", userEmail: "intruder@test.com" });

    expect(result.errorValue().statusCode).toBe(403);
    expect(repo.softDeletedTrips).toHaveLength(0);
  });

  it("retorna 404 para viagem inexistente", async () => {
    const result = await useCase.execute({ tripId: "nope", userEmail: OWNER_EMAIL });

    expect(result.errorValue().statusCode).toBe(404);
  });

  it("retorna 404 ao excluir de novo uma viagem já excluída", async () => {
    repo.seedTrip(buildTrip());
    await useCase.execute({ tripId: "trip-1", userEmail: OWNER_EMAIL });

    const again = await useCase.execute({ tripId: "trip-1", userEmail: OWNER_EMAIL });

    expect(again.errorValue().statusCode).toBe(404);
    expect(repo.softDeletedTrips).toEqual(["trip-1"]);
  });
});

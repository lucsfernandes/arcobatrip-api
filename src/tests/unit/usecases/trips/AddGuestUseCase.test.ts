import { AddGuestUseCase } from "../../../../application/usecases/trips/addGuest/AddGuestUseCase";
import { NotificationEmitter } from "../../../../application/services/NotificationEmitter";
import { MockTripContractRepo, buildTrip } from "../../../mocks/mockTripContractRepo";

/** Minimal emitter stub — the use case only ever calls `invite`. */
const buildEmitter = (): NotificationEmitter =>
  ({ invite: jest.fn().mockResolvedValue(undefined) } as unknown as NotificationEmitter);

describe("AddGuestUseCase", () => {
  let repo: MockTripContractRepo;
  let emitter: NotificationEmitter;
  let useCase: AddGuestUseCase;

  beforeEach(() => {
    repo = new MockTripContractRepo();
    emitter = buildEmitter();
    useCase = new AddGuestUseCase(repo, emitter);
    repo.seedTrip(buildTrip());
  });

  afterEach(() => repo.clear());

  it("derives a capitalized name from the email when no name is provided", async () => {
    const result = await useCase.execute({
      tripId: "trip-1",
      email: "ana.souza@example.com",
    });

    expect(result.isSuccess).toBe(true);
    expect(repo.addedGuests).toHaveLength(1);
    expect(repo.addedGuests[0].data.name).toBe("Ana Souza");
    expect(result.getValue().name).toBe("Ana Souza");
  });

  it("uses the provided name (trimmed) when present", async () => {
    const result = await useCase.execute({
      tripId: "trip-1",
      email: "ana.souza@example.com",
      name: "  Ana Beatriz  ",
    });

    expect(result.isSuccess).toBe(true);
    expect(repo.addedGuests[0].data.name).toBe("Ana Beatriz");
  });

  it("falls back to the derived name when the provided name is blank", async () => {
    const result = await useCase.execute({
      tripId: "trip-1",
      email: "joao_pedro@example.com",
      name: "   ",
    });

    expect(result.isSuccess).toBe(true);
    expect(repo.addedGuests[0].data.name).toBe("Joao Pedro");
  });

  it("returns 404 when the trip does not exist", async () => {
    const result = await useCase.execute({
      tripId: "missing-trip",
      email: "ana@example.com",
    });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(404);
    expect(repo.addedGuests).toHaveLength(0);
  });
});

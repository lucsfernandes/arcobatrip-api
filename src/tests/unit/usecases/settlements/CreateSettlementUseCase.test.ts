import { CreateSettlementUseCase } from "../../../../application/usecases/settlements/createSettlement/CreateSettlementUseCase";
import { MockTripContractRepo, buildTrip } from "../../../mocks/mockTripContractRepo";
import { MockSettledPaymentRepo } from "../../../mocks/mockSettledPaymentRepo";
import { Participant } from "../../../../domain/entities/Participant/participant.entity";
import { Trip } from "../../../../domain/entities/Trip/trip.entity";

const OWNER_ID = "participant-owner";
const OWNER_EMAIL = "owner@test.com";
const B_ID = "participant-b";
const B_EMAIL = "b@test.com";

/** Trip with two participants (owner + B). */
const tripWithTwo = (): Trip =>
  buildTrip({
    participants: [
      {
        id: OWNER_ID,
        name: "Dono",
        email: OWNER_EMAIL,
        isOwner: true,
        isConfirmed: true,
        tripId: "trip-1",
      } as Participant,
      {
        id: B_ID,
        name: "Bea",
        email: B_EMAIL,
        isOwner: false,
        isConfirmed: true,
        tripId: "trip-1",
      } as Participant,
    ],
  });

describe("CreateSettlementUseCase", () => {
  let tripRepo: MockTripContractRepo;
  let settledPaymentRepo: MockSettledPaymentRepo;
  let useCase: CreateSettlementUseCase;

  const baseRequest = {
    tripId: "trip-1",
    from: B_ID,
    to: OWNER_ID,
    amount: 30,
    userEmail: OWNER_EMAIL,
  };

  beforeEach(() => {
    tripRepo = new MockTripContractRepo();
    settledPaymentRepo = new MockSettledPaymentRepo();
    useCase = new CreateSettlementUseCase(tripRepo, settledPaymentRepo);
    tripRepo.seedTrip(tripWithTwo());
  });

  afterEach(() => {
    tripRepo.clear();
    settledPaymentRepo.clear();
  });

  it("persists and returns the SettledPaymentContract (201 shape)", async () => {
    const result = await useCase.execute(baseRequest);

    expect(result.isSuccess).toBe(true);
    expect(settledPaymentRepo.created).toHaveLength(1);
    expect(result.getValue()).toEqual({
      id: "settlement-1",
      from: B_ID,
      to: OWNER_ID,
      amount: 30,
    });
  });

  it("allows any participant (not only the owner) to record a payment", async () => {
    const result = await useCase.execute({ ...baseRequest, userEmail: B_EMAIL });

    expect(result.isSuccess).toBe(true);
    expect(settledPaymentRepo.created).toHaveLength(1);
  });

  it("returns 404 when the trip does not exist", async () => {
    const result = await useCase.execute({ ...baseRequest, tripId: "ghost" });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(404);
    expect(settledPaymentRepo.created).toHaveLength(0);
  });

  it("returns 403 when the caller is not a participant", async () => {
    const result = await useCase.execute({
      ...baseRequest,
      userEmail: "stranger@test.com",
    });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(403);
    expect(result.errorValue().code).toBe("forbidden");
    expect(settledPaymentRepo.created).toHaveLength(0);
  });

  it("returns 400 (validation_error) when from/to are not participants", async () => {
    const result = await useCase.execute({ ...baseRequest, from: "ghost" });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(400);
    expect(result.errorValue().code).toBe("validation_error");
    expect(settledPaymentRepo.created).toHaveLength(0);
  });

  it("returns 400 when amount is not greater than zero", async () => {
    const result = await useCase.execute({ ...baseRequest, amount: 0 });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(400);
    expect(settledPaymentRepo.created).toHaveLength(0);
  });

  it("returns 400 when from and to are the same participant", async () => {
    const result = await useCase.execute({ ...baseRequest, to: B_ID });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(400);
    expect(settledPaymentRepo.created).toHaveLength(0);
  });
});

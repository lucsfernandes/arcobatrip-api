import { DeleteSettlementUseCase } from "../../../../application/usecases/settlements/deleteSettlement/DeleteSettlementUseCase";
import { MockTripContractRepo, buildTrip } from "../../../mocks/mockTripContractRepo";
import { MockSettledPaymentRepo } from "../../../mocks/mockSettledPaymentRepo";
import { SettledPayment } from "../../../../domain/entities/SettledPayment/settledPayment.entity";

const OWNER_EMAIL = "owner@test.com";

const seedPayment = (
  repo: MockSettledPaymentRepo,
  over?: Partial<SettledPayment>
): void => {
  repo.seed({
    id: "settlement-1",
    tripId: "trip-1",
    fromId: "participant-owner",
    toId: "participant-b",
    amount: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as SettledPayment);
};

describe("DeleteSettlementUseCase", () => {
  let tripRepo: MockTripContractRepo;
  let settledPaymentRepo: MockSettledPaymentRepo;
  let useCase: DeleteSettlementUseCase;

  const baseRequest = {
    tripId: "trip-1",
    settlementId: "settlement-1",
    userEmail: OWNER_EMAIL,
  };

  beforeEach(() => {
    tripRepo = new MockTripContractRepo();
    settledPaymentRepo = new MockSettledPaymentRepo();
    useCase = new DeleteSettlementUseCase(tripRepo, settledPaymentRepo);
    tripRepo.seedTrip(buildTrip());
  });

  afterEach(() => {
    tripRepo.clear();
    settledPaymentRepo.clear();
  });

  it("soft-deletes a payment of the trip (204)", async () => {
    seedPayment(settledPaymentRepo);

    const result = await useCase.execute(baseRequest);

    expect(result.isSuccess).toBe(true);
    expect(settledPaymentRepo.softDeleted).toEqual(["settlement-1"]);
    expect(await settledPaymentRepo.findByTrip("trip-1")).toHaveLength(0);
  });

  it("returns 404 when the trip does not exist", async () => {
    seedPayment(settledPaymentRepo);

    const result = await useCase.execute({ ...baseRequest, tripId: "ghost" });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(404);
    expect(settledPaymentRepo.softDeleted).toHaveLength(0);
  });

  it("returns 404 when the payment does not exist", async () => {
    const result = await useCase.execute(baseRequest);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(404);
  });

  it("returns 404 when the payment belongs to another trip", async () => {
    seedPayment(settledPaymentRepo, { tripId: "other-trip" });

    const result = await useCase.execute(baseRequest);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(404);
    expect(settledPaymentRepo.softDeleted).toHaveLength(0);
  });

  it("returns 403 when the caller is not a participant", async () => {
    seedPayment(settledPaymentRepo);

    const result = await useCase.execute({
      ...baseRequest,
      userEmail: "stranger@test.com",
    });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(403);
    expect(settledPaymentRepo.softDeleted).toHaveLength(0);
  });
});

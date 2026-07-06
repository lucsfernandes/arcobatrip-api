import { CreateExpenseUseCase } from "../../../../application/usecases/expenses/createExpense/CreateExpenseUseCase";
import {
  MockTripContractRepo,
  buildTrip,
  buildActivity,
} from "../../../mocks/mockTripContractRepo";
import { MockExpenseRepo } from "../../../mocks/mockExpenseRepo";
import { MockSettledPaymentRepo } from "../../../mocks/mockSettledPaymentRepo";

const PARTICIPANT_ID = "participant-owner"; // seeded by buildTrip

describe("CreateExpenseUseCase — activityId tagging", () => {
  let tripRepo: MockTripContractRepo;
  let expenseRepo: MockExpenseRepo;
  let settledPaymentRepo: MockSettledPaymentRepo;
  let useCase: CreateExpenseUseCase;

  const baseRequest = {
    tripId: "trip-1",
    title: "Jantar",
    amount: 120,
    category: "alimentacao" as const,
    paidById: PARTICIPANT_ID,
    splitBetween: [PARTICIPANT_ID],
  };

  beforeEach(() => {
    tripRepo = new MockTripContractRepo();
    expenseRepo = new MockExpenseRepo();
    settledPaymentRepo = new MockSettledPaymentRepo();
    useCase = new CreateExpenseUseCase(tripRepo, expenseRepo, settledPaymentRepo);
    tripRepo.seedTrip(buildTrip());
  });

  afterEach(() => {
    tripRepo.clear();
    expenseRepo.clear();
    settledPaymentRepo.clear();
  });

  it("persists a general expense (no activityId)", async () => {
    const result = await useCase.execute(baseRequest);

    expect(result.isSuccess).toBe(true);
    expect(expenseRepo.created).toHaveLength(1);
    expect(expenseRepo.created[0].activityId).toBeNull();
  });

  it("persists the activityId when it belongs to the trip", async () => {
    tripRepo.seedActivity(buildActivity({ id: "activity-1", tripId: "trip-1" }));

    const result = await useCase.execute({ ...baseRequest, activityId: "activity-1" });

    expect(result.isSuccess).toBe(true);
    expect(expenseRepo.created[0].activityId).toBe("activity-1");
    // Activity-tagged expenses still count toward the trip settlement.
    expect(result.getValue().expenses[0].activityId).toBe("activity-1");
    expect(result.getValue().settlements).toBeDefined();
  });

  it("rejects (400) an activityId from another trip", async () => {
    tripRepo.seedActivity(buildActivity({ id: "activity-1", tripId: "other-trip" }));

    const result = await useCase.execute({ ...baseRequest, activityId: "activity-1" });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(400);
    expect(result.errorValue().code).toBe("validation_error");
    expect(expenseRepo.created).toHaveLength(0);
  });

  it("rejects (400) an unknown activityId", async () => {
    const result = await useCase.execute({ ...baseRequest, activityId: "ghost" });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(400);
    expect(expenseRepo.created).toHaveLength(0);
  });
});

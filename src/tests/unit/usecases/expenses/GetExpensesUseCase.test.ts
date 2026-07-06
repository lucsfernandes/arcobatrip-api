import { GetExpensesUseCase } from "../../../../application/usecases/expenses/getExpenses/GetExpensesUseCase";
import { MockTripContractRepo, buildTrip } from "../../../mocks/mockTripContractRepo";
import { MockExpenseRepo } from "../../../mocks/mockExpenseRepo";
import { MockSettledPaymentRepo } from "../../../mocks/mockSettledPaymentRepo";
import { Participant } from "../../../../domain/entities/Participant/participant.entity";
import { Trip } from "../../../../domain/entities/Trip/trip.entity";

const A_ID = "participant-owner";
const B_ID = "participant-b";

const tripWithTwo = (): Trip =>
  buildTrip({
    participants: [
      {
        id: A_ID,
        name: "Ana",
        email: "a@test.com",
        isOwner: true,
        isConfirmed: true,
        tripId: "trip-1",
      } as Participant,
      {
        id: B_ID,
        name: "Bea",
        email: "b@test.com",
        isOwner: false,
        isConfirmed: true,
        tripId: "trip-1",
      } as Participant,
    ],
  });

describe("GetExpensesUseCase — settledPayments discount", () => {
  let tripRepo: MockTripContractRepo;
  let expenseRepo: MockExpenseRepo;
  let settledPaymentRepo: MockSettledPaymentRepo;
  let useCase: GetExpensesUseCase;

  beforeEach(async () => {
    tripRepo = new MockTripContractRepo();
    expenseRepo = new MockExpenseRepo();
    settledPaymentRepo = new MockSettledPaymentRepo();
    useCase = new GetExpensesUseCase(tripRepo, expenseRepo, settledPaymentRepo);
    tripRepo.seedTrip(tripWithTwo());
    // A paid 100 split between A and B → A is owed 50 by B.
    await expenseRepo.create({
      tripId: "trip-1",
      title: "Jantar",
      amount: 100,
      category: "alimentacao",
      paidById: A_ID,
      splitBetween: [A_ID, B_ID],
    });
  });

  afterEach(() => {
    tripRepo.clear();
    expenseRepo.clear();
    settledPaymentRepo.clear();
  });

  it("without recorded payments, B owes A the full 50", async () => {
    const result = await useCase.execute({ tripId: "trip-1" });

    expect(result.isSuccess).toBe(true);
    const value = result.getValue();
    expect(value.settledPayments).toEqual([]);
    expect(value.settlements).toEqual([
      { fromId: B_ID, toId: A_ID, amount: 50 },
    ]);
  });

  it("discounts a recorded payment from the pending settlements", async () => {
    // B already paid A 30 → remaining debt is 20.
    await settledPaymentRepo.create({
      tripId: "trip-1",
      fromId: B_ID,
      toId: A_ID,
      amount: 30,
    });

    const result = await useCase.execute({ tripId: "trip-1" });

    expect(result.isSuccess).toBe(true);
    const value = result.getValue();
    expect(value.settledPayments).toEqual([
      { id: "settlement-1", from: B_ID, to: A_ID, amount: 30 },
    ]);
    expect(value.settlements).toEqual([
      { fromId: B_ID, toId: A_ID, amount: 20 },
    ]);
  });

  it("clears the pending settlements once the debt is fully paid", async () => {
    await settledPaymentRepo.create({
      tripId: "trip-1",
      fromId: B_ID,
      toId: A_ID,
      amount: 50,
    });

    const result = await useCase.execute({ tripId: "trip-1" });

    expect(result.getValue().settlements).toEqual([]);
    expect(result.getValue().settledPayments).toHaveLength(1);
  });

  it("returns 404 when the trip does not exist", async () => {
    const result = await useCase.execute({ tripId: "ghost" });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(404);
  });
});

import { RemoveGuestUseCase } from "../../../../application/usecases/trips/removeGuest/RemoveGuestUseCase";
import { MockTripContractRepo, buildTrip } from "../../../mocks/mockTripContractRepo";
import { MockExpenseRepo } from "../../../mocks/mockExpenseRepo";
import { MockSettledPaymentRepo } from "../../../mocks/mockSettledPaymentRepo";
import { Participant } from "../../../../domain/entities/Participant/participant.entity";
import { Expense } from "../../../../domain/entities/Expense/expense.entity";
import { SettledPayment } from "../../../../domain/entities/SettledPayment/settledPayment.entity";

describe("RemoveGuestUseCase", () => {
  let repo: MockTripContractRepo;
  let expenses: MockExpenseRepo;
  let payments: MockSettledPaymentRepo;
  let useCase: RemoveGuestUseCase;

  const OWNER_EMAIL = "owner@test.com";
  const OWNER_ID = "participant-owner";

  const guest = (overrides: Partial<Participant> = {}): Participant =>
    ({
      id: "participant-guest",
      name: "Convidada",
      email: "guest@test.com",
      isOwner: false,
      isConfirmed: false,
      tripId: "trip-1",
      ...overrides,
    }) as Participant;

  function seedTripWith(...guests: Participant[]) {
    const trip = buildTrip();
    trip.participants = [...trip.participants, ...guests];
    repo.seedTrip(trip);
  }

  const remove = (guestId = "participant-guest", userEmail = OWNER_EMAIL) =>
    useCase.execute({ tripId: "trip-1", guestId, userEmail });

  beforeEach(() => {
    repo = new MockTripContractRepo();
    expenses = new MockExpenseRepo();
    payments = new MockSettledPaymentRepo();
    useCase = new RemoveGuestUseCase(repo, expenses, payments);
  });

  afterEach(() => {
    repo.clear();
    expenses.clear();
  });

  it("o dono remove um convidado pendente (soft delete)", async () => {
    seedTripWith(guest());

    const result = await remove();

    expect(result.isSuccess).toBe(true);
    expect(repo.softDeletedGuests).toEqual(["participant-guest"]);
    expect(await repo.findGuest("trip-1", "participant-guest")).toBeNull();
  });

  it("nega (403) a quem não é o dono, mesmo sendo participante", async () => {
    seedTripWith(guest(), guest({ id: "other", email: "other@test.com", isConfirmed: true }));

    const result = await remove("participant-guest", "other@test.com");

    expect(result.errorValue().statusCode).toBe(403);
    expect(repo.softDeletedGuests).toHaveLength(0);
  });

  it("retorna 404 para viagem ou convidado inexistente", async () => {
    expect((await remove()).errorValue().statusCode).toBe(404);

    seedTripWith(guest());
    expect((await remove("nope")).errorValue().statusCode).toBe(404);
  });

  it("retorna 409 para o anfitrião", async () => {
    seedTripWith();

    const result = await remove(OWNER_ID);

    expect(result.errorValue().statusCode).toBe(409);
    expect(result.errorValue().code).toBe("conflict");
    expect(repo.softDeletedGuests).toHaveLength(0);
  });

  it("retorna 409 para um convidado que já confirmou", async () => {
    seedTripWith(guest({ isConfirmed: true }));

    const result = await remove();

    expect(result.errorValue().statusCode).toBe(409);
    expect(repo.softDeletedGuests).toHaveLength(0);
  });

  it.each([
    ["pagou uma despesa", { paidById: "participant-guest", splitBetween: [OWNER_ID] }],
    ["está na divisão de uma despesa", { paidById: OWNER_ID, splitBetween: [OWNER_ID, "participant-guest"] }],
  ])("retorna 409 quando o convidado %s", async (_label, fields) => {
    seedTripWith(guest());
    expenses.seed({ id: "e1", tripId: "trip-1", title: "Pousada", amount: 100, ...fields } as Expense);

    const result = await remove();

    expect(result.errorValue().statusCode).toBe(409);
    expect(repo.softDeletedGuests).toHaveLength(0);
  });

  it("retorna 409 quando o convidado está num pagamento registrado", async () => {
    seedTripWith(guest());
    payments.seed({ id: "s1", tripId: "trip-1", fromId: "participant-guest", toId: OWNER_ID, amount: 50 } as SettledPayment);

    const result = await remove();

    expect(result.errorValue().statusCode).toBe(409);
  });

  it("ignora despesas de outras viagens", async () => {
    seedTripWith(guest());
    expenses.seed({ id: "e9", tripId: "trip-2", paidById: "participant-guest", splitBetween: [] } as unknown as Expense);

    const result = await remove();

    expect(result.isSuccess).toBe(true);
  });
});

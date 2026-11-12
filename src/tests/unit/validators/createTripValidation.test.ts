import {
  DESTINATION_MAX_LENGTH,
  createTripValidation,
} from "../../../presentation/validators/trip/tripContractValidation";

describe("createTripValidation — destination", () => {
  const body = (destination: string) => ({
    destination,
    startDate: "2026-12-10",
    endDate: "2026-12-17",
  });

  it("aceita um destino de até 100 caracteres", () => {
    expect(createTripValidation.safeParse(body("Florianópolis")).success).toBe(true);
    expect(createTripValidation.safeParse(body("a".repeat(DESTINATION_MAX_LENGTH))).success).toBe(true);
  });

  it("recusa um destino com mais de 100 caracteres", () => {
    const result = createTripValidation.safeParse(body("a".repeat(DESTINATION_MAX_LENGTH + 1)));
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Destino deve ter no máximo 100 caracteres");
  });

  it("recusa um destino vazio ou só com espaços", () => {
    expect(createTripValidation.safeParse(body("")).success).toBe(false);
    expect(createTripValidation.safeParse(body("   ")).success).toBe(false);
  });

  it("conta o limite depois de tirar os espaços das pontas", () => {
    const result = createTripValidation.safeParse(body(`  ${"a".repeat(DESTINATION_MAX_LENGTH)}  `));
    expect(result.success).toBe(true);
    expect(result.data?.destination).toHaveLength(DESTINATION_MAX_LENGTH);
  });
});

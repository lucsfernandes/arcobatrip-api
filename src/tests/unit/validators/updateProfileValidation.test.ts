import { updateProfileValidation } from "../../../presentation/validators/user/updateProfileValidation";

describe("updateProfileValidation (PATCH /users/me whitelist)", () => {
  it("accepts a partial payload with a single whitelisted field", () => {
    const result = updateProfileValidation.safeParse({ fullName: "Ana Beatriz" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty object (at least one field required)", () => {
    const result = updateProfileValidation.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects unknown keys (strict whitelist)", () => {
    const result = updateProfileValidation.safeParse({ fullName: "Ana", role: "admin" });
    expect(result.success).toBe(false);
  });

  it("rejects `email` (immutable — not part of the whitelist)", () => {
    const result = updateProfileValidation.safeParse({ email: "x@y.com" });
    expect(result.success).toBe(false);
  });

  it("normalizes a human-formatted phone to E.164", () => {
    const result = updateProfileValidation.safeParse({ phone: "+55 (11) 99999-9999" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("+5511999999999");
    }
  });

  it("rejects a non-E.164 phone", () => {
    const result = updateProfileValidation.safeParse({ phone: "11999" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed birthDate", () => {
    const result = updateProfileValidation.safeParse({ birthDate: "20/04/1995" });
    expect(result.success).toBe(false);
  });
});

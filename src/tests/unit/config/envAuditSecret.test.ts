/**
 * AUDIT_HASH_SECRET reaches the pod through the deploy, which writes the variable
 * even when the GitHub secret does not exist. An empty value must count as
 * "not set" (fallback), never crash the boot.
 */
function loadEnv(value: string | undefined) {
  let env!: { AUDIT_HASH_SECRET?: string };
  const previous = process.env.AUDIT_HASH_SECRET;
  if (value === undefined) delete process.env.AUDIT_HASH_SECRET;
  else process.env.AUDIT_HASH_SECRET = value;
  const exit = jest.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code})`);
  }) as never);
  const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
  try {
    jest.isolateModules(() => {
      env = require("../../../main/config/env").env;
    });
  } finally {
    exit.mockRestore();
    error.mockRestore();
    if (previous === undefined) delete process.env.AUDIT_HASH_SECRET;
    else process.env.AUDIT_HASH_SECRET = previous;
  }
  return env;
}

describe("AUDIT_HASH_SECRET", () => {
  it("is used when set", () => {
    expect(loadEnv("x".repeat(64)).AUDIT_HASH_SECRET).toBe("x".repeat(64));
  });

  it("counts as not set when empty or blank, without crashing the boot", () => {
    expect(loadEnv("").AUDIT_HASH_SECRET).toBeUndefined();
    expect(loadEnv("   ").AUDIT_HASH_SECRET).toBeUndefined();
  });

  it("counts as not set when absent", () => {
    expect(loadEnv(undefined).AUDIT_HASH_SECRET).toBeUndefined();
  });

  it("still refuses a value that is too short to be a real secret", () => {
    expect(() => loadEnv("short")).toThrow("process.exit(1)");
  });
});

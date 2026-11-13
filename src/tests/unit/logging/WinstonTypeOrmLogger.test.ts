import logger from "../../../main/logger";
import { WinstonTypeOrmLogger } from "../../../infra/db/WinstonTypeOrmLogger";

describe("WinstonTypeOrmLogger", () => {
  const typeorm = new WinstonTypeOrmLogger();
  let error: jest.SpyInstance;
  let debug: jest.SpyInstance;
  let warn: jest.SpyInstance;

  beforeEach(() => {
    error = jest.spyOn(logger, "error").mockImplementation((() => logger) as never);
    debug = jest.spyOn(logger, "debug").mockImplementation((() => logger) as never);
    warn = jest.spyOn(logger, "warn").mockImplementation((() => logger) as never);
  });
  afterEach(() => jest.restoreAllMocks());

  const secrets = ["maria@exemplo.com", "$2b$12$abcdefghijklmnopqrstuv", "a".repeat(64)];
  const everything = () => JSON.stringify([...error.mock.calls, ...debug.mock.calls, ...warn.mock.calls]);

  it("never passes the parameters of a failed query on, only how many there were", () => {
    typeorm.logQueryError(new Error("duplicate key"), 'INSERT INTO "users" ("email") VALUES ($1)', secrets);

    expect(everything()).not.toContain("maria@exemplo.com");
    expect(everything()).not.toContain("$2b$12$");
    expect(error).toHaveBeenCalledWith(
      "[typeorm] query failed",
      expect.objectContaining({ parameters: 3, error: "duplicate key" })
    );
  });

  it("does not pass the parameters of an ordinary query on either (debug level)", () => {
    typeorm.logQuery('SELECT * FROM "users" WHERE "email" = $1', secrets);

    expect(everything()).not.toContain("maria@exemplo.com");
    expect(debug).toHaveBeenCalledTimes(1);
  });

  it("does not pass the parameters of a slow query on", () => {
    typeorm.logQuerySlow(1500, "SELECT 1 WHERE x = $1", secrets);

    expect(everything()).not.toContain("maria@exemplo.com");
    expect(warn).toHaveBeenCalledWith("[typeorm] slow query", expect.objectContaining({ duration_ms: 1500 }));
  });

  it("keeps a very long query readable", () => {
    typeorm.logQueryError("boom", `SELECT ${"x, ".repeat(1000)}`, []);
    const logged = error.mock.calls[0][1] as { query: string };
    expect(logged.query.length).toBeLessThanOrEqual(601);
    expect(logged.query.endsWith("…")).toBe(true);
  });
});

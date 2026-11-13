import { Writable } from "stream";
import winston from "winston";

/** A logger built from the app's real config, writing into memory. */
function captureWith(config: { level: string; format: winston.Logform.Format }) {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      lines.push(chunk.toString());
      cb();
    },
  });
  const logger = winston.createLogger({
    level: config.level,
    format: config.format,
    transports: [new winston.transports.Stream({ stream })],
  });
  return { logger, entries: () => lines.map((l) => JSON.parse(l)) };
}

function freshConfig(level?: string) {
  let config!: { level: string; format: winston.Logform.Format };
  jest.isolateModules(() => {
    const previous = process.env.LOG_LEVEL;
    if (level) process.env.LOG_LEVEL = level;
    else delete process.env.LOG_LEVEL;
    config = require("../../../main/config/logger-transport").loggerConfig;
    if (previous === undefined) delete process.env.LOG_LEVEL;
    else process.env.LOG_LEVEL = previous;
  });
  return config;
}

describe("logger config", () => {
  it("defaults to info and follows LOG_LEVEL", () => {
    expect(freshConfig().level).toBe("info");
    expect(freshConfig("warn").level).toBe("warn");
    expect(freshConfig("debug").level).toBe("debug");
  });

  it("writes JSON with a timestamp and marks plain logs as `app`", () => {
    const { logger, entries } = captureWith(freshConfig());
    logger.info("hello", { a: 1 });

    expect(entries()[0]).toMatchObject({ level: "info", message: "hello", a: 1, log_type: "app" });
    expect(typeof entries()[0].timestamp).toBe("string");
  });

  it("keeps the `access` type when the entry says so", () => {
    const { logger, entries } = captureWith(freshConfig());
    logger.info("request", { log_type: "access" });
    expect(entries()[0].log_type).toBe("access");
  });

  it("drops entries below the level", () => {
    const { logger, entries } = captureWith(freshConfig("warn"));
    logger.info("noise");
    logger.warn("kept");
    expect(entries().map((e) => e.message)).toEqual(["kept"]);
  });

  it("never lets a password, token, cookie or Authorization reach the output", () => {
    const { logger, entries } = captureWith(freshConfig());
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxIn0.c2lnbmF0dXJl";

    logger.error("login failed", {
      password: "hunter2",
      headers: { authorization: `Bearer ${jwt}`, cookie: "access_token=" + jwt },
      url: "/reset-password?token=abc123",
    });
    logger.error(`unexpected ${jwt}`);
    logger.error("boom", new Error("failed for /x?access_token=zzz"));

    const raw = JSON.stringify(entries());
    for (const secret of ["hunter2", jwt, "abc123", "zzz"]) expect(raw).not.toContain(secret);
    expect(raw).toContain("[REDACTED]");
  });

  it("does not hide the level", () => {
    const { logger, entries } = captureWith(freshConfig());
    logger.error("x", { token: "t" });
    expect(entries()[0].level).toBe("error");
  });
});

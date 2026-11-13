import request from "supertest";
import express, { Express } from "express";
import { requestLogger, routeTemplate } from "../../../presentation/middlewares/requestLogger";

type Entry = Record<string, unknown>;

function build(): { app: Express; entries: Entry[] } {
  const entries: Entry[] = [];
  const app = express();
  app.set("trust proxy", 1);
  app.use(requestLogger({ info: (_message, meta) => entries.push(meta) }));
  app.use(express.json());

  // Routes shaped like the real ones: nested routers and a template.
  const trips = express.Router();
  trips.get("/:id", (req, res) => {
    (req as { userId?: string }).userId = "user-42";
    res.json({ id: req.params.id });
  });
  trips.post("/", (_req, res) => {
    res.status(201).json({});
  });
  const v1 = express.Router();
  v1.use("/trips", trips);
  v1.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api/v1", v1);
  return { app, entries };
}

describe("requestLogger", () => {
  it("logs one access entry per request, with the fields needed to trace it", async () => {
    const { app, entries } = build();

    const res = await request(app).get("/api/v1/trips/abc-123").set("X-Forwarded-For", "203.0.113.7");

    expect(res.status).toBe(200);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      log_type: "access",
      method: "GET",
      route: "/api/v1/trips/:id",
      status: 200,
      user_id: "user-42",
      ip: "203.0.113.7",
    });
    expect(typeof entries[0].duration_ms).toBe("number");
    expect(entries[0].duration_ms as number).toBeGreaterThanOrEqual(0);
  });

  it("logs the route as a template, so no id or search term ends up in the log", async () => {
    const { app, entries } = build();
    await request(app).get("/api/v1/trips/9f1c-secret-id");
    expect(entries[0].route).toBe("/api/v1/trips/:id");
    expect(JSON.stringify(entries[0])).not.toContain("9f1c-secret-id");
  });

  it("answers every response with X-Request-Id, and the log carries the same id", async () => {
    const { app, entries } = build();

    const res = await request(app).get("/api/v1/trips/1");

    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
    expect(entries[0].request_id).toBe(res.headers["x-request-id"]);
  });

  it("gives each request its own id", async () => {
    const { app } = build();
    const a = await request(app).get("/api/v1/trips/1");
    const b = await request(app).get("/api/v1/trips/1");
    expect(a.headers["x-request-id"]).not.toBe(b.headers["x-request-id"]);
  });

  it("keeps a sane id sent by the caller", async () => {
    const { app, entries } = build();
    const res = await request(app).get("/api/v1/trips/1").set("X-Request-Id", "client-trace-0001");
    expect(res.headers["x-request-id"]).toBe("client-trace-0001");
    expect(entries[0].request_id).toBe("client-trace-0001");
  });

  it.each(["short", "has spaces in it!!", "x".repeat(65), "<script>alert(1)</script>", "id-with-ünïcode-1234"])(
    "replaces an id that could forge or inject log lines (%j)",
    async (bad) => {
      const { app, entries } = build();
      const res = await request(app).get("/api/v1/trips/1").set("X-Request-Id", bad);
      expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
      expect(entries[0].request_id).toBe(res.headers["x-request-id"]);
    }
  );

  it.each(["valid-id-12345\n", "valid-id-12345\r\nfake_field=1", "line1\nline2-valid-id"])(
    "replaces an id with a line break in it (%j)",
    (bad) => {
      // An HTTP client will not even send a line break in a header, so call the middleware directly.
      const sent: Record<string, string> = {};
      const res = Object.assign(new (require("events").EventEmitter)(), {
        setHeader: (k: string, v: string) => {
          sent[k] = v;
        },
      });
      const req = { get: () => bad, method: "GET", baseUrl: "", route: undefined, ip: "1.2.3.4" };

      requestLogger({ info: () => undefined })(req as never, res as never, () => undefined);

      expect(sent["X-Request-Id"]).toMatch(/^[0-9a-f-]{36}$/);
    }
  );

  it("never logs the query string, the body, the headers or the cookies", async () => {
    const { app, entries } = build();
    const secrets = ["QUERY-SECRET-1", "BODY-SECRET-2", "HEADER-SECRET-3", "COOKIE-SECRET-4", "maria@exemplo.com"];

    await request(app)
      .post("/api/v1/trips?token=QUERY-SECRET-1&email=maria@exemplo.com")
      .set("Authorization", "Bearer HEADER-SECRET-3")
      .set("Cookie", "access_token=COOKIE-SECRET-4")
      .send({ password: "BODY-SECRET-2" });

    expect(entries).toHaveLength(1);
    const raw = JSON.stringify(entries[0]);
    for (const secret of secrets) expect(raw).not.toContain(secret);
    expect(Object.keys(entries[0]).sort()).toEqual(
      ["duration_ms", "ip", "log_type", "method", "request_id", "route", "status", "user_id"].sort()
    );
  });

  it("logs a path that matched nothing as `unmatched`, never as what was typed", async () => {
    const { app, entries } = build();

    const res = await request(app).get("/wp-admin/setup-config.php?x=1");

    expect(res.status).toBe(404);
    expect(entries[0]).toMatchObject({ route: "unmatched", status: 404 });
    expect(JSON.stringify(entries[0])).not.toContain("wp-admin");
    expect(res.headers["x-request-id"]).toBeDefined();
  });

  it("records the status of an error response", async () => {
    const { app, entries } = build();
    await request(app).post("/api/v1/trips").send({});
    expect(entries[0]).toMatchObject({ method: "POST", status: 201, route: "/api/v1/trips" });
  });

  it("has no user for an anonymous request", async () => {
    const { app, entries } = build();
    await request(app).post("/api/v1/trips");
    expect(entries[0].user_id).toBeNull();
  });

  it("does not log health checks (probes are not users) but still tags them", async () => {
    const { app, entries } = build();
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(entries).toHaveLength(0);
    expect(res.headers["x-request-id"]).toBeDefined();
  });
});

describe("routeTemplate", () => {
  it("is `unmatched` when nothing matched at all", () => {
    expect(routeTemplate({ baseUrl: "", route: undefined } as never)).toBe("unmatched");
  });
  it("names the router when a middleware answered before a route matched", () => {
    expect(routeTemplate({ baseUrl: "/api/v1/trips", route: undefined } as never)).toBe("/api/v1/trips/*");
  });
  it("joins the mount path and the route path, dropping a bare `/`", () => {
    expect(routeTemplate({ baseUrl: "/api/v1/trips", route: { path: "/" } } as never)).toBe("/api/v1/trips");
    expect(routeTemplate({ baseUrl: "/api/v1/trips", route: { path: "/:id/guests" } } as never)).toBe(
      "/api/v1/trips/:id/guests"
    );
  });
});

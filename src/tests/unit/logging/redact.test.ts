import { REDACTED, redact } from "../../../main/logging/redact";

const JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1LTEifQ.c2lnbmF0dXJlLWJ5dGVz";
const RAW_LINK_TOKEN = "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90";

describe("redact — by field name", () => {
  it.each([
    "password",
    "newPassword",
    "accessToken",
    "refresh_token",
    "idToken",
    "Authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "apiKey",
    "clientSecret",
    "jwt",
  ])("never logs the value of %s", (key) => {
    expect(redact({ [key]: "super-secret-value", status: 200 })).toEqual({
      [key]: REDACTED,
      status: 200,
    });
  });

  it("goes into nested objects and arrays", () => {
    const out = redact({
      req: { headers: { authorization: "Bearer abc", accept: "json" }, body: { password: "x", name: "ok" } },
      list: [{ token: "t" }, { fine: 1 }],
    });
    expect(JSON.stringify(out)).not.toMatch(/Bearer abc|"x"|"t"/);
    expect(out).toMatchObject({ req: { headers: { accept: "json" }, body: { name: "ok" } }, list: [{}, { fine: 1 }] });
  });

  it("keeps useful fields that only look alike", () => {
    expect(redact({ code: "ECONNREFUSED", request_id: "abc", user_id: "u1", route: "/x" })).toEqual({
      code: "ECONNREFUSED",
      request_id: "abc",
      user_id: "u1",
      route: "/x",
    });
  });
});

describe("redact — by value, inside free text", () => {
  it("hides a JWT wherever it appears", () => {
    expect(redact(`falha com ${JWT} no header`)).toBe(`falha com ${REDACTED} no header`);
  });

  it("hides a Bearer credential", () => {
    expect(redact("Authorization: Bearer abc.DEF-123_x")).toBe(`Authorization: Bearer ${REDACTED}`);
  });

  it("hides a token in a URL's query string but keeps the rest of the URL", () => {
    expect(redact("GET /verify-email?token=abc123&lang=pt")).toBe(`GET /verify-email?token=${REDACTED}&lang=pt`);
    expect(redact("https://x.com/reset?access_token=zzz")).toBe(`https://x.com/reset?access_token=${REDACTED}`);
    expect(redact("/a?password=hunter2&b=1")).toBe(`/a?password=${REDACTED}&b=1`);
  });

  it("hides the raw 64-character token of an e-mailed link", () => {
    expect(redact(`link /delete-account?x=${RAW_LINK_TOKEN} usado`)).not.toContain(RAW_LINK_TOKEN);
    expect(redact(`token ${RAW_LINK_TOKEN} inválido`)).toBe(`token ${REDACTED} inválido`);
  });

  it("masks an e-mail address in free text, wherever it appears", () => {
    expect(redact("email para maria.souza+zarpa@exemplo.com.br não foi enviado")).toBe(
      "email para [email] não foi enviado"
    );
    expect(redact("a@b.co e c@d.org")).toBe("[email] e [email]");
  });

  it("masks an e-mail inside a nested field and inside an Error", () => {
    expect(JSON.stringify(redact({ context: { note: "falhou para x@y.com" } }))).not.toContain("x@y.com");
    expect((redact(new Error("dup key maria@exemplo.com")) as { message: string }).message).toBe("dup key [email]");
  });

  it("does not take a version or a handle for an e-mail", () => {
    expect(redact("node@24 and @types/node 1.2.3")).toBe("node@24 and @types/node 1.2.3");
  });

  it("leaves ordinary text alone", () => {
    expect(redact("Server up and running on port 3000...")).toBe("Server up and running on port 3000...");
  });
});

describe("redact — shape", () => {
  it("keeps an Error's name, message and stack, scrubbed", () => {
    const error = new Error(`falhou para /x?token=abc e ${JWT}`);
    const out = redact(error) as { name: string; message: string; stack: string };

    expect(out.name).toBe("Error");
    expect(out.message).toBe(`falhou para /x?token=${REDACTED} e ${REDACTED}`);
    expect(out.stack).not.toContain(JWT);
    expect(out.stack).toContain("falhou para");
  });

  it("does not change what it was given", () => {
    const input = { password: "x", nested: { token: "y" }, text: `Bearer abc` };
    const snapshot = JSON.stringify(input);
    redact(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("copes with a cycle", () => {
    const a: Record<string, unknown> = { name: "a" };
    a.self = a;
    expect(redact(a)).toEqual({ name: "a", self: "[Circular]" });
  });

  it("stops at a depth limit instead of walking forever", () => {
    let deep: Record<string, unknown> = { leaf: true };
    for (let i = 0; i < 30; i += 1) deep = { child: deep };
    expect(JSON.stringify(redact(deep))).toContain("[Truncated]");
  });

  it("passes numbers, booleans and null through", () => {
    expect(redact({ a: 1, b: false, c: null, d: undefined })).toEqual({ a: 1, b: false, c: null, d: undefined });
  });
});

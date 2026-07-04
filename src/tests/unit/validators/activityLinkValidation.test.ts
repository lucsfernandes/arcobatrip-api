import {
  createActivityLinkValidation,
  createCommentValidation,
} from "../../../presentation/validators/trip/tripContractValidation";

describe("createActivityLinkValidation", () => {
  it("accepts an https URL", () => {
    const result = createActivityLinkValidation.safeParse({
      label:"Ingressos",
      url: "https://example.com/tickets",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an http URL", () => {
    const result = createActivityLinkValidation.safeParse({
      label:"Site",
      url: "http://example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a javascript: pseudo-URL", () => {
    const result = createActivityLinkValidation.safeParse({
      label:"xss",
      url: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a data: URL", () => {
    const result = createActivityLinkValidation.safeParse({
      label:"data",
      url: "data:text/html,<script>alert(1)</script>",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a file: URL", () => {
    const result = createActivityLinkValidation.safeParse({
      label:"file",
      url: "file:///etc/passwd",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-URL string", () => {
    const result = createActivityLinkValidation.safeParse({
      label:"nope",
      url: "not a url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty label", () => {
    const result = createActivityLinkValidation.safeParse({
      label:"   ",
      url: "https://example.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("createCommentValidation", () => {
  it("accepts a non-empty body and trims it", () => {
    const result = createCommentValidation.safeParse({ body: "  olá  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.body).toBe("olá");
  });

  it("rejects an empty/whitespace body", () => {
    expect(createCommentValidation.safeParse({ body: "   " }).success).toBe(false);
    expect(createCommentValidation.safeParse({}).success).toBe(false);
  });
});

import { parseDeleteAccountArgs } from "../../../main/cli/deleteAccountArgs";

describe("parseDeleteAccountArgs", () => {
  it("is a simulation unless --confirm is given", () => {
    expect(parseDeleteAccountArgs(["--email", "maria@exemplo.com"])).toEqual({
      email: "maria@exemplo.com",
      confirm: false,
      retryImages: false,
    });
    expect(parseDeleteAccountArgs(["--email=maria@exemplo.com", "--confirm"]).confirm).toBe(true);
  });

  it("accepts --retry-images on its own", () => {
    expect(parseDeleteAccountArgs(["--email", "m@x.com", "--retry-images"]).retryImages).toBe(true);
  });

  it("refuses without an e-mail, with a malformed one or an unknown option", () => {
    expect(() => parseDeleteAccountArgs([])).toThrow("--email");
    expect(() => parseDeleteAccountArgs(["--email"])).toThrow("--email");
    expect(() => parseDeleteAccountArgs(["--email", "--confirm"])).toThrow("--email");
    expect(() => parseDeleteAccountArgs(["--email", "not-an-email"])).toThrow("e-mail");
    expect(() => parseDeleteAccountArgs(["--email", "m@x.com", "--force"])).toThrow("desconhecido");
  });

  it("does not mix --retry-images with --confirm", () => {
    expect(() => parseDeleteAccountArgs(["--email", "m@x.com", "--retry-images", "--confirm"])).toThrow(
      "não se combinam"
    );
  });
});

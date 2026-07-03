import { localPartOf, displayNameFromEmail } from "../../../application/utils/email";

describe("email utils", () => {
  describe("localPartOf", () => {
    it("returns the part before the @", () => {
      expect(localPartOf("ana.souza@example.com")).toBe("ana.souza");
    });

    it("returns the raw string when there is no @", () => {
      expect(localPartOf("ana.souza")).toBe("ana.souza");
    });
  });

  describe("displayNameFromEmail", () => {
    it("capitalizes a dotted local-part into a spaced name", () => {
      expect(displayNameFromEmail("ana.souza@example.com")).toBe("Ana Souza");
    });

    it("splits on underscores and hyphens too", () => {
      expect(displayNameFromEmail("joao_pedro-silva@x.com")).toBe("Joao Pedro Silva");
    });

    it("capitalizes a single-token local-part", () => {
      expect(displayNameFromEmail("ana@example.com")).toBe("Ana");
    });

    it("collapses consecutive separators without empty tokens", () => {
      expect(displayNameFromEmail("ana..souza@example.com")).toBe("Ana Souza");
    });

    it("leaves the rest of each token untouched (only first letter upper)", () => {
      expect(displayNameFromEmail("mcLovin@example.com")).toBe("McLovin");
    });

    it("falls back to the raw local-part when it has no usable tokens", () => {
      expect(displayNameFromEmail("..@example.com")).toBe("..");
    });
  });
});

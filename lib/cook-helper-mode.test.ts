import { describe, expect, it } from "vitest";
import { buildCookHelperNotes, getAddRequestExperience } from "./cook-helper-mode";

describe("cook helper mode", () => {
  it("uses simplified add mode for cooks only", () => {
    expect(getAddRequestExperience("COOK")).toBe("cook-helper");
    expect(getAddRequestExperience("ADMIN")).toBe("standard");
    expect(getAddRequestExperience("MEMBER")).toBe("standard");
    expect(getAddRequestExperience(null)).toBe("standard");
  });

  it("marks cook helper submissions without dropping notes", () => {
    expect(buildCookHelperNotes()).toBe("Submitted from cook helper mode.");
    expect(buildCookHelperNotes("Aaj ke liye")).toBe("Submitted from cook helper mode.\nAaj ke liye");
  });
});

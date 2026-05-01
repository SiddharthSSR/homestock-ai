import { describe, expect, it } from "vitest";
import { PermissionError, canRole } from "./permissions-service";

describe("canRole", () => {
  it("allows admins to perform admin actions", () => {
    expect(canRole("ADMIN", "grocery:approve")).toBe(true);
    expect(canRole("ADMIN", "cart:prepare")).toBe(true);
    expect(canRole("ADMIN", "cart:edit")).toBe(true);
    expect(canRole("ADMIN", "cart:approve")).toBe(true);
    expect(canRole("ADMIN", "household:manage")).toBe(true);
  });

  it("allows members to add grocery and memory suggestions only", () => {
    expect(canRole("MEMBER", "grocery:add")).toBe(true);
    expect(canRole("MEMBER", "memory:add-suggestion")).toBe(true);
    expect(canRole("MEMBER", "grocery:approve")).toBe(false);
    expect(canRole("MEMBER", "cart:prepare")).toBe(false);
    expect(canRole("MEMBER", "cart:approve")).toBe(false);
    expect(canRole("MEMBER", "household:manage")).toBe(false);
  });

  it("allows cooks to add grocery requests only", () => {
    expect(canRole("COOK", "grocery:add")).toBe(true);
    expect(canRole("COOK", "memory:add-suggestion")).toBe(false);
    expect(canRole("COOK", "grocery:approve")).toBe(false);
    expect(canRole("COOK", "cart:prepare")).toBe(false);
    expect(canRole("COOK", "cart:edit")).toBe(false);
  });

  it("blocks users with no household role", () => {
    expect(canRole(null, "grocery:add")).toBe(false);
    expect(canRole(undefined, "cart:approve")).toBe(false);
  });

  it("uses a 403-style error for unauthorized mutations", () => {
    const error = new PermissionError("Only household admins can approve grocery requests.");
    expect(error.status).toBe(403);
    expect(error.message).toContain("admins");
  });
});

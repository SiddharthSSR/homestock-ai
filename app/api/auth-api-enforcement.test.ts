import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  prisma: {
    householdMember: {
      findUnique: vi.fn(),
      findFirst: vi.fn()
    },
    groceryRequest: {
      findUnique: vi.fn(),
      findMany: vi.fn()
    },
    cartDraft: {
      findUnique: vi.fn(),
      findMany: vi.fn()
    },
    cartItem: {
      findUnique: vi.fn()
    },
    household: {
      findMany: vi.fn(),
      create: vi.fn()
    },
    user: {
      findFirst: vi.fn(),
      create: vi.fn()
    }
  },
  addGroceryRequests: vi.fn(),
  transitionGroceryRequest: vi.fn(),
  prepareMockCart: vi.fn(),
  dismissMemorySuggestion: vi.fn(),
  getActiveMemoryDismissals: vi.fn(),
  writeAuditLog: vi.fn()
}));

vi.mock("@/lib/auth/config", () => ({
  auth: mocks.auth
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma
}));

vi.mock("@/lib/services/grocery-service", () => ({
  addGroceryRequests: mocks.addGroceryRequests,
  transitionGroceryRequest: mocks.transitionGroceryRequest
}));

vi.mock("@/lib/services/cart-service", () => ({
  prepareMockCart: mocks.prepareMockCart
}));

vi.mock("@/lib/services/memory-service", () => ({
  dismissMemorySuggestion: mocks.dismissMemorySuggestion,
  getActiveMemoryDismissals: mocks.getActiveMemoryDismissals
}));

vi.mock("@/lib/services/audit-service", () => ({
  writeAuditLog: mocks.writeAuditLog
}));

const originalDemo = process.env.DEMO_MODE;
const originalPublicDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

function setDemoMode(enabled: boolean) {
  if (enabled) {
    process.env.DEMO_MODE = "true";
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
  } else {
    delete process.env.DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
  }
}

function jsonRequest(path: string, body: Record<string, unknown>, init: RequestInit = {}) {
  return new Request(`http://localhost:3000${path}`, {
    method: init.method ?? "POST",
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    body: JSON.stringify(body)
  });
}

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("auth API enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDemoMode(false);
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    mocks.auth.mockResolvedValue({ user: { id: "session-user" } });
    mocks.prisma.householdMember.findUnique.mockResolvedValue({ userId: "session-user" });
  });

  afterEach(() => {
    if (originalDemo === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = originalDemo;
    if (originalPublicDemo === undefined) delete process.env.NEXT_PUBLIC_DEMO_MODE;
    else process.env.NEXT_PUBLIC_DEMO_MODE = originalPublicDemo;
    if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it("does not allow non-demo body.actorId to impersonate an admin on grocery approval", async () => {
    mocks.prisma.groceryRequest.findUnique.mockResolvedValue({ householdId: "household-1" });
    mocks.transitionGroceryRequest.mockResolvedValue({ id: "request-1", status: "APPROVED" });
    const { POST } = await import("./grocery-requests/[requestId]/approve/route");

    const response = await POST(
      jsonRequest("/api/grocery-requests/request-1/approve", { actorId: "admin-spoof" }),
      { params: Promise.resolve({ requestId: "request-1" }) }
    );

    expect(response.status).toBe(200);
    expect(mocks.transitionGroceryRequest).toHaveBeenCalledWith(
      "request-1",
      "session-user",
      expect.any(String),
      "GROCERY_REQUEST_APPROVED"
    );
  });

  it("returns 401 for unauthenticated non-demo protected mutations", async () => {
    mocks.auth.mockResolvedValue(null);
    const { POST } = await import("./households/[householdId]/cart/prepare/route");

    const response = await POST(
      jsonRequest("/api/households/household-1/cart/prepare", { actorId: "admin-spoof" }),
      { params: Promise.resolve({ householdId: "household-1" }) }
    );

    expect(response.status).toBe(401);
    expect(await json(response)).toEqual({ error: "Authentication required" });
    expect(mocks.prepareMockCart).not.toHaveBeenCalled();
  });

  it("returns 403 when the session user is not a household member", async () => {
    mocks.prisma.householdMember.findUnique.mockResolvedValue(null);
    const { POST } = await import("./households/[householdId]/grocery-requests/route");

    const response = await POST(
      jsonRequest("/api/households/household-1/grocery-requests", {
        rawText: "Need milk",
        requestedBy: "admin-spoof"
      }),
      { params: Promise.resolve({ householdId: "household-1" }) }
    );

    expect(response.status).toBe(403);
    expect(mocks.addGroceryRequests).not.toHaveBeenCalled();
  });

  it("returns 403 when permission checks reject the session actor", async () => {
    const { PermissionError } = await import("@/lib/services/permissions-service");
    mocks.prepareMockCart.mockRejectedValue(new PermissionError("Only household admins can manage or approve cart drafts."));
    const { POST } = await import("./households/[householdId]/cart/prepare/route");

    const response = await POST(
      jsonRequest("/api/households/household-1/cart/prepare", {}),
      { params: Promise.resolve({ householdId: "household-1" }) }
    );

    expect(response.status).toBe(403);
    expect(await json(response)).toEqual({ error: "Only household admins can manage or approve cart drafts." });
  });

  it("allows a session admin through to prepare cart", async () => {
    mocks.prepareMockCart.mockResolvedValue({ id: "cart-1" });
    const { POST } = await import("./households/[householdId]/cart/prepare/route");

    const response = await POST(
      jsonRequest("/api/households/household-1/cart/prepare", { actorId: "admin-spoof" }),
      { params: Promise.resolve({ householdId: "household-1" }) }
    );

    expect(response.status).toBe(201);
    expect(mocks.prepareMockCart).toHaveBeenCalledWith("household-1", "session-user");
  });

  it("keeps honoring actorId in demo mode", async () => {
    setDemoMode(true);
    mocks.prisma.householdMember.findUnique.mockResolvedValue({ userId: "demo-cook" });
    mocks.addGroceryRequests.mockResolvedValue({ requests: [{ id: "request-1" }] });
    const { POST } = await import("./households/[householdId]/grocery-requests/route");

    const response = await POST(
      jsonRequest("/api/households/household-1/grocery-requests", {
        rawText: "Doodh",
        requestedBy: "demo-cook"
      }),
      { params: Promise.resolve({ householdId: "household-1" }) }
    );

    expect(response.status).toBe(201);
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.addGroceryRequests).toHaveBeenCalledWith(
      expect.objectContaining({ householdId: "household-1", requestedBy: "demo-cook" })
    );
  });

  it("filters GET /api/households to session memberships in non-demo mode", async () => {
    mocks.prisma.household.findMany.mockResolvedValue([{ id: "household-1" }]);
    const { GET } = await import("./households/route");

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mocks.prisma.household.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { members: { some: { userId: "session-user" } } }
      })
    );
  });

  it("uses the session user as household creator in non-demo mode", async () => {
    mocks.prisma.household.create.mockResolvedValue({ id: "household-1", createdBy: "session-user" });
    const { POST } = await import("./households/route");

    const response = await POST(
      jsonRequest("/api/households", {
        name: "Spoof Test",
        createdBy: "admin-spoof",
        actorId: "admin-spoof"
      })
    );

    expect(response.status).toBe(201);
    expect(mocks.prisma.household.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdBy: "session-user",
          members: { create: { userId: "session-user", role: "ADMIN" } }
        })
      })
    );
  });

  it("rejects household-scoped GET routes for non-members", async () => {
    mocks.prisma.householdMember.findUnique.mockResolvedValue(null);
    const { GET } = await import("./households/[householdId]/carts/route");

    const response = await GET(new Request("http://localhost:3000/api/households/household-1/carts"), {
      params: Promise.resolve({ householdId: "household-1" })
    });

    expect(response.status).toBe(403);
    expect(mocks.prisma.cartDraft.findMany).not.toHaveBeenCalled();
  });

  it("rejects cross-origin mutations", async () => {
    const { POST } = await import("./households/[householdId]/cart/prepare/route");

    const response = await POST(
      jsonRequest("/api/households/household-1/cart/prepare", {}, { headers: { origin: "https://evil.example" } }),
      { params: Promise.resolve({ householdId: "household-1" }) }
    );

    expect(response.status).toBe(403);
    expect(await json(response)).toEqual({ error: "Invalid request origin" });
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it("uses the session actor for memory dismissal instead of client actorId", async () => {
    mocks.dismissMemorySuggestion.mockResolvedValue({ id: "dismissal-1" });
    const { POST } = await import("./households/[householdId]/memory/dismissals/route");

    const response = await POST(
      jsonRequest("/api/households/household-1/memory/dismissals", {
        actorId: "admin-spoof",
        suggestionKey: "DUE_SOON:milk",
        canonicalName: "milk",
        displayName: "Milk",
        suggestionType: "DUE_SOON",
        source: "learned"
      }),
      { params: Promise.resolve({ householdId: "household-1" }) }
    );

    expect(response.status).toBe(201);
    expect(mocks.dismissMemorySuggestion).toHaveBeenCalledWith(
      expect.objectContaining({ householdId: "household-1", actorId: "session-user" })
    );
  });
});

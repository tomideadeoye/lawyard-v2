import { describe, it, expect, beforeEach, vi } from "vitest";

// /auth/confirm is the endpoint every confirmation, magic-link and recovery
// email now points at. It failed silently in production once (users verified
// but signed out), so each branch is pinned here: expired token, missing token,
// recovery, successful sign-in with and without ?next, and the forwarded-host
// redirect that keeps Vercel from emitting an internal origin.

const state = vi.hoisted(() => ({
  verifyOtp: null as null | (() => Promise<{ error: { message: string } | null }>),
  user: null as { id: string } | null,
  role: null as string | null,
  verifyCalls: [] as Array<Record<string, unknown>>,
}));

vi.mock("next/server", () => ({
  NextResponse: {
    redirect: (url: string) => ({ redirectedTo: url, status: 307 }),
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      verifyOtp: async (args: Record<string, unknown>) => {
        state.verifyCalls.push(args);
        return state.verifyOtp ? state.verifyOtp() : { error: null };
      },
      getUser: async () => ({ data: { user: state.user } }),
    },
    from: () => {
      const resolved = Promise.resolve({ data: { role: state.role }, error: null });
      const chain: unknown = new Proxy(
        {},
        {
          get(_t, prop: string) {
            if (prop === "then") return resolved.then.bind(resolved);
            if (prop === "catch") return resolved.catch.bind(resolved);
            if (prop === "single") return () => resolved;
            return () => chain;
          },
        }
      );
      return chain;
    },
  }),
}));

const { handleAuthConfirm } = await import("@/lib/auth/confirm");

const BASE = "http://localhost:3111";

async function call(query: string, headers: Record<string, string> = {}) {
  const request = new Request(`${BASE}/auth/confirm?${query}`, { headers });
  const response = (await handleAuthConfirm(request)) as unknown as { redirectedTo: string };
  return response.redirectedTo;
}

beforeEach(() => {
  state.verifyOtp = null;
  state.user = null;
  state.role = null;
  state.verifyCalls = [];
});

describe("handleAuthConfirm — failure branches", () => {
  it("redirects to login with the provider's error message when one is supplied", async () => {
    const to = await call("error_code=otp_expired&error_description=Email%20link%20is%20invalid");
    expect(to).toBe(`${BASE}/login?message=Email%20link%20is%20invalid`);
  });

  it("explains a missing token instead of throwing", async () => {
    const to = await call("type=signup");
    expect(to).toContain("/login?message=");
    expect(decodeURIComponent(to)).toMatch(/missing its token/i);
  });

  it("explains an expired or already-used token", async () => {
    state.verifyOtp = async () => ({ error: { message: "Token has expired or is invalid" } });
    const to = await call("token_hash=abc&type=signup");
    expect(decodeURIComponent(to)).toMatch(/expired or was already used/i);
  });

  it("passes an unrecognised verification error through", async () => {
    state.verifyOtp = async () => ({ error: { message: "Database is on fire" } });
    const to = await call("token_hash=abc&type=signup");
    expect(decodeURIComponent(to)).toContain("Database is on fire");
  });
});

describe("handleAuthConfirm — success branches", () => {
  it("verifies the token and honours ?next=", async () => {
    const to = await call("token_hash=abc&type=signup&next=%2Fadd-listing");
    expect(to).toBe(`${BASE}/add-listing`);
    expect(state.verifyCalls[0]).toMatchObject({ type: "signup", token_hash: "abc" });
  });

  it("sends clients to search when no destination is given", async () => {
    state.user = { id: "u1" };
    state.role = "client";
    const to = await call("token_hash=abc&type=signup");
    expect(to).toBe(`${BASE}/search`);
  });

  it("sends lawyers to the dashboard", async () => {
    state.user = { id: "u1" };
    state.role = "lawyer";
    const to = await call("token_hash=abc&type=signup");
    expect(to).toBe(`${BASE}/dashboard`);
  });

  it("sends chambers to the dashboard", async () => {
    state.user = { id: "u1" };
    state.role = "chamber";
    const to = await call("token_hash=abc&type=signup");
    expect(to).toBe(`${BASE}/dashboard`);
  });

  it("routes recovery to the security tab, not the dashboard root", async () => {
    const to = await call("token_hash=abc&type=recovery");
    expect(to).toContain("/dashboard/settings?tab=security&recovery=true");
  });

  it("falls back to the dashboard when the user has no profile role", async () => {
    state.user = { id: "u1" };
    state.role = null;
    const to = await call("token_hash=abc&type=signup");
    expect(to).toBe(`${BASE}/dashboard`);
  });
});

describe("handleAuthConfirm — hardening", () => {
  it("treats an unknown otp type as a signup instead of passing it through", async () => {
    await call("token_hash=abc&type=banana");
    expect(state.verifyCalls[0]).toMatchObject({ type: "signup" });
  });

  it("accepts the legacy 'email' otp type", async () => {
    await call("token_hash=abc&type=email");
    expect(state.verifyCalls[0]).toMatchObject({ type: "email" });
  });

  it("uses the forwarded host so the redirect is not an internal origin", async () => {
    const to = await call("token_hash=abc&type=signup&next=%2Fdashboard", {
      "x-forwarded-host": "directory.lawyard.org",
    });
    expect(to).toBe("https://directory.lawyard.org/dashboard");
  });
});

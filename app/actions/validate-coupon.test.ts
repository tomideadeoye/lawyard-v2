import { describe, it, expect, beforeEach, vi } from "vitest";

// validateCoupon() decides real money and enforces the per-account cap Tobi
// asked for ("three times by an account"). It touches Supabase for the coupon
// row and for usage counts, so both are mocked here — everything else runs for
// real, including the arithmetic.

const state = vi.hoisted(() => ({
  coupon: null as Record<string, unknown> | null,
  count: 0,
  user: null as { id: string } | null,
  queried: [] as string[],
}));

/** Minimal chainable stand-in for a Supabase query builder. */
function builder(table: string, terminal: unknown) {
  const resolved = Promise.resolve(terminal);
  const proxy: unknown = new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === "then") return resolved.then.bind(resolved);
        if (prop === "catch") return resolved.catch.bind(resolved);
        if (prop === "finally") return resolved.finally.bind(resolved);
        if (prop === "single") return () => resolved;
        return () => {
          state.queried.push(`${table}.${prop}`);
          return proxy;
        };
      },
    }
  );
  return proxy;
}

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: () => ({
    from: (table: string) =>
      builder(table, table === "coupons" ? { data: state.coupon, error: null } : { count: state.count }),
  }),
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
  }),
}));

const { validateCoupon } = await import("@/app/actions/validate-coupon");

const PRICE = 100_000;

function coupon(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    code: "LAWYARD100",
    discount_type: "free",
    discount_value: null,
    max_uses: null,
    frequency_days: null,
    per_user_limit: null,
    is_active: true,
    description: null,
    ...overrides,
  };
}

beforeEach(() => {
  state.coupon = coupon();
  state.count = 0;
  state.user = null;
  state.queried = [];
});

describe("validateCoupon — basic shape", () => {
  it("rejects an unknown code", async () => {
    state.coupon = null;
    const result = await validateCoupon("NOPE", PRICE);
    expect(result).toEqual({ valid: false, message: "Invalid coupon code" });
  });

  it("is case- and whitespace-insensitive", async () => {
    const result = await validateCoupon("  lawyard100 ", PRICE);
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.code).toBe("LAWYARD100");
  });
});

describe("validateCoupon — money", () => {
  it("zeroes the price for a free coupon", async () => {
    const result = await validateCoupon("LAWYARD100", PRICE);
    expect(result).toMatchObject({ valid: true, isFree: true, finalPrice: 0, discountAmount: PRICE });
  });

  it("takes 30% off and rounds to whole naira", async () => {
    state.coupon = coupon({ code: "LAWYARD30", discount_type: "percentage", discount_value: 30 });
    const result = await validateCoupon("LAWYARD30", 99_999);
    expect(result).toMatchObject({
      valid: true,
      isFree: false,
      discountPercent: 30,
      discountAmount: 30_000, // round(99,999 * 0.3) = 30,000
      finalPrice: 69_999,
    });
  });
});

describe("validateCoupon — per-account cap (three times ever)", () => {
  it("allows a redemption below the cap", async () => {
    state.coupon = coupon({ per_user_limit: 3 });
    state.user = { id: "user-1" };
    state.count = 2;
    const result = await validateCoupon("LAWYARD100", PRICE);
    expect(result.valid).toBe(true);
  });

  it("allows exactly the last permitted redemption", async () => {
    state.coupon = coupon({ per_user_limit: 3 });
    state.user = { id: "user-1" };
    state.count = 2;
    const result = await validateCoupon("LAWYARD100", PRICE);
    expect(result.valid).toBe(true);
  });

  it("rejects the redemption after the cap", async () => {
    state.coupon = coupon({ per_user_limit: 3 });
    state.user = { id: "user-1" };
    state.count = 3;
    const result = await validateCoupon("LAWYARD100", PRICE);
    expect(result).toEqual({
      valid: false,
      message: "This coupon can only be used 3 times per account.",
    });
  });

  it("gives single-use codes their own message", async () => {
    state.coupon = coupon({ code: "LAWYARD30", per_user_limit: 1, discount_type: "percentage", discount_value: 30 });
    state.user = { id: "user-1" };
    state.count = 1;
    const result = await validateCoupon("LAWYARD30", PRICE);
    expect(result).toEqual({ valid: false, message: "This coupon has already been used by your account." });
  });

  it("refuses a per-account code for a guest", async () => {
    state.coupon = coupon({ per_user_limit: 3 });
    state.user = null;
    const result = await validateCoupon("LAWYARD100", PRICE);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.message).toMatch(/sign in/i);
  });

  it("uses the account passed by the caller, not the session", async () => {
    state.coupon = coupon({ per_user_limit: 3 });
    state.user = { id: "session-user" };
    state.count = 3;
    const result = await validateCoupon("LAWYARD100", PRICE, "submitter-1");
    expect(result.valid).toBe(false);
  });
});

describe("validateCoupon — global limits", () => {
  it("rejects once the global usage limit is exhausted", async () => {
    state.coupon = coupon({ max_uses: 10 });
    state.count = 10;
    const result = await validateCoupon("LAWYARD100", PRICE);
    expect(result).toEqual({ valid: false, message: "This coupon has reached its usage limit" });
  });

  it("still allows a redemption below the global limit", async () => {
    state.coupon = coupon({ max_uses: 10 });
    state.count = 9;
    const result = await validateCoupon("LAWYARD100", PRICE);
    expect(result.valid).toBe(true);
  });

  it("enforces the cooldown window", async () => {
    state.coupon = coupon({ frequency_days: 7 });
    state.count = 1;
    const result = await validateCoupon("LAWYARD100", PRICE);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.message).toMatch(/once every 7 days/);
  });
});

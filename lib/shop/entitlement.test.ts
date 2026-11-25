import { describe, it, expect } from "vitest";
import { ownsLegislation, isPurchasable } from "@/lib/shop/entitlement";

// The shop used to deliver <a href="#">Download PDF</a>. These are the gates that
// make a download match a payment.
const purchase = (overrides: Partial<Parameters<typeof ownsLegislation>[0][number]> = {}) => ({
  status: "success",
  plan_role: "legislation_buyer",
  metadata: { items: [{ id: "companies-and-allied-matters-act" }] },
  ...overrides,
});

describe("ownsLegislation", () => {
  it("grants access from a successful legislation purchase", () => {
    expect(ownsLegislation([purchase()], "companies-and-allied-matters-act")).toBe(true);
  });

  it("matches on slug as well as id", () => {
    const record = purchase({ metadata: { items: [{ slug: "cama" }] } });
    expect(ownsLegislation([record], "cama")).toBe(true);
  });

  it("refuses a pending payment", () => {
    expect(ownsLegislation([purchase({ status: "pending" })], "companies-and-allied-matters-act")).toBe(false);
  });

  it("refuses a payment for a different product", () => {
    expect(ownsLegislation([purchase()], "electoral-act")).toBe(false);
  });

  it("ignores transactions that are not shop purchases", () => {
    expect(ownsLegislation([purchase({ plan_role: "lawyer" })], "companies-and-allied-matters-act")).toBe(false);
  });

  it("refuses when there are no purchases at all", () => {
    expect(ownsLegislation([], "companies-and-allied-matters-act")).toBe(false);
  });
});

describe("isPurchasable", () => {
  it("only sells a legislation with a file", () => {
    expect(isPurchasable({ file_path: "cama.pdf" })).toBe(true);
    expect(isPurchasable({ file_path: null })).toBe(false);
    expect(isPurchasable(null)).toBe(false);
  });
});

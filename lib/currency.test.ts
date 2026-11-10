import { describe, it, expect } from "vitest";
import { formatNGN, parseAmount, CURRENCY } from "@/lib/currency";

// Money is formatted in one place on purpose (C20). These are the cases that
// have actually gone wrong: a dollar figure rendered as naira, and a numeric
// value passed where a string was expected.
describe("parseAmount", () => {
  it("passes numbers through", () => {
    expect(parseAmount(150000)).toBe(150000);
    expect(parseAmount(0)).toBe(0);
  });

  it("strips the symbol and thousands separators", () => {
    expect(parseAmount("₦155,000")).toBe(155000);
    expect(parseAmount("155,000")).toBe(155000);
    expect(parseAmount(" NGN 20 ")).toBe(20);
  });

  it("treats missing or junk values as zero instead of NaN", () => {
    expect(parseAmount(null)).toBe(0);
    expect(parseAmount(undefined)).toBe(0);
    expect(parseAmount("")).toBe(0);
    expect(parseAmount("₦")).toBe(0);
  });

  it("keeps a leading minus (refunds/credits)", () => {
    expect(parseAmount("-₦5,000")).toBe(-5000);
  });
});

describe("formatNGN", () => {
  it("formats with the naira symbol and no decimals", () => {
    expect(formatNGN(150000)).toBe("₦150,000");
    expect(formatNGN(100000)).toBe("₦100,000");
    expect(formatNGN(0)).toBe("₦0");
  });

  it("rounds to whole naira", () => {
    expect(formatNGN(1999.6)).toBe("₦2,000");
  });

  it("accepts an already-formatted string", () => {
    expect(formatNGN("₦155,000")).toBe("₦155,000");
  });

  it("never emits a dollar sign", () => {
    expect(formatNGN(20)).not.toContain("$");
    expect(formatNGN(20)).toBe(`${CURRENCY.symbol}20`);
  });
});

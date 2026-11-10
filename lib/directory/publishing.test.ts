import { describe, it, expect } from "vitest";
import {
  galleryCapFor,
  isPaidTier,
  canUseIntroVideo,
  TIER_RANK,
  POST_CAP_DEFAULTS,
} from "@/lib/directory/publishing";

// D2: the gallery cap existed only as a UI hint, so free accounts could exceed
// it through the chamber form. The cap function itself is what both the server
// action and the form now agree on.
describe("galleryCapFor", () => {
  it("gives free accounts the smallest ceiling", () => {
    expect(galleryCapFor(null)).toBe(3);
    expect(galleryCapFor("free")).toBe(3);
    expect(galleryCapFor(undefined)).toBe(3);
  });

  it("gives paid accounts a bigger one", () => {
    expect(galleryCapFor("premium_single")).toBe(6);
    expect(galleryCapFor("premium_package")).toBe(6);
  });

  it("gives firms the largest, regardless of tier", () => {
    expect(galleryCapFor(null, true)).toBe(12);
    expect(galleryCapFor("free", true)).toBe(12);
    expect(galleryCapFor("premium_single", true)).toBe(12);
  });

  it("is monotonic: firm >= paid >= free", () => {
    expect(galleryCapFor("premium_single", true)).toBeGreaterThan(galleryCapFor("premium_single"));
    expect(galleryCapFor("premium_single")).toBeGreaterThan(galleryCapFor("free"));
  });
});

describe("isPaidTier", () => {
  it("is false for free, empty and unknown tiers", () => {
    expect(isPaidTier(null)).toBe(false);
    expect(isPaidTier(undefined)).toBe(false);
    expect(isPaidTier("free")).toBe(false);
    expect(isPaidTier("")).toBe(false);
  });

  it("is true for premium tiers", () => {
    expect(isPaidTier("premium_single")).toBe(true);
    expect(isPaidTier("premium_package")).toBe(true);
    expect(isPaidTier("premium")).toBe(true);
  });
});

describe("canUseIntroVideo", () => {
  it("gates the intro video behind a paid tier", () => {
    expect(canUseIntroVideo("free")).toBe(false);
    expect(canUseIntroVideo(null)).toBe(false);
    expect(canUseIntroVideo("premium_single")).toBe(true);
  });
});

describe("tier ladder", () => {
  it("ranks paid tiers above free", () => {
    expect(TIER_RANK.premium_single).toBeGreaterThan(TIER_RANK.free);
    expect(TIER_RANK.premium_package).toBeGreaterThan(TIER_RANK.premium_single);
  });

  it("keeps the post caps in one place", () => {
    expect(POST_CAP_DEFAULTS.freeTotal).toBe(1);
    expect(POST_CAP_DEFAULTS.paidPerMonth).toBe(3);
    expect(POST_CAP_DEFAULTS.extraPostPrice).toBe(20000);
  });
});

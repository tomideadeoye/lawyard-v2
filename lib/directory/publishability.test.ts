import { describe, it, expect } from "vitest";
import {
  chamberPublishCheck,
  chamberIndexCheck,
  MIN_DESCRIPTION,
  MIN_MATTERS,
} from "@/lib/directory/publishability";

// A brand-new firm: just started, no matters, no reviews, no written history.
// It must still be able to exist in the directory.
const brandNew = {
  name: "Newfield Law Practice",
  location: "Lagos, Nigeria",
  focus: "Corporate, Energy & Dispute Resolution",
  description: null,
  matters: 0,
  email: null,
  phone: null,
  website: null,
  image_url: null,
  gallery_images: null,
};

describe("chamberPublishCheck — may the firm exist", () => {
  it("publishes a brand-new firm on name, location and a practice area", () => {
    expect(chamberPublishCheck(brandNew)).toEqual({
      ready: true,
      blockers: [],
      score: 1,
    });
  });

  it("accepts saved practice-area rows instead of a tagline", () => {
    const result = chamberPublishCheck({ ...brandNew, focus: null, practiceAreas: 2 });
    expect(result.ready).toBe(true);
  });

  it("does not require matters, a description, contact details or an image", () => {
    const blockers = chamberPublishCheck(brandNew).blockers.join(" ");
    expect(blockers).not.toMatch(/matter|description|contact|image/i);
  });

  it("does not require a lawyer (administrators may not be lawyers)", () => {
    expect(chamberPublishCheck(brandNew).blockers.join(" ")).not.toMatch(/lawyer/i);
  });

  it("blocks a page that is only a name", () => {
    const result = chamberPublishCheck({ name: "Nameless", location: "  ", focus: null });
    expect(result.ready).toBe(false);
    expect(result.blockers).toEqual(
      expect.arrayContaining(["Location", "At least one practice area"])
    );
  });

  it("scores partial progress for the dashboard meter", () => {
    const result = chamberPublishCheck({ name: "Firm", location: "Lagos" });
    expect(result.ready).toBe(false);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
  });
});

describe("chamberIndexCheck — is it worth a search result", () => {
  it("refuses to index a page that is only firm details", () => {
    expect(chamberIndexCheck(brandNew).ready).toBe(false);
  });

  it("indexes once there is a real description", () => {
    const result = chamberIndexCheck({ ...brandNew, description: "x".repeat(MIN_DESCRIPTION) });
    expect(result.ready).toBe(true);
  });

  it("indexes on matters without a description", () => {
    expect(chamberIndexCheck({ ...brandNew, matters: MIN_MATTERS }).ready).toBe(true);
  });

  it("still refuses a token description and two matters", () => {
    const result = chamberIndexCheck({
      ...brandNew,
      description: "We are a law firm.",
      matters: MIN_MATTERS - 1,
    });
    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/description/i);
  });
});

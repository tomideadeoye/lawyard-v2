import { describe, it, expect } from "vitest";
import { chamberPublishCheck, MIN_DESCRIPTION, MIN_MATTERS } from "@/lib/directory/publishability";

// A firm may be registered by an administrator who is not a lawyer, so a member
// lawyer is deliberately not required. These are the other gates.
const complete = {
  name: "Bloomfield Law Practice",
  description: "x".repeat(MIN_DESCRIPTION),
  location: "Lagos, Nigeria",
  focus: "Corporate, Energy & Dispute Resolution",
  email: "hello@example.com",
  phone: null,
  website: null,
  image_url: "/logo.png",
  gallery_images: null,
};

describe("chamberPublishCheck", () => {
  it("passes when every requirement is met", () => {
    const result = chamberPublishCheck(complete);
    expect(result.ready).toBe(true);
    expect(result.blockers).toEqual([]);
    expect(result.score).toBe(1);
  });

  it("does not require a lawyer (administrators may not be lawyers)", () => {
    expect(chamberPublishCheck(complete).blockers.join(" ")).not.toMatch(/lawyer/i);
  });

  it("accepts a phone number instead of an email", () => {
    const result = chamberPublishCheck({ ...complete, email: null, phone: "+234 706 100 3969" });
    expect(result.ready).toBe(true);
  });

  it("blocks a page with no contact channel at all", () => {
    const result = chamberPublishCheck({ ...complete, email: null, phone: null });
    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/contact/i);
  });

  it("blocks a description that is too short to be useful", () => {
    const result = chamberPublishCheck({ ...complete, description: "We are a law firm." });
    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/description/i);
  });

  it("accepts listed matters in place of a written description", () => {
    const result = chamberPublishCheck({ ...complete, description: null, matters: MIN_MATTERS });
    expect(result.ready).toBe(true);
  });

  it("still blocks a firm with a token description and too few matters", () => {
    const result = chamberPublishCheck({ ...complete, description: null, matters: MIN_MATTERS - 1 });
    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/description/i);
  });

  it("blocks a missing practice area and location", () => {
    const result = chamberPublishCheck({ ...complete, focus: null, location: "  " });
    expect(result.ready).toBe(false);
    expect(result.blockers).toEqual(
      expect.arrayContaining(["Location", "Practice areas"])
    );
  });

  it("accepts a gallery image in place of a logo", () => {
    const result = chamberPublishCheck({ ...complete, image_url: null, gallery_images: ["https://x/y.jpg"] });
    expect(result.ready).toBe(true);
  });

  it("blocks a page with no image at all", () => {
    const result = chamberPublishCheck({ ...complete, image_url: null, gallery_images: [] });
    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/image/i);
  });

  it("scores partial progress for the dashboard meter", () => {
    const result = chamberPublishCheck({ name: "Firm", location: "Lagos" });
    expect(result.ready).toBe(false);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
  });
});

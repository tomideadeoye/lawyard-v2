import { describe, it, expect } from "vitest"
import { effectiveTier, seatState, clampSeats, MAX_SEATS_PER_FIRM } from "./seats"

describe("effectiveTier", () => {
  it("falls back to free when neither side has a plan", () => {
    expect(effectiveTier(null, null)).toBe("free")
    expect(effectiveTier(undefined, undefined)).toBe("free")
  })

  it("gives the lawyer their own tier when the firm has none", () => {
    expect(effectiveTier("premium_single", "free")).toBe("premium_single")
    expect(effectiveTier("premium_single", null)).toBe("premium_single")
  })

  it("gives a firm seat the firm's tier when it outranks the lawyer's own", () => {
    expect(effectiveTier("free", "enterprise")).toBe("enterprise")
    expect(effectiveTier("premium_single", "premium_package")).toBe("premium_package")
  })

  it("never downgrades a lawyer who pays more than their firm", () => {
    expect(effectiveTier("enterprise", "free")).toBe("enterprise")
    expect(effectiveTier("premium_package", "premium_single")).toBe("premium_package")
  })

  it("treats unknown tiers as free", () => {
    expect(effectiveTier("gold", "enterprise")).toBe("enterprise")
    expect(effectiveTier("gold", "silver")).toBe("silver")
  })
})

describe("seatState", () => {
  it("reports room while seats remain", () => {
    expect(seatState(2, 5)).toEqual({ used: 2, limit: 5, remaining: 3, atCapacity: false })
  })

  it("is at capacity on the last seat", () => {
    expect(seatState(5, 5).atCapacity).toBe(true)
    expect(seatState(5, 5).remaining).toBe(0)
  })

  it("never reports negative room when data is already over the cap", () => {
    expect(seatState(9, 5)).toEqual({ used: 9, limit: 5, remaining: 0, atCapacity: true })
  })

  it("always allows at least one seat", () => {
    expect(seatState(0, 0).limit).toBe(1)
    expect(seatState(0, -3).limit).toBe(1)
  })
})

describe("clampSeats", () => {
  it("keeps the minimum at one", () => {
    expect(clampSeats(0)).toBe(1)
    expect(clampSeats(-4)).toBe(1)
    expect(clampSeats(Number.NaN)).toBe(1)
  })

  it("caps at the firm ceiling", () => {
    expect(clampSeats(10_000)).toBe(MAX_SEATS_PER_FIRM)
  })

  it("floors fractions", () => {
    expect(clampSeats(7.9)).toBe(7)
  })
})

import { test, expect } from "@playwright/test";

// The pages Tobi actually opens when he audits the build. Read-only: no
// submissions, no writes. If one of these is blank or 404s, the smoke run says
// so before he does.

test.describe("public pages render", () => {
  test("pricing shows plans and never sells at the placeholder price", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: /select your plan/i })).toBeVisible();

    // The dollar-era rows must be parked, not purchasable (D1).
    await expect(page.getByText("Pricing under review").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /enquire about this plan/i }).first()).toBeVisible();

    // A ₦2 / ₦20 buy button would mean the guard regressed.
    await expect(page.getByRole("button", { name: /pay|checkout|buy/i })).toHaveCount(0);
  });

  test("corporate posts lists the published post, not the empty state", async ({ page }) => {
    await page.goto("/corporate-posts");
    await expect(page.getByRole("heading", { name: "Corporate Posts", exact: true })).toBeVisible();
    await expect(page.getByText(/kredete expands stablecoin/i).first()).toBeVisible();
    await expect(page.getByText(/no corporate post articles yet/i)).toHaveCount(0);
  });

  test("corporate posts is reachable from the header nav", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation").first();
    await expect(nav.getByRole("link", { name: /corporate posts/i }).first()).toBeVisible();
  });

  test("search renders results instead of an error", async ({ page }) => {
    await page.goto("/search");
    // The results count is the signal: it only renders after the query returns,
    // so it fails if the category/role joins break again.
    await expect(page.getByText(/found\s+\d+\s+experts?/i)).toBeVisible({ timeout: 20_000 });
  });
});

import { test, expect } from "@playwright/test";
import { createTestUser, deleteTestUser, signIn, testEmail } from "./helpers/supabase";

// The partner codes Tobi asked for. Applying a coupon only reads — nothing is
// submitted and no transaction is written, so this is safe against live data.

test.describe("corporate post coupons", () => {
  test("a guest is told a per-account code needs an account", async ({ page }) => {
    await page.goto("/corporate-posts/submit");

    const input = page.getByPlaceholder(/enter coupon code/i);
    await input.fill("LAWYARD100");
    await page.getByRole("button", { name: /apply coupon/i }).click();

    await expect(page.getByText(/sign in to use it/i)).toBeVisible();
  });

  test("LAWYARD100 zeroes the price for a signed-in account", async ({ page }) => {
    const email = testEmail();
    const userId = await createTestUser(email);

    try {
      await signIn(page, email);
      await page.goto("/corporate-posts/submit");

      const input = page.getByPlaceholder(/enter coupon code/i);
      await input.fill("LAWYARD100");
      await page.getByRole("button", { name: /apply coupon/i }).click();

      await expect(page.getByText(/coupon applied: free corporate post/i)).toBeVisible();
    } finally {
      await deleteTestUser(userId);
    }
  });

  test("LAWYARD30 shows the percentage, not a free post", async ({ page }) => {
    const email = testEmail();
    const userId = await createTestUser(email);

    try {
      await signIn(page, email);
      await page.goto("/corporate-posts/submit");

      const input = page.getByPlaceholder(/enter coupon code/i);
      await input.fill("LAWYARD30");
      await page.getByRole("button", { name: /apply coupon/i }).click();

      await expect(page.getByText(/coupon applied: 30% off/i)).toBeVisible();
    } finally {
      await deleteTestUser(userId);
    }
  });

  test("an unknown code is rejected", async ({ page }) => {
    await page.goto("/corporate-posts/submit");

    await page.getByPlaceholder(/enter coupon code/i).fill("NOT-A-REAL-CODE");
    await page.getByRole("button", { name: /apply coupon/i }).click();

    await expect(page.getByText(/invalid coupon code/i)).toBeVisible();
  });
});

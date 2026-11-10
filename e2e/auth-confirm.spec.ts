import { test, expect } from "@playwright/test";
import {
  createTestUser,
  deleteTestUser,
  hasSession,
  mintTokenHash,
  signIn,
  testEmail,
} from "./helpers/supabase";

// The flow that failed silently in production: the user was confirmed in
// auth.users but never signed in. These exercise the real handler against the
// real project, with a throwaway account that is deleted afterwards.

test.describe("email confirmation", () => {
  test("a bad token lands on login with a readable reason", async ({ page }) => {
    await page.goto("/auth/confirm?token_hash=deadbeef&type=signup");
    await expect(page).toHaveURL(/\/login\?message=/);
    await expect(page.getByText(/expired or was already used/i)).toBeVisible();
    expect(await hasSession(page)).toBe(false);
  });

  test("a missing token is explained, not thrown", async ({ page }) => {
    await page.goto("/auth/confirm?type=signup");
    await expect(page).toHaveURL(/\/login\?message=/);
    await expect(page.getByText(/missing its token/i)).toBeVisible();
  });

  test("a valid token signs the user in and lands on their destination", async ({ page }) => {
    const email = testEmail();
    const userId = await createTestUser(email);

    try {
      const token = await mintTokenHash(email);
      await page.goto(`/auth/confirm?token_hash=${token}&type=magiclink`);

      await expect(page).not.toHaveURL(/\/login/);
      expect(await hasSession(page)).toBe(true);
      await expect(page).toHaveURL(/\/(search|dashboard)/);
    } finally {
      await deleteTestUser(userId);
    }
  });

  test("?next= is preserved through the confirmation hop", async ({ page }) => {
    const email = testEmail();
    const userId = await createTestUser(email);

    try {
      const token = await mintTokenHash(email);
      await page.goto(`/auth/confirm?token_hash=${token}&type=magiclink&next=%2Fpricing`);
      await expect(page).toHaveURL(/\/pricing/);
      expect(await hasSession(page)).toBe(true);
    } finally {
      await deleteTestUser(userId);
    }
  });
});

test.describe("session behaviour", () => {
  test("the dashboard is not reachable without a session", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("load");
    const url = page.url();
    const gated = /\/login/.test(url) || (await page.getByText(/sign in|log in/i).count()) > 0;
    expect(gated).toBe(true);
    expect(await hasSession(page)).toBe(false);
  });

  test("signing in grants access the dashboard previously refused", async ({ page }) => {
    const email = testEmail();
    const userId = await createTestUser(email);

    try {
      await signIn(page, email);
      await page.goto("/dashboard");
      await page.waitForLoadState("load");
      expect(await hasSession(page)).toBe(true);
      await expect(page).not.toHaveURL(/\/login/);
    } finally {
      await deleteTestUser(userId);
    }
  });
});

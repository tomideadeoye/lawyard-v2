import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

/** Minimal .env.local reader — Playwright runs in Node, the app already has these. */
function loadEnv(): Record<string, string> {
  const file = path.join(process.cwd(), ".env.local");
  const env: Record<string, string> = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error("E2E needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local)");
}

const adminHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

/** A throwaway address nobody reads. No email is sent — see createTestUser. */
export function testEmail(): string {
  return `qa-e2e-${Date.now()}@merislabs.test`;
}

/**
 * Creates an already-confirmed user, so GoTrue sends no confirmation email and
 * the Send Email hook never fires. We only need *a* valid account to sign in.
 */
export async function createTestUser(email: string): Promise<string> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      email,
      email_confirm: true,
      password: `Qa-${crypto.randomUUID()}`,
    }),
  });
  if (!response.ok) throw new Error(`create user failed: ${response.status} ${await response.text()}`);
  const user = (await response.json()) as { id: string };
  return user.id;
}

export async function deleteTestUser(id: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
}

/** Mints a one-time token_hash without emailing anything. */
export async function mintTokenHash(email: string, type: "magiclink" | "signup" = "magiclink"): Promise<string> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ type, email }),
  });
  if (!response.ok) throw new Error(`generate_link failed: ${response.status} ${await response.text()}`);
  const link = (await response.json()) as { hashed_token?: string };
  if (!link.hashed_token) throw new Error("generate_link returned no hashed_token");
  return link.hashed_token;
}

/** Signs the page in through the real /auth/confirm handler. */
export async function signIn(page: Page, email: string): Promise<void> {
  const token = await mintTokenHash(email);
  await page.goto(`/auth/confirm?token_hash=${token}&type=magiclink`);
  await page.waitForLoadState("load");
}

/** True when the browser holds a Supabase session cookie. */
export async function hasSession(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
}

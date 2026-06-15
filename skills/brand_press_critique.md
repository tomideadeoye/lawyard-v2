# Brand Press System - Senior Engineer Critique

A senior engineer review of the Brand Press architecture and implementation (`docs/brand-press-summary.md`, `app/api/upload/brand-press/route.ts`, `app/(main)/brand-press/submit/page.tsx`, and `app/actions/brand-press.ts`).

## 1. Security & Abuse Vectors (Critical)

### A. Unauthenticated Endpoints without Rate Limiting
- **The Issue**: The `app/api/upload/brand-press/route.ts` endpoint requires no authentication. Even with size limits (<= 500KB) and type checks, a malicious actor could write a script to continuously hit this endpoint, exhausting the Supabase storage limits and performing a Denial of Service (DoS) attack.
- **The Fix**: Implement strict rate limiting (e.g., via Upstash Redis or memory-based rate limiting per IP). Additionally, wrap the submission and upload flows with a CAPTCHA (e.g., Cloudflare Turnstile or Google reCAPTCHA v3) to ensure requests are driven by human users.

### B. Missing Server-Side Schema Validation
- **The Issue**: In `app/actions/brand-press.ts`, the code correctly validates the price on the server, but manual checks like `if (!title || !content...)` are used for fields. Client-side Zod validation can easily be bypassed via direct API requests (e.g., Postman).
- **The Fix**: Extract the Zod `brandPressSchema` into a shared file (e.g., `lib/validations/brand-press.ts`) and use `brandPressSchema.safeParse()` on the server side to validate the incoming `FormData` structurally before interacting with the database.

### C. Client-Side Price Manipulation (Critical Vulnerability)
- **The Issue**: Both the brand-press submission flow (`app/actions/brand-press.ts`) and the shop checkout action (`app/actions/shop.ts`) trust client-submitted prices directly. 
  - In `brand-press.ts`, `final_price` is parsed from the form data and used for the Paystack payment amount.
  - In `shop.ts`, the prices of the legislation items in `cartItems` are summed directly to determine `totalAmount`.
  - In both cases, a user can modify the request payload or intercept client-side variables to checkout products at arbitrary prices (e.g. ₦1).
- **The Fix**: Never trust pricing parameters sent from the client. Perform all price calculations (and coupon discount computations) on the server using stable database records or server-side config files (e.g., `LEGISLATIONS` configuration in `lib/legislations.ts` or `brand-press.json` config) based solely on item IDs.

### D. Row-Level Security (RLS) Bypass via Service Role
- **The Issue**: The public `submitBrandPress` action bypasses Row Level Security by constructing a `createServiceRoleClient()`. This opens up the database to unvetted insertions from public clients.
- **The Fix**: Configure native Supabase RLS policies to allow inserts by unauthenticated (`anon`) users with strict column-level validation rather than calling the super-user service role key.

### E. Inconsistent Guest Upload Authentication
- **The Issue**: The Brand Press submit form allows guest (unauthenticated) submissions. However, the image upload API route `/api/upload/brand-press/route.ts` requires an authenticated session (`supabase.auth.getUser()`) and attempts to compile the file path using `user.id`. This results in `401 Unauthorized` crashes for any guest users trying to upload featured images.
- **The Fix**: Align guest policies. Allow unauthenticated uploads to the bucket with unique filename generation (e.g. random UUIDs) rather than relying on a user session ID.

## 2. Database Atomicity & Data Integrity

### A. Orphaned Articles on Payment Failure
- **The Issue**: In `submitBrandPress`, the article is inserted first. If the subsequent `transactions` insert fails, the action returns an error, but the article remains in the database in a `pending_review` state without a corresponding transaction.
- **The Fix**: Use a Supabase RPC (PostgreSQL function) to insert both the article and transaction in a single atomic database transaction. Alternatively, add a `catch` block that explicitly deletes the created article if the transaction insertion fails.

### B. Hardcoded Guest ID vs. Nullable Fields
- **The Issue**: Migration `20260615000003_guest_brand_press.sql` implies `author_id` is nullable, but the server action hardcodes a specific UUID (`GUEST_USER_ID = '6b80d2f0-31b6-4239-81ec-889c3fa0c4b0'`). If this UUID is ever deleted from the `users` table, all guest submissions will fail due to foreign key constraints.
- **The Fix**: Rely on the migration's intent. Pass `null` to `author_id` for guest submissions and use a boolean flag or the `category` column to designate it as guest content.

## 3. React / Next.js Client Anti-Patterns

### A. Mixing React Hook Form (RHF) with Multiple `useStates`
- **The Issue**: The documentation boasts reducing state from "18 useStates → 11", but using 11 separate `useState` hooks alongside React Hook Form is an anti-pattern. Variables like `content` (from the Tiptap editor), `featuredImage`, and `scheduledDate` duplicate the source of truth and circumvent RHF's internal state management.
- **The Fix**: Use RHF's `<Controller />` wrapper or `setValue` / `watch` for custom components. This brings all form state under one `data` object, allows Zod to validate the rich text and image directly, and eliminates the need to manually construct `FormData` in the `onSubmit` handler.

### B. Static Import of Window-Dependent Components (TipTap SSR)
- **The Issue**: `app/(main)/brand-press/submit/page.tsx` statically imports `RichTextEditor`, which contains the TipTap editor. Since TipTap references browser-only objects like `window` and `document` on initial render, this component will trigger hydration mismatches or compilation errors during Next.js Server-Side Rendering.
- **The Fix**: Import TipTap editor components dynamically with server-side rendering disabled:
  ```typescript
  import dynamic from 'next/dynamic'
  const RichTextEditor = dynamic(
    () => import('@/components/brand-press/rich-text-editor').then(m => m.RichTextEditor),
    { ssr: false }
  )
  ```

### C. Next.js Try-Catch Redirect Swallowing
- **The Issue**: Inside server actions in `app/admin/actions.ts`, calls to functions that perform authorization checks (e.g. `getAdminClient()`) are wrapped inside `try...catch` blocks. Because `redirect()` in Next.js works by throwing a special `NEXT_REDIRECT` exception, the try-catch block catches the redirect exception, logs a console error, and silently swallows the redirect.
- **The Fix**: Catch and rethrow redirect errors in all server actions:
  ```typescript
  import { isRedirectError } from 'next/dist/client/components/redirect'
  
  try {
    // action logic
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Failed to execute action:", error);
  }
  ```

## 4. Next.js Routing & Middleware

### A. Incomplete Middleware Guard Coverage
- **The Issue**: The middleware config defines `matcher: ['/admin/:path*']`. This matches all nested sub-routes of `/admin` (e.g. `/admin/lawyers`) but fails to match the bare root `/admin` path. An unauthenticated user can load the dashboard path directly without triggering the edge routing guards.
- **The Fix**: Update the matcher array to cover both root and sub-paths:
  ```typescript
  export const config = {
    matcher: ['/admin', '/admin/:path*'],
  }
  ```

### B. Database Query Performance Bottleneck in Middleware
- **The Issue**: On every matched admin request, the middleware executes a database query (`supabase.from('profiles').select('role')`) to verify that the user's role is `admin`. This introduces substantial database query latency for simple page transitions and asset loads.
- **The Fix**: Store user roles directly in custom user metadata claims within the Supabase auth JWT, allowing the middleware to verify permissions instantly from the token header without database round-trips.

## 5. Operational Overhead

### A. Garbage Collection for "Pending" States
- **The Issue**: Users who generate an invoice or close the Paystack popup leave articles stuck in `pending_payment` or `pending` state permanently.
- **The Fix**: Set up a Supabase `pg_cron` job or an Edge function on a schedule to automatically hard-delete `brand_press` transactions and articles that have remained in a `pending` state beyond a specific threshold (e.g., 24 hours).


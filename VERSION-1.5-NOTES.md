# Mr LapShop — Version 1.5 notes

## Goal
Establish the Supabase-backed commerce and identity foundation while preserving the Version 1.4 storefront. Public customers can register/sign in or use guest checkout; the shop remains controlled by one manually provisioned owner account.

## What changed

- Supabase SSR clients for browser and server use, cookie-based session persistence and Next.js 16 `proxy.ts` refresh.
- Customer registration, email verification callback, login, account overview, order history and marketing email preference control.
- A distinct private `/admin/login` and `/admin` area. Membership in `admin_users` is checked on the server. Public sign-up never grants admin access.
- `/cart` is now a local persisted shopping cart; the previous WhatsApp enquiry list is preserved at `/enquiry`.
- `/checkout` collects guest/customer contact details and delivery/pickup/payment choices when the store has configured them.
- `/order/[orderNumber]` displays an order confirmation to the signed-in customer or the guest browser holding the HTTP-only tracking token.
- A single migration creates the Postgres schema, indexes, RLS policies, storage bucket and database order functions.
- `place_order` treats the database as the source of truth for product prices, stock and delivery fees. It locks stock, snapshots the purchased item data and calculates totals server-side.

## What is deliberately not activated

- The Supabase project has not been created/connected from this environment. No credentials were supplied or committed.
- The migration has not been run against a database.
- The only catalogue entries are illustrative samples without real product UUIDs, prices or stock. They cannot be purchased.
- `store_settings.checkout_enabled` defaults to false. Delivery and payment methods default to disabled until approved and configured by the owner.
- Product/category CRUD screens, order-management operations, image upload UI, full MFA challenge enforcement, marketing email sending/unsubscribe links and transactional notification delivery remain future work.

## Original owner tasks / current status

1. [x] Create the Supabase development project `mr-lapshop-dev`.
2. [x] Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in local `.env.local`.
3. [x] Apply and verify the five migrations now recorded in the cloud project. See `SUPABASE_SETUP.md` for current filenames.
4. [ ] Configure Auth email confirmation and `/auth/callback` redirect URLs.
5. [ ] Register/verify the owner email and run `supabase/OWNER_BOOTSTRAP.sql`.
6. [ ] Enable/test TOTP MFA for the owner.
7. [ ] Approve delivery, payment, advance, pickup, cancellation, return/refund and warranty rules before switching checkout on.
8. [ ] Configure a verified email sender before marketing campaigns or order notification emails are sent.

## QA evidence

- Archive integrity and project contents inspected.
- Source-level review completed for route changes, server actions, RLS policies and database RPC definitions.
- TypeScript/TSX syntax transpile scan passed for 56 files with zero syntax diagnostics.
- Local `@/` import-path audit, package JSON validation, checkout initialization-order check and core SQL safety-invariant checks passed.
- Supabase SSR setup follows current official guidance for cookie-based sessions and Next.js 16 `proxy.ts`.
- Full `tsc --noEmit`, ESLint, Vitest, Next.js build and Playwright tests are not verified: the archive has no `node_modules`, and npm registry access timed out during dependency installation.
- The SQL migration has not been executed on Supabase. Do not treat this milestone as production-ready until dependencies install, the migration runs cleanly and database security tests pass.

## Superseded backend connection status

As of 11 November 2026, `mr-lapshop-dev` has been connected and the five cloud migrations have been applied and verified. See the current `SUPABASE_SETUP.md` and `SUPABASE-CLOUD-SETUP-REPORT.md`; do not follow the earlier “create project/apply migration” instructions above. Owner Auth registration/bootstrap and business checkout policies are still pending.

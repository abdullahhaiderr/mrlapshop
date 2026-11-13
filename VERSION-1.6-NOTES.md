# Mr LapShop — Version 1.6 notes

## Goal
Turn the Version 1.5 owner dashboard foundation into a practical single-owner operations workspace for product/category maintenance, order handling and internal fulfilment, without activating unapproved checkout rules or touching production.

## Implemented

- Protected dashboard layout and navigation at `/admin`.
- Shared server-only `requireStoreOwner()` helper used by the dashboard layout and every server mutation.
- Product list, filters, create/edit forms, draft/publish/archive workflow, SKU, stock, price and warranty fields.
- Publish guard: an active listing requires an owner-entered positive price and a warranty duration/decision. Archive is preferred over hard delete to preserve references.
- Product photo upload/removal using the existing public Supabase Storage bucket. JPEG, PNG and WebP are allowed; file signatures are checked and the file size is capped at 8 MB. Next Server Action body limit is set to 9 MB for multipart overhead.
- Category create/edit, group, display order and active/inactive state. Existing categories are not hard-deleted.
- Order desk with filtering, customer and item snapshots, fulfilment/payment state updates.
- Internal laptop preparation checklist (OS, drivers, updates, requested apps, final test) and private fulfilment note.
- Registered customer table with email verification and a separate marketing-consent indicator.
- Recent owner activity view at `/admin/activity`.
- Append-only application audit table for owner actions.
- Additive migration `20261111161059_mr_lapshop_admin_operations.sql`.

## Not activated / not complete

- Supabase has not been connected from this environment; no credentials were supplied.
- Neither migration has been executed against the owner's development Supabase project here.
- Public storefront pages still use the static Version 1.5 demonstration catalogue. Integrating the public shop with the database is a subsequent milestone.
- Store settings and checkout activation are intentionally not exposed here. Delivery/fee, advances, pickup, bank instructions, cancellations, returns/refunds and warranties still need final owner approval.
- Marketing email sending and transactional mail are not implemented.
- Full TOTP MFA enforcement is not implemented in the app; it must be configured and tested in Supabase Auth.

## Security notes

- No service-role key is introduced.
- Every owner page/server action checks the Supabase session and the `admin_users` owner row.
- RLS remains mandatory for tables and Storage.
- Customer pages cannot access order fulfilment notes or audit history.
- Uploaded images are restricted by MIME and magic bytes, maximum size and storage RLS.
- Audit history captures application actions, not an immutable database-level forensic ledger.

## QA status

- Source tree and current V1.5 implementation inspected.
- TypeScript/TSX syntax parse: 72 files, zero parse diagnostics.
- Local alias/relative import audit: zero unresolved project imports.
- Product publication and image signature helper checks: 6 of 6 manual runtime checks passed.
- Package JSON parsed successfully.
- `npm install` was attempted but timed out while reaching the package registry. Full `tsc --noEmit`, ESLint, Vitest, Next build and browser QA therefore remain unverified and must be run locally or in an environment with registry access.
- Database migrations, RLS tests, storage upload tests and owner/customer access tests require the actual development Supabase project and must be completed before the milestone can be called fully verified.

## Next milestone proposal

Connect the public storefront to real Supabase catalogue records (homepage, shop filters, product detail pages, product image galleries and live stock states), then complete customer-facing order tracking/address experience. Do not enable production checkout until owner settings and real inventory are approved.

# Mr LapShop security baseline

Version 1.5 establishes the Supabase security baseline. The development backend must be configured and every control below verified before production launch.

## Identity and access
- [x] Supabase Auth foundation with public customer registration/login and guest checkout.
- [x] Exactly one manually allowlisted owner role; no staff/manager role or public owner-registration route.
- [x] `/admin` verifies the authenticated user against the `admin_users` owner allowlist; database writes are restricted by owner RLS.
- [ ] Extend owner guards to every future admin mutation and verify them with integration tests.
- [ ] Enforce MFA for the owner account where supported by the selected provider and plan.
- [x] Initial RLS policies are included for profiles, owner records, categories, products, product images, addresses, orders, order items, newsletter records and store settings.
- [ ] Apply the migration to the development project and execute positive/negative RLS tests.

## Customer and commerce data
- [ ] Public can read active products/categories and approved public reviews only, using the selected provider's authorization model.
- [ ] Public cannot read orders, customer contact/address data, private notes, audit events or pending/rejected reviews.
- [x] Order creation is restricted to a server-side database function with validated inputs.
- [x] Product prices, stock and delivery fees are read from database records; client prices/totals are ignored.
- [x] Stock rows are locked and decremented in the order transaction.
- [ ] Add explicit idempotency keys and test retries/double submission before launch.
- [x] Guest order tracking uses an unguessable token and returns limited order data; the token is stored in an HTTP-only cookie.
- [ ] Add rate-limit monitoring and negative integration tests for guest tracking.
- [ ] Reviews require a verified completed purchase and are hidden until owner approval.
- [x] Account marketing consent is optional, timestamped and editable; unverified emails are excluded from the owner opt-in count.
- [ ] Select a mailing provider, implement verified double opt-in where appropriate, unsubscribe links and bounce/complaint handling before sending campaigns.

## Input, files and abuse controls
- [ ] Zod validation for all public forms and owner mutations.
- [ ] Rate limits for login, checkout, tracking, contact, review and promo-code endpoints.
- [ ] Honeypot and CAPTCHA/Turnstile-ready protections for public forms.
- [ ] Image upload allowlist (JPEG/PNG/WebP), size limit, file-signature checks, random names and EXIF stripping.
- [ ] Sanitize any rich text before rendering; avoid unsafe HTML injection.

## Secrets, transport and privacy
- [x] The current app does not require a service-role key; it uses a publishable key with RLS and server-side scoped functions.
- [ ] Reassess secrets if a future integration requires privileged credentials; keep them server-only.
- [ ] No credentials or secrets committed to Git or client bundles.
- [ ] HTTPS, secure cookies and documented security headers/CSP.
- [ ] Do not log customer phone numbers, addresses, bank details or full request bodies.
- [ ] Privacy page explains the minimum customer data collected and how it is used.
- [ ] Document backup, key rotation and incident response procedures.

## Verification before launch
- [ ] npm run lint, npm run type-check, npm run test and npm run build pass.
- [ ] RLS tests pass for anonymous users, a normal customer and the single owner-admin account.
- [ ] Owner-only route and mutation tests pass.
- [ ] Forged prices/discounts, invalid quantities, double-submit and concurrent stock tests pass.
- [ ] Unverified review submission and access to private customer/order data are rejected.
- [ ] Oversized or disguised executable uploads are rejected.
- [ ] Responsive, keyboard and accessibility testing completed.
- [ ] Production environment variables reviewed and deployment approved by owner.


## Version 1.6 owner dashboard controls

- Owner dashboard routes and all Server Actions re-check the session and `admin_users` role on the server; client-side navigation is not authorization.
- Product image uploads are limited to JPEG, PNG and WebP, checked against file signatures, limited to 8 MB and written only to the owner-managed Storage bucket.
- Product archive and category deactivation are preferred over hard deletion to preserve order and catalogue references.
- Customer views do not expose `order_fulfilment_checks` or `admin_audit_log`; both tables are owner-only under RLS.
- The audit log is an application activity record, not an immutable forensic ledger.
- The Next.js Server Action request limit is 9 MB to allow multipart overhead for the capped 8 MB image upload.


## Version 1.7 public catalogue and customer address controls
- Public catalogue queries request only `status = active` products and active categories; database RLS remains the enforcement boundary. The server data loader does not use a service-role key.
- Product image URLs are generated from the public `product-images` bucket. Only authorised owner actions may upload or remove product image records/files.
- Customer address reads and mutations require an authenticated user and are scoped to that user's `user_id`; database RLS independently restricts row access.
- Saved address fields are validated server-side and revalidated for checkout after changes.
- Browser cart state is advisory only. The order RPC remains responsible for authoritative product price, stock locks and totals. Demo or unpriced products are blocked from the checkout UI and must also be rejected by the database function.
- If the live catalogue query fails, the UI falls back to clearly labelled demo preview data rather than silently presenting the preview as live inventory.
- Live security testing is still pending until the owner connects the development Supabase project.

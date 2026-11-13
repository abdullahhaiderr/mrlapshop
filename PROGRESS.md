# Mr LapShop project progress

## Version 1.7 — Live storefront and customer shopping experience

### Implemented in source
- [x] Added server-side public catalogue loader for active Supabase products and active categories, with explicit live, empty, preview and connection-warning states.
- [x] Connected homepage featured product cards to the live catalogue while preserving existing section order and homepage service section.
- [x] Connected `/shop` to live products/categories with search, category, brand, condition, price, CPU, RAM, storage and in-stock filters; sorting and 12-item client-side pagination are included.
- [x] Added live product detail pages by slug, dynamic metadata, product specification and warranty display, stock state, related products and ordered image gallery.
- [x] Added live product purchase gating; sample items, missing prices, zero stock and insufficient stock remain non-orderable.
- [x] Reconciled browser cart rows against the current active catalogue before allowing checkout navigation.
- [x] Added customer saved-address book with create/edit/delete/default selection, server-side validation and user-scoped writes.
- [x] Added signed-in checkout address selector with saved-address population.
- [x] Added order progress presentation for delivery and pickup, including terminal order states.
- [x] Applied the requested premium translucent white frosted-glass header treatment while retaining sticky navigation.
- [x] Preserved the existing homepage services section markup and copy.
- [x] Updated package version and Version 1.7 documentation.

### Not done / intentionally gated
- [x] Connected to the owner's `mr-lapshop-dev` Supabase project (PostgreSQL 17) and verified the active/healthy project.
- [x] Applied and verified five cloud migrations; local migration filenames now match the remote migration history.
- [x] Configured `.env.local` with the project URL and publishable key; the file is excluded from Git.
- [x] Created 12 application tables, seeded 12 categories, created the `product-images` Storage bucket and verified all application tables have RLS enabled.
- [x] Hardened owner policies, removed public owner helper, restricted anonymous table grants and revoked execution of trigger-only functions.
- [ ] Real product records, images, prices, stock and warranty details must be entered before publication.
- [ ] Checkout remains disabled by default pending owner-approved delivery, pickup, payment, advance, cancellation, returns/refunds and warranty terms.
- [ ] The catalogue currently loads up to 250 active products per request; filters/sorting/pagination run client-side over this loaded set.
- [ ] Transactional and promotional email delivery are not included.
- [ ] Full TypeScript semantic checking, ESLint, Vitest, Next.js production build and Playwright remain unrun because package dependencies/browser execution are unavailable in this workspace.
- [x] Live database schema, migration history, application table counts, RLS settings, anonymous grants, Storage bucket, checkout gate and Supabase health/security/performance advisors were inspected.

### Decisions preserved
- Exactly one private owner account; no staff/manager accounts.
- Customers may register/login or checkout as guests.
- WhatsApp enquiry remains separate at `/enquiry`; `/cart` is a real shopping cart.
- Product conditions: New, Used and Open Box only.
- Never invent product specifications, prices, stock, warranty, delivery fees or policies.
- Marketing consent is optional and separate from account creation or order communications.
- Keep the existing homepage services section and page design intact; the only requested global visual change in this milestone is the translucent white header.

### Next milestone candidate
Version 1.8: verified-purchase reviews and moderation, promotion/discount configuration and customer engagement. Select and configure an email provider and verified sending domain before sending campaigns.

---


## Version 1.6 — Owner operations dashboard

### Implemented in source
- [x] Protected owner dashboard shell and navigation for Overview, Products, Categories, Orders and Customers.
- [x] Added shared server-only owner guard for dashboard routes and server actions.
- [x] Added product inventory list, text/status filtering, create/edit, price/stock/specification/warranty fields and safe archive workflow.
- [x] Added a publish gate requiring a confirmed positive price and warranty decision.
- [x] Added private product image upload/removal through Supabase Storage with image signature validation, JPEG/PNG/WebP types, 8 MB file limit and matching server-action body limit.
- [x] Added category create/edit, grouping, ordering and active/inactive controls.
- [x] Added order desk, detail view, order/payment state updates and internal device preparation checklist.
- [x] Added registered-customer overview with email verification and marketing consent shown separately.
- [x] Added application audit log records for owner catalogue and order actions.
- [x] Added additive migration `supabase/migrations/20261111161059_mr_lapshop_admin_operations.sql`.
- [x] Updated setup, README, security, owner-input and QA documentation for Version 1.6.

### Not implemented / intentionally staged
- [x] Supabase development project connection and migrations are complete.
- [ ] Public homepage/shop/product pages still use the demonstration catalogue; database-backed public catalogue integration is the next milestone.
- [ ] Store settings UI and checkout activation are still blocked pending approved delivery/payment/policy decisions.
- [ ] Marketing campaigns, unsubscribe delivery and transactional order emails need a verified mail provider.
- [ ] Full in-app TOTP MFA challenge enforcement remains pending.
- [ ] Full dependency-based build and browser tests need an environment with installed dependencies and Supabase credentials.

### Decisions preserved
- Exactly one private owner account; no staff/manager accounts.
- Public customers can register/login; guest checkout is allowed.
- WhatsApp enquiry remains separate at `/enquiry`; `/cart` is the shopping cart.
- Product conditions: New, Used and Open Box only.
- Never invent product specs, prices, stock, warranty, delivery fee or policies.
- Publishing a product requires a real price and explicit warranty decision.
- Deactivate/archive categories/products rather than deleting records that may be referenced.
- Customer marketing consent is distinct from account creation and purchases.

### Next milestone
Version 1.7 proposal: connect the public catalogue, homepage, search, shop filters, product detail/gallery and stock states to Supabase records; complete customer-facing order tracking and customer address experience. Checkout stays disabled until approved store rules and real product data are configured.

---


## Version 1.5 — Supabase commerce and customer-account foundation

### Implemented in source
- [x] Added Supabase SSR browser/server clients and Next.js 16 `proxy.ts` session refresh.
- [x] Added `.env.example` for the project URL and publishable key; no service-role key is used by current application code.
- [x] Added a numbered Supabase migration for profiles, owner allowlist, categories, products, images, customer addresses, orders, order items, marketing consent records and checkout settings.
- [x] Added RLS policies for public active catalogue reads, customer-owned profile/address/order access and owner-only management.
- [x] Added one-owner bootstrap SQL; owner role is not assignable through public registration and a unique index prevents a second owner.
- [x] Added public customer registration/login routes with email-confirmation callback and an optional marketing-consent checkbox.
- [x] Added customer account overview, order history and email-preference controls.
- [x] Added private owner login/dashboard foundation with server-side owner allowlist verification.
- [x] Split the previous WhatsApp enquiry list to `/enquiry`; `/cart` is now a separate browser-persisted shopping cart.
- [x] Added a checkout form supporting guest details, delivery/pickup fields and configured payment methods.
- [x] Added a server-side `place_order` database function that reads prices/stock from Postgres, locks stock rows, computes totals and creates order/item snapshots transactionally.
- [x] Added guest order tracking via a random bearer token held in an HTTP-only cookie and RLS-protected customer order detail pages.
- [x] Added account-level opt-in/out preferences and only counts email-verified opted-in customers in the owner overview.
- [x] Documented Supabase project setup, auth redirects, owner bootstrap, checkout activation and remaining launch decisions.

### Important safety gates
- [x] The migration starts with checkout disabled, delivery disabled and payment methods disabled.
- [x] Sample catalogue products remain non-orderable because they have no live product UUID, confirmed price or stock.
- [x] The order function rejects checkout until the owner configures checkout, fulfilment and payment settings.
- [x] The app environment is configured for the connected development project.
- [x] Initial schema and owner-operations migrations are applied and hardened in the live development database.
- [ ] Owner email is not yet supplied and the owner allowlist row has not been provisioned.
- [ ] Owner MFA enforcement, verified SMTP, marketing campaign provider, unsubscribe delivery and final order policies remain pending.

### Verification status
- [x] ZIP archive integrity and project structure inspected.
- [x] Source-level review of route separation, form validation, RLS, owner role and order RPC performed.
- [x] TypeScript/TSX syntax transpile scan: 56 files, zero syntax diagnostics.
- [x] Local `@/` import-path audit: all checked paths resolve.
- [x] Package JSON, checkout initialization order and core SQL safety invariants: passed static checks.
- [x] Supabase SSR implementation matched to the current official Next.js 16 guidance.
- [ ] Full `tsc --noEmit` is blocked because this extracted archive has no `node_modules`; module/type declarations for Next.js, React, Supabase, Zod, Vitest and Playwright are unavailable. `npm install` timed out while reaching the package registry.
- [ ] ESLint, Vitest, Next.js production build and Playwright browser tests remain unrun until dependencies are installed locally.
- [x] SQL migrations have been applied to Supabase; schema, role grants, RLS, Storage and the checkout gate were inspected live.

### Decisions carried forward
- Supabase is the selected backend. Development project name: `mr-lapshop-dev`.
- Exactly one private owner account; no staff/manager roles. Public customer registration and login are allowed.
- Guest checkout is allowed; account creation is optional.
- WhatsApp is customer support/enquiry, not the only order path.
- Promotional email requires separate explicit consent and is not implied by registration or purchase.
- Delivery fees, advances, payment instructions, cancellation/return/refund terms and warranty policy must be owner-approved before checkout activation.

### Exact next steps
1. Configure Auth email confirmation and local/production redirect URLs in Supabase Dashboard.
2. Register and verify the owner email, then run `supabase/OWNER_BOOTSTRAP.sql` to grant the single owner role.
3. Enable/test TOTP MFA and configure a verified SMTP sender.
4. Enter real product data and obtain approval for delivery/payment/return/warranty policies before enabling checkout.
5. Install dependencies locally and run lint, type-check, tests, build and Playwright.

## Version 1.4 — Product details and browser shopping tools

### Done in source
- [x] Added static sample product detail pages for each of the six demo laptop listings.
- [x] Product cards now link to their product page and include Add to enquiry and Wishlist controls.
- [x] Added browser-persisted enquiry list and wishlist state using localStorage with defensive parsing and storage-failure handling.
- [x] Added live counts to header wishlist and enquiry-list icons.
- [x] Added an enquiry summary that builds a WhatsApp message for selected items, while clearly stating that it is not an order or payment.
- [x] Added product detail actions for enquiry list, wishlist and direct WhatsApp question.
- [x] Added catalogue sort options for featured, name, brand and condition.
- [x] Corrected the unconfirmed Acer label on the sample Chromebook; it is now listed as a generic Chromebook sample device.
- [x] Removed Acer from the brand-mark map and corrected brand test expectations.
- [x] Added Playwright coverage for the homepage, product page, enquiry list and wishlist.
- [x] Updated package version and README to 1.4.0.

### Verification completed
- [x] JSON/package manifest validation.
- [x] Static source review for product routes, provider wiring and localStorage access boundaries.
- [x] Source assertions for six demo products, valid unique slugs, allowed conditions and confirmed brand labels.
- [ ] Full TypeScript type-check and lint require npm dependencies.
- [ ] Vitest, production build and Playwright browser execution are not run yet because `node_modules` is absent and registry access has not been confirmed.
- [ ] Local visual check at mobile/tablet/desktop sizes is still required.

### Not implemented (requires owner decision/backend)
- [ ] Persistent backend/database and secure product/category CRUD.
- [ ] One-owner admin login/dashboard and image upload storage.
- [ ] Real prices, stock, accessory inventory, order management and payment confirmation.
- [ ] Actual cart, checkout, order creation and tracking. The Version 1.4 enquiry list is not checkout.
- [ ] Written customer reviews, verified-purchase checks and moderation.
- [ ] Promo codes, giveaway management and opt-in customer notifications.
- [ ] Production contact-form delivery, rate limits and anti-spam.

### Decisions and constraints
- One owner admin only; no staff/manager accounts.
- Phone and WhatsApp remain the same: 0328 1133770.
- Sale conditions are New, Used and Open Box only; refurbished products are not sold.
- Confirmed brands/device types: Apple, HP, Dell, Lenovo, ASUS and Chromebooks. A Chromebook sample is treated as a device type, not an invented Acer model.
- Warranty remains product/unit-specific.
- YouTube customer-video entries remain manually configured in `src/config/customer-video-reviews.ts`, independent of the dashboard.
- Supabase is the selected and connected backend for the development project.
- Advance payment, cancellation fee, delivery, return and refund terms require final owner approval before live checkout.
- The browser enquiry/wishlist data is local to the browser and is not stored in a server database.

### Exact next steps
1. Owner runs `npm install`, `npm run type-check`, `npm run lint`, `npm run test`, `npm run build`, then `npm run dev`.
2. Inspect `/`, `/shop`, each `/product/[slug]`, `/cart` (enquiry list) and `/wishlist` at mobile and desktop widths.
3. Confirm backend provider and budget using `VERSION-1.3-OWNER-CHECKLIST.md`.
4. After backend confirmation, implement the persistent database and one-owner dashboard, then replace demo data and local-only lists with secure server-backed flows.

## Version 1.3 — Storefront polish and content wiring

### Done in source
- [x] Added a YouTube customer-video section driven by `src/config/customer-video-reviews.ts`, independent of dashboard/backend code.
- [x] Supported watch, youtu.be, Shorts, embed and live URL formats with privacy-enhanced embed URLs.
- [x] Consolidated the phone/WhatsApp number to 0328 1133770.
- [x] Added YouTube, Instagram and TikTok links to the utility strip, footer and contact page.
- [x] Added brand marks for Apple, HP, Dell, Lenovo, ASUS and Chromebook.
- [x] Added the homepage Google Maps iframe, store details and directions link.
- [x] Added soft card shadows, hover lift and reduced-motion support.

### Verification and limits
- [x] TypeScript/TSX syntax scan and standalone YouTube URL checks were performed in the previous version.
- [ ] npm install, lint, full type-check, unit tests, production build and browser checks have not been demonstrated as passing.
- [ ] No GitHub push or Vercel deployment has been performed.


# Mr LapShop — Version 1.7 release notes

**Milestone:** Live catalogue and customer shopping experience  
**Base:** Version 1.6 source  
**Package:** 1.7.0  
**Database migration:** No additional schema migration for the storefront itself. Cloud setup now includes five recorded migrations, including RLS hardening and anonymous grants.

## Delivered in source

### 1. Live public catalogue
- Added a server-side catalogue data layer that reads only active products and active categories visible through Supabase RLS.
- Product rows are mapped to the existing storefront card/detail model without changing the stored product records.
- Product image rows are converted to public URLs from the `product-images` bucket and ordered by their configured position.
- Homepage featured products now come from the database when configured. If no product is marked featured, the homepage shows the available active products rather than a fabricated featured set.
- If Supabase is not configured, the existing six sample entries remain available and are explicitly marked as preview records. If the connection fails, the preview state includes a connection warning. A connected but empty catalogue displays an honest empty state.

### 2. Shop search, filters and discovery
- Added database-backed active product/category loading for `/shop`.
- Search across brand, title, category and visible specification text.
- Filters for category, brand, condition, minimum/maximum price, processor text, RAM, storage and in-stock status.
- Sorting by featured, newest, price low-to-high, price high-to-low and name.
- Pagination at 12 items per page and query-string state for sharing the current filter selection.
- Invalid query values are bounded/whitelisted before being passed to the client catalogue UI.

### 3. Dynamic product detail and gallery
- `/product/[slug]` resolves active product records from the public catalogue and generates product metadata from the selected item.
- Displays verified database fields only: product description, specs, condition, published price, compare-at price where valid, stock, warranty text and related active products.
- Added a selectable image gallery using ordered product image records, with a neutral fallback and an explicit missing-photo note for live products.
- Product add-to-cart action appears only for live, priced, in-stock records. Preview records and unavailable products stay on the enquiry/support path.

### 4. Cart reconciliation
- The browser cart is joined against the currently active public catalogue on each cart render.
- Demo products, unavailable products, missing products, unpriced records and insufficient stock cannot pass the client readiness gate for checkout.
- Final order validation remains the server-side `place_order` database function; client cart state is not trusted for price/stock calculation.

### 5. Customer address book and order progress
- Added `/account/addresses` for signed-in customers to add, edit, delete and set a default address.
- Server actions validate inputs and scope writes to the authenticated `user_id`; RLS remains the database boundary.
- Checkout receives the signed-in customer's saved addresses and can populate contact/delivery fields from a selected address.
- Customer order confirmation now displays a delivery or pickup progress sequence and indicates terminal statuses (cancelled, return requested, returned, refunded) without inventing timestamps.

### 6. Header polish and design preservation
- Header is now translucent white (`rgba` white layer) with blur/saturation, a restrained border and soft shadow for a premium frosted-glass appearance. Its opacity is deliberately low enough to show subtle page content behind the white glass while preserving navigation contrast.
- Sticky behaviour, header content and navigation structure are retained.
- Existing homepage service section markup and copy were preserved. Other existing design sections were not redesigned as part of this milestone.

## Known limitations and gates

- The Supabase development project is now connected. Five migrations have been applied and the schema, RLS, Storage bucket, anonymous privileges and checkout gate have been live-inspected. Auth redirects, owner bootstrap, SMTP and real customer/product workflows are still pending.
- The catalogue loader currently reads at most 250 active products per request; filter/sort/pagination are client-side across that loaded set. For much larger inventories, add database-side filtering and pagination.
- Checkout remains disabled by default in `store_settings`. Real published inventory, fulfilment/payment settings and approved order terms are required before a purchase can be completed.
- The six sample products are preview-only and are not orderable.
- No new SQL migration was needed for Version 1.7.
- No transactional or marketing email delivery was added in this release.
- The header effect and responsive layouts need browser screenshot review on the owner's machine; no claim of visual browser QA is made here.

## Owner actions needed

1. Review Auth email confirmation and local/production `/auth/callback` redirect URLs in Supabase Dashboard.
2. Register and verify the one owner email, then run `supabase/OWNER_BOOTSTRAP.sql` once to grant the owner role.
3. Enable/test owner TOTP MFA and configure verified SMTP.
4. Add real catalogue products with confirmed price, stock, photos and warranty decisions before publishing.
5. Confirm delivery, pickup, payment, advance, cancellation, return/refund and warranty terms before enabling checkout.

## Next milestone candidate

Version 1.8 can focus on verified-purchase written reviews and moderation, promotional-code configuration and customer engagement flows. Email campaign delivery still depends on a selected provider, verified sending domain and explicit customer consent.

## Supabase cloud handoff update

The actual `mr-lapshop-dev` project has been provisioned with all five migrations and verified. See `SUPABASE-CLOUD-SETUP-REPORT.md` for table counts, RLS, public grants, Storage, checkout state and advisor results. The local migration files and Supabase CLI project reference are synchronized with the cloud project.

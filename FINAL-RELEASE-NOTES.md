# Mr LapShop — Final pre-deployment candidate (2.0.0)

This release candidate incorporates the owner's final pre-launch decisions while preserving the existing storefront layout and the homepage Services section. It is a pre-deployment package, not a production deployment. The connected Supabase project has ten recorded migrations; the final four migrations were applied during this finishing pass.

## Final changes

- Replaced the opaque white-tinted navigation treatment with a translucent smoky-gray glass header, blur, subtle border and matching mobile navigation.
- Added a continuously moving right-to-left Latest Arrivals marquee driven only by real, active, in-stock Supabase products, sorted newest first. It pauses on hover/focus and disables automatic motion for reduced-motion preferences.
- Added The Beast Collection for owner-selected, active, in-stock higher-performance/upgraded devices. The owner selects a product with the new "Show in The Beast Collection" checkbox in product create/edit.
- Updated checkout to submit a pending order request rather than representing a completed online payment. It collects customer, fulfilment and preferred payment method details.
- Added JazzCash, Easypaisa and UBL Bank as preferred payment methods. Payment instructions/account credentials are intentionally not displayed or collected.
- The order page clearly explains that the shop will call/WhatsApp to confirm availability and final charges, and that full 100% payment must be received and verified before the order is confirmed or processed.
- Delivery fees are now flagged as pending until quoted by the shop; they are not represented as free delivery. Pending requests do not decrement inventory.
- Added server-side order notification email integration targeting mrlapshop@gmail.com. It uses Resend and requires server-only configuration described below.
- Updated owner order screens to show selected payment method and delivery-fee quote status.

## Supabase changes

The connected project `mr-lapshop-dev` has these migrations recorded:

- `20261111160822_restrict_public_execute_on_rls_event_function`
- `20261111161040_mr_lapshop_initial_store_schema`
- `20261111161059_mr_lapshop_admin_operations`
- `20261111161351_harden_owner_rls_and_database_indexes`
- `20261111161520_limit_anonymous_table_privileges`
- `20261111171616_mr_lapshop_final_order_request_flow`
- `20261111172047_mr_lapshop_final_checkout_and_beast_collection`
- `20261111172422_mr_lapshop_require_full_payment_before_confirmation`
- `20261111172729_mr_lapshop_quote_delivery_before_confirmation`
- `20261111173032_mr_lapshop_guest_tracking_delivery_fee_status`

The latest database migration adds `products.performance_pick`, `orders.delivery_fee_pending`, sets the delivery fee to NULL until the shop quotes it, and updates the order-request RPC to use the current policy. It does not create sample products or customer accounts. The owner-only confirmation trigger now also requires a delivery quote before a delivery order can enter processing.

## Email notification setup required before live deployment

The code attempts to send an email through Resend after the order request has been committed to Supabase. Add these values in the Vercel project environment settings (Production and Preview as appropriate):

- `ORDER_NOTIFICATION_EMAIL=mrlapshop@gmail.com`
- `RESEND_API_KEY=<your Resend API key>`
- `RESEND_FROM_EMAIL=<a sender address verified in Resend>`

Do not place the Resend API key in a `NEXT_PUBLIC_` variable, client component, repository or ZIP notes. Without the API key and a verified sender, the order request is still saved in Supabase, but the email will not be sent. Test an actual request after configuring the provider.

## Payment and order safety

- The website does not collect wallet PINs, bank credentials, card details or payment proof.
- The payment choice is a preference only; the shop provides instructions after contacting the customer.
- `payment_status` remains pending and `payment_required_before_confirmation` remains true until the shop verifies the full amount.
- New requests do not reserve or subtract stock. Re-check stock with the customer before payment and confirmation.
- For delivery requests, the product subtotal is provisional until delivery charges are quoted. The current total shown excludes a pending delivery charge.

## Asset note

JazzCash, Easypaisa and UBL brand images are sourced from Wikimedia Commons files whose pages identify the source brand websites/authors. Their trademarks remain with their owners; see `PAYMENT-LOGO-SOURCES.md`. No account numbers, IBANs, wallet IDs or bank details are shown.

## Existing design preserved

The homepage Services section content and structure were not intentionally modified. No other service/about/footer content was redesigned in this finishing pass.

Latest migration: `20261111173032_mr_lapshop_guest_tracking_delivery_fee_status`.


## 2.0.1 visual / deployment patch

- The homepage header is fully transparent over the hero on initial page load, then switches to the existing smoke-glass style once the visitor scrolls.
- Inner pages retain the existing sticky glass header for legibility.
- Added `DEPLOYMENT-GUIDE-VERCEL.md` for GitHub, Vercel, `mrlapshop.pk`, Supabase redirect URLs and Resend email notifications.
- This is a source/packaging patch only. Run the documented Preview and Production checks before publishing.


## 2.0.2 homepage layout and video fix

- Fixed the Next.js build error `Export Youtube doesn't exist in target module` by removing the unsupported `Youtube` icon import from `lucide-react` and using the supported `PlayCircle` icon instead.
- Added four owner-supplied YouTube Shorts links to `src/config/customer-video-reviews.ts`; Shorts are rendered in portrait frames through the existing privacy-enhanced embed URL helper.
- Added an automatic six-image laptop carousel inside the homepage hero image frame. It cross-fades every 4.8 seconds, keeps a stable square frame and pauses automatic changes when the visitor prefers reduced motion.
- Added gentle vertical floating motion to both hero information cards, also disabled for reduced-motion preferences.
- Reworked the desktop header row into aligned logo / navigation / action columns, reduced control widths and increased visual spacing so the search field and icons stay in their own header lane. Tablet and mobile layouts retain the responsive menu.
- The customer video list is not currently administered through the dashboard. Add or replace individual video URLs in `src/config/customer-video-reviews.ts`, then commit and redeploy. See `YOUTUBE-VIDEO-SETUP.md`.

The owner provided four Shorts URLs in this request (not five or six). Four are included. Additional individual video URLs can be appended to the same configuration array.

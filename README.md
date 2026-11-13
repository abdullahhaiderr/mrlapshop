# Mr LapShop — Final pre-deployment candidate 2.0.2

Mr LapShop is a Next.js storefront for new, used and open-box laptops, accessories, and laptop repair/upgrade services in Rawalpindi. The connected backend is Supabase PostgreSQL.

This is a final review package, not a deployed or fully production-verified release. Keep Version 1.7 as a backup until this package passes your local and Vercel Preview checks.

## Final additions

- Fully transparent homepage header over the hero, changing to the existing smoky-gray glass treatment after scrolling; desktop navigation is grid-aligned and compact on tablet/mobile.
- Automatic cross-fade carousel in the hero laptop image frame using the six supplied local laptop visuals; the floating hero cards gently animate and respect reduced-motion preferences.
- Fixed the homepage video-section build error by removing the unsupported `Youtube` export from `lucide-react`.
- Added the four owner-supplied YouTube Shorts links in `src/config/customer-video-reviews.ts`; all four parse as valid 11-character YouTube IDs.
- A continuous right-to-left Latest Arrivals carousel populated only from live, published, in-stock laptop products. It pauses while hovered/focused and respects reduced-motion settings.
- The Beast Collection for live, in-stock performance/upgraded laptops. Select products for the collection with the checkbox in the owner product editor.
- A complete order-request form. Customers choose delivery or pickup, enter their contact details, select JazzCash, Easypaisa or UBL Bank as a preferred payment method, and submit a pending request.
- No online wallet/bank payment is collected. The shop contacts the customer, confirms availability and the final amount, shares payment instructions through WhatsApp, and verifies full payment before confirming or processing the order.
- Delivery fees are quoted by the shop. The product subtotal is provisional until that quote is entered.
- New order requests are stored in Supabase. Inventory is not reduced at request submission; stock is checked and deducted atomically when the owner moves a new order into processing after marking full payment verified and entering any delivery charge.
- Order notification email integration targets `mrlapshop@gmail.com` through Resend. This requires server-only credentials and a verified sender before email notifications will send.
- The existing homepage Services section and the rest of the existing site sections are preserved.

## Technology

- Next.js 16 / React 19
- TypeScript
- Supabase Auth, PostgreSQL, Row Level Security and Storage
- Vercel deployment target

## Getting started

1. Install Node.js 20.9 or newer.
2. Copy `.env.example` to `.env.local` and enter the project URL and publishable Supabase key.
3. Configure the order-email variables as described in `FINAL-RELEASE-NOTES.md` (the Resend secret must remain server-only).
4. Run `npm install`.
5. Run `npm run dev` and review the site at `http://localhost:3000`.
6. Run the QA commands in `DEPLOYMENT-CHECKLIST.md` before creating a Vercel production deployment.

## Environment variables

Required for live Supabase catalogue, authentication and order requests:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Required for automatic order email notifications:

- `ORDER_NOTIFICATION_EMAIL=mrlapshop@gmail.com`
- `RESEND_API_KEY` (server-only)
- `RESEND_FROM_EMAIL` (a sender address verified with Resend)

Without the Resend variables, the order request still saves to Supabase, but the email is not sent. Never expose the Resend key or a Supabase service-role/secret key in a `NEXT_PUBLIC_` variable.

## Order and payment policy

Submitting checkout creates a pending order request, not a confirmed order. The selected payment option is a preference only. The shop contacts the customer via phone/WhatsApp and provides payment instructions separately. One hundred percent of the agreed final amount must be received and verified before the order can be confirmed or processed. No JazzCash PIN, Easypaisa PIN, bank login, IBAN/account credentials or card data are collected on the site.

## Supabase migrations

The connected development project `mr-lapshop-dev` has ten migrations recorded. See `SUPABASE_SETUP.md` for the migration history and live database notes. Do not re-run migrations in the SQL Editor if they already appear in the project's migration history.

## Handoff documents

- `FINAL-RELEASE-NOTES.md` — final changes and known configuration gaps.
- `DEPLOYMENT-CHECKLIST.md` — required checks before production.
- `PAYMENT-LOGO-SOURCES.md` — sources and notes for the three payment brand marks.
- `QA_REPORT.md` — verification performed and work still pending.
- `YOUTUBE-VIDEO-SETUP.md` — where to add/replace individual customer video links.
- `SUPABASE_SETUP.md` — connected project and migration history.
- `SUPABASE-CLOUD-SETUP-REPORT.md` — earlier cloud setup details.
- `OWNER-INPUTS.md` — confirmed business requirements.


## Final deployment

See [DEPLOYMENT-GUIDE-VERCEL.md](./DEPLOYMENT-GUIDE-VERCEL.md) for Vercel deployment, the `mrlapshop.pk` DNS connection, Supabase Auth redirects, and Resend order-notification configuration. The homepage header is transparent at scroll-top and changes to smoke glass after scrolling; other routes retain the sticky glass header. The Customer Stories video list is code-configured in `src/config/customer-video-reviews.ts` in this release (not editable from the admin dashboard).

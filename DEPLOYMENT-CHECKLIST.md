# Mr LapShop 2.0 — Final deployment checklist

## Supabase and authentication

- [ ] Confirm all ten migrations in `SUPABASE_SETUP.md` are present in `mr-lapshop-dev`. Do not run already-applied migration SQL again.
- [ ] Confirm database health advisor has no errors and review the security advisor warnings for public `SECURITY DEFINER` order and tracking RPCs.
- [ ] Add/verify guest-order rate limiting and anti-bot protections before public production traffic.
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel. Never expose a service-role or secret key to the browser.
- [ ] Finish Supabase Auth provider, email confirmation, production Site URL and exact `/auth/callback` redirect URL.
- [ ] Register and verify the intended owner email, run `supabase/OWNER_BOOTSTRAP.sql`, verify exactly one owner and test owner MFA.

## Order email notifications

- [ ] Set `ORDER_NOTIFICATION_EMAIL=mrlapshop@gmail.com`.
- [ ] Create/configure Resend and verify a sender domain/address.
- [ ] Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` as server-only Vercel environment variables (never use `NEXT_PUBLIC_`).
- [ ] Confirm a test order request arrives in mrlapshop@gmail.com. Without Resend configuration, the order saves but the email notification is not sent.

## Catalogue and business setup

- [ ] Add real products with accurate model, specs, price, condition, warranty, stock and photos. Sample cards are not orderable.
- [ ] Mark only selected live, in-stock high-performance/upgraded laptops for The Beast Collection.
- [ ] Verify delivery coverage and use the owner order screen to record the quoted delivery fee before processing a delivery order.
- [ ] Keep payment account details absent until you approve the exact account information and authorized brand assets.
- [ ] Confirm final cancellation, return/refund, warranty and delivery terms before publishing those policies.

## Homepage, hero and customer video QA
- [ ] Confirm desktop header logo, navigation, search and action icons are aligned without overlapping the hero laptop or hero copy.
- [ ] Confirm the homepage header starts fully transparent and switches to smoky glass after scrolling; verify the inner pages remain readable.
- [ ] Confirm the laptop image frame automatically cross-fades between six laptop images, with stable dimensions and no layout shift.
- [ ] Confirm both hero floating cards animate gently and stop animating when reduced motion is enabled.
- [ ] Confirm the four Shorts links from `src/config/customer-video-reviews.ts` render as portrait embeds and each video allows embedding in YouTube Studio.
- [ ] Remember: customer video links are code-configured in this version, not managed in the owner dashboard. After changing the array, commit and redeploy.

## Code and browser QA

- [ ] Copy `.env.example` to `.env.local` locally and enter the local development values.
- [ ] Run `npm install`.
- [ ] Run `npm run type-check`, `npm run lint`, `npm run test` and `npm run build`.
- [ ] Run Playwright or equivalent browser smoke tests for desktop and mobile.
- [ ] Test header contrast on the hero and over light page sections; test mobile drawer and keyboard navigation.
- [ ] Test Latest Arrivals continuously scrolls right-to-left, pauses on hover/focus and respects reduced motion.
- [ ] Test Beast Collection empty state and owner selection checkbox.
- [ ] Submit a test pickup and delivery request with live test products. Confirm it appears in the owner dashboard, remains pending, and does not reduce stock.
- [ ] Try to process an order with payment pending; database must reject it. Try to process a delivery order with a missing fee; database must reject it.
- [ ] Mark the test order paid/verified, enter delivery quote (if delivery), then confirm. Verify stock decreases exactly once.
- [ ] Verify order email and guest order tracking.
- [ ] Check responsive layouts, links, forms, product galleries, cart and wishlist.

## Launch

- [ ] Set `NEXT_PUBLIC_SITE_URL` to the final production domain.
- [ ] Take/export a database backup before production launch.
- [ ] Deploy to Vercel Preview first, verify environment variables and logs, then deploy Production only after all checks pass.

**This ZIP has not been deployed to Vercel.** The website does not process online payments; the shop collects and verifies the full payment separately after contacting the customer.


## Final transparent-header patch and domain launch

- [ ] Homepage header is completely transparent over the hero at scroll-top.
- [ ] Homepage header becomes the existing smoky-glass style after scrolling.
- [ ] Non-homepage routes retain the sticky glass header.
- [ ] Follow `DEPLOYMENT-GUIDE-VERCEL.md` to push the project to a private GitHub repo and import it into Vercel.
- [ ] Set Production `NEXT_PUBLIC_SITE_URL` to `https://mrlapshop.pk`.
- [ ] Add both `mrlapshop.pk` and `www.mrlapshop.pk` to Vercel and configure the canonical redirect.
- [ ] Copy the exact DNS records shown by Vercel into the DNS manager for the registrar/provider where the domain is hosted. Do not remove email MX/TXT records.
- [ ] Set Supabase Authentication Site URL and Redirect URLs for the production domain.
- [ ] Verify a sending subdomain in Resend, then set the Resend environment variables and test delivery to `mrlapshop@gmail.com`.
- [ ] Complete production build, browser, customer account, guest order-request, owner authorization, and payment-policy smoke tests before launch.

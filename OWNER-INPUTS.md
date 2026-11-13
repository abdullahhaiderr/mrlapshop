# Mr LapShop — remaining owner inputs

The following decisions or facts are still needed before the backend, checkout and production launch. Confirmed details have already been entered into `src/config/store.ts`.

## Already supplied and entered
- Store name: Mr LapShop
- Tagline: Your next laptop. Expert care. One local team.
- Phone and WhatsApp: 0328 1133770
- Address and Google Maps link
- Opening days and hours
- Instagram, TikTok and YouTube links
- Laptop brands/categories: Apple MacBook, HP, Dell, Lenovo, ASUS and Chromebooks
- Conditions sold: new, used and open box only
- Accessory groups: headphones/headsets, microphones, keyboards, mice, gaming consoles and other accessories
- Repair and support services
- Payment/collection choices: Cash on Delivery, bank transfer and shop pickup
- Admin model: one account only for the shop owner; no staff accounts

## Supabase project status
- [x] `mr-lapshop-dev` exists and is active/healthy (PostgreSQL 17, project ref `tgoqtjyobpkopwqwqeft`).
- [x] Five migrations applied and recorded in cloud migration history.
- [x] Twelve public application tables created with RLS enabled; 12 categories seeded.
- [x] Product image bucket created with owner-only write access.
- [x] Project URL and Publishable key configured in local `.env.local` (the file is Git-ignored).
- [ ] Owner email must be supplied; owner must register and verify that email, then run `supabase/OWNER_BOOTSTRAP.sql` with the exact email. No Auth user or password was created by SQL.
- [ ] Enable/test authenticator-app MFA for the owner.
- [ ] Configure Auth email confirmation and the local `/auth/callback` redirect in Supabase Auth.
- [ ] Configure verified SMTP before relying on confirmation/reset emails or marketing sends.

## Marketing email provider (before sending campaigns)
- Choose an email delivery provider and verify a sending domain. The app currently records optional marketing consent but does not send promotional campaigns yet.
- Approve the newsletter/marketing wording, double-opt-in approach, unsubscribe link and bounce/complaint handling.

## New customer commerce features
- Public customer accounts with email verification and password login.
- Guest checkout without account creation.
- Separate shopping cart (`/cart`) and WhatsApp enquiry list (`/enquiry`).
- Customer order history and private order detail access.
- Optional marketing consent stored separately from transactional order communications.

## Product data to enter in dashboard
For every actual product/unit:
- Brand, model, product title and category.
- Exact configuration (processor/chip, generation, RAM, storage, display, GPU, OS, ports and other relevant fields).
- Condition: New, Used or Open Box.
- Unit-specific warranty duration and terms, with optional category-level defaults.
- Price, optional compare-at/discount price, available quantity and listing status.
- Product photos, alt text and preferred image order.
- Optional battery/physical-condition notes for used and open-box units.

The six laptop records in this preview are examples only. No actual stock, exact specifications, prices or warranty terms are asserted.

## Before checkout goes live
- Delivery cities, courier method, fees, estimated delivery times and any remote-area rules.
- Bank account/payment instructions for bank transfer and how payment confirmation will be recorded.
- Final advance-payment rule: owner discussed Rs. 1,000 or Rs. 2,000, or 20% in advance with the remaining balance on receipt. Confirm whether these are alternatives, when each applies, and what happens if payment is not completed.
- Confirm the exact meaning of shop pickup (reservation, payment timing and pickup hours).
- Final written return, replacement, cancellation and refund policy. A possible Rs. 1,000–1,500 cancellation fee was discussed, but exact amount, eligibility, exemptions and refund timing are not approved yet.
- Warranty wording by product/category, including start date, coverage and exclusions.

## Before public engagement features
- Send individual YouTube customer-video URLs (one URL per video, not only the channel link), with customer permission to embed each video on the website. These are added in `src/config/customer-video-reviews.ts`, independently of the admin dashboard.
- Review rules: confirm whether reviews should be available only after an order is marked delivered (recommended for verified-purchase reviews).
- Notification channel: WhatsApp, email or both; obtain customer opt-in and provide unsubscribe controls for marketing campaigns.
- Giveaway eligibility, dates, prize handling and winner-selection rules before any giveaway is published.

## Not required
- No staff or manager accounts. Exactly one shop-owner administrator is planned; public customer accounts are allowed.
- No customer online card gateway is required for the current stated payment choices.


## Version 1.6 owner dashboard data needed
- [x] Create/connect the `mr-lapshop-dev` Supabase project and apply the versioned database migrations.
- [ ] Provide the owner login email for the one-owner bootstrap (never provide a password).
- [ ] Supply real product records, verified model/specification details, prices, stock, photos and unit warranty decisions before publishing.
- [ ] Approve the delivery/payment/advance/pickup/cancellation/return/refund policy before activating checkout.
- [ ] Choose a verified email service and sending domain before activating marketing or order email delivery.


## Version 1.7 live catalogue setup
- [x] Configure the `mr-lapshop-dev` Supabase Project URL and Publishable key in local `.env.local`.
- [x] Apply and record the five migrations. Do not manually re-run any applied migration.
- [ ] Bootstrap the one owner account, verify its email and enable authenticator-app MFA.
- [ ] Enter confirmed product details, images, selling price, compare-at price (if genuine), quantity and unit-specific warranty; publish only after all are checked.
- [ ] Review the transparent white header at mobile, tablet and desktop sizes after running the local app.
- [ ] Confirm checkout policies before enabling orders: delivery areas/fees/timing, pickup process, payment options and bank-transfer verification, advance-payment rules, cancellation, returns/refunds and warranty terms.

## Version 1.7 known limitation
The live catalogue loader currently reads up to 250 active products per request and filters the loaded result in the browser. This is appropriate for the initial inventory. Plan server-side search/filter pagination if the shop catalogue grows substantially.


## Confirmed final order policy (November 11, 2026)

- Customer checkout is an order request form, not a payment gateway.
- Preferred methods: JazzCash, Easypaisa, UBL Bank transfer. Do not publish account details yet.
- Shop contacts the customer through phone/WhatsApp to confirm stock, share device photos/shop location and provide payment instructions.
- 100% of the final amount must be received and verified before the order is confirmed or processed.
- New requests are stored in Supabase as pending; they do not reduce stock at submission.
- Delivery charge is quoted after request; do not present the current provisional subtotal as a final delivered total.
- Order notification destination: mrlapshop@gmail.com. Email provider credentials/sender verification remain to be configured.
- Header direction: smoky gray transparent glassmorphism.
- Homepage additions: live Latest Arrivals continuous marquee and separate Beast Collection.

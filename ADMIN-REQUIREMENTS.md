# Mr LapShop — owner dashboard specification

This document defines the private dashboard for the single shop owner and the public customer account system. Version 1.5 adds the Supabase schema and role boundary. Version 1.6 implements core product/category/order/customer operations; advanced marketing, store settings and campaign delivery remain staged.

## Access model

- Exactly one administrator: the shop owner.
- Public customer registration and login are enabled separately from the owner role. Guest checkout is also supported.
- Exactly one owner account is manually allowlisted in `admin_users`; customer registration never assigns owner permissions. No staff or manager accounts exist.
- Owner and customer sessions use Supabase Auth. The owner identity is checked on the server and again by RLS/database policies.
- Every dashboard data read and mutation checks the authenticated owner. Hiding a button is not authorization.
- MFA is recommended and should be enforced where supported by the confirmed authentication provider and plan.

## Version 1.6 delivered screens

- `/admin` — overview and recent orders.
- `/admin/products` and `/admin/products/new` plus `/admin/products/[id]` — owner inventory CRUD, draft/publish/archive, product image upload/removal.
- `/admin/categories` — category creation, editing, ordering and activation.
- `/admin/orders` and `/admin/orders/[orderNumber]` — order/payment state operations and private fulfilment checklist.
- `/admin/customers` — registered customer records, verification and marketing preference status.
- `/admin/activity` — recent application-recorded owner activity.

## Dashboard navigation

1. **Overview** — order summary, orders needing attention, low-stock products, recently updated listings and pending reviews.
2. **Products** — add, edit, duplicate, archive, publish, unpublish, search and filter products; quick stock and price editing.
3. **Categories & brands** — create, edit, reorder, hide and publish product categories and brand entries.
4. **Orders** — order details, customer delivery/pickup information, payment method, advance received, remaining balance, payment confirmation and order status.
5. **Customers** — basic customer contact/order history for service and order fulfilment; marketing consent is stored separately and is not implied by a purchase.
6. **Reviews** — pending, approved and rejected reviews; open review details, verify the related delivered order, approve or reject, and optionally record a moderation note.
7. **Discounts & promo codes** — fixed amount or percentage, start/end date, eligible category/product, minimum spend, redemption limit, per-customer limit, active/paused state.
8. **Giveaways** — title, prize, eligible category/product, start/end dates, entry rules, participants, winner selection and winner record.
9. **Customer notifications** — compose a discount or store update, choose a channel, select eligible opted-in contacts, preview, send/test, and record campaign delivery status and unsubscribe.
10. **Store settings** — shop name/tagline, phone/WhatsApp, address, map URL, hours, social links, delivery and pickup settings, supported payment methods and owner-approved policy content.
11. **Audit log** — record security-relevant owner actions such as price changes, stock changes, publishing, refund/payment state changes and review moderation.

## Product editor requirements

Each product record should support:

- Product type: laptop or accessory.
- Brand, series, model, display title, slug and product category.
- Condition enum: `new`, `used`, `open_box` only.
- Laptop technical fields: processor/chip, generation, RAM size/type, storage size/type, display size/resolution, touch, convertible/2-in-1, graphics, operating system, ports/connectivity and weight where supplied.
- Accessory-specific fields where appropriate: type, compatibility, connection, colour, included items and key specifications.
- Physical/battery notes for used and open-box units.
- Price in integer PKR, optional compare-at price, quantity, SKU, availability and listing status.
- Multiple images with upload validation, ordering and alt text.
- Featured flag and concise/long description.
- Category default warranty plus product-level warranty override. The owner must be able to set the exact warranty duration and wording for every listing/unit.
- No product may be published without an owner-entered model/title, category, condition, price, stock state and warranty decision. Required specs should be validated according to product type.

## Order and payment workflow

Owner-provided payment/collection options are Cash on Delivery, bank transfer and shop pickup. The final delivery-city list, fees, courier times and bank-transfer instructions must be entered in settings before checkout is activated.

The owner has discussed possible advances of Rs. 1,000, Rs. 2,000 or 20%, with the balance collected on receipt. These are not yet an approved rule. Build the checkout settings so the owner can activate a fixed amount or percentage, define when it applies and set the remaining-balance collection point only after confirming the final policy.

The owner has discussed a possible Rs. 1,000–1,500 cancellation fee and wants to help customers with cancellations/returns. Do not publish that range as a final charge. Store only an approved final policy and apply it consistently after owner confirmation.

Suggested order statuses: `new`, `confirmed`, `awaiting_advance`, `payment_confirmed`, `packed`, `dispatched`, `ready_for_pickup`, `delivered`, `cancelled`, `return_requested`, `returned`, `refunded`.

## Review workflow

- A customer can submit a review only for a product in an order associated with their verified contact details.
- Recommended launch rule: permit review only after the order is marked delivered or picked up.
- One review per eligible order item unless the owner chooses a different policy.
- New reviews enter `pending`; they never appear publicly by default.
- Owner can approve or reject. Only approved reviews are visible on product pages and public review summaries.
- Store verification state and moderation timestamps; do not fabricate review content or ratings.

## Customer marketing and giveaway safeguards

- Buying a product does not automatically subscribe a customer to marketing.
- Account sign-up includes a separate optional email-marketing consent checkbox; the consent timestamp is recorded. A customer can change the preference from their account.
- Only email-verified customers with an active opt-in are eligible for promotional email. Guest newsletter sign-up and campaign sending require a verified mail provider and unsubscribe workflow before launch.
- Campaign audience selection includes only opted-in customers for the selected channel.
- Every campaign message includes a clear opt-out method.
- A giveaway requires owner-defined dates, eligibility, prize, entry method, winner selection and record of the selected winner before publication.

## Store fulfilment notes

The owner wants purchased laptops prepared before handover: operating system installation/setup, every required driver, updates and initial software setup. The order record should support an internal fulfilment checklist (OS installed, drivers installed, updates run, requested apps installed, final test completed). This checklist is internal and must not imply that an item is completed until the owner marks it done.


## Version 1.7 public catalogue connection
- Active product/category records are read by the public homepage, shop and product-detail routes. Draft and archived products remain private.
- Product images are ordered by the image `position` field and exposed through the public `product-images` bucket only when their parent product is public.
- Product publication requires the owner's verified title/specifications, condition, price, stock and warranty decision. The app does not convert the six preview records into database inventory.
- The public shop currently loads a maximum of 250 active products per request; client filters/search/sorting/pagination apply to this loaded set.
- Customer address-book data is private to the customer account. Owner dashboard access does not imply marketing consent.

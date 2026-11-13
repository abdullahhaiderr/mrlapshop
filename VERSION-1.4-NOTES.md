# Mr LapShop Version 1.4.0 — Release notes

## Scope
Version 1.4 completes the sample-catalogue browsing journey without selecting or connecting a backend provider. It is deliberately a frontend milestone.

## User-facing changes
- Each of the six sample laptops has a detail route under `/product/[slug]`.
- Product tiles link to the detail page rather than jumping directly to WhatsApp.
- Customers can save sample items to a wishlist in the current browser.
- Customers can add sample items to an enquiry list and send one combined product enquiry to the shop via WhatsApp.
- Header counts reflect saved wishlist and enquiry-list items.
- Catalogue sorting is available by featured order, name, brand and condition.
- The demo Chromebook is no longer assigned to Acer because the owner did not confirm Acer as a brand stocked by the shop.

## Important limitations
- The enquiry list is not a cart, checkout, reservation or purchase order.
- No price, discount, stock quantity, shipping fee or warranty terms have been invented.
- Wishlist and enquiry-list data are stored in localStorage and stay on one browser/device only.
- The six products and their images remain sample data.
- The YouTube customer-video block remains a manually configured section and is independent of the future owner dashboard.
- Written customer reviews and admin moderation are not implemented in this version.
- No backend provider has been selected or connected. No owner dashboard has been implemented.

## Verification
- `npm install` was attempted but timed out while resolving packages from the npm registry.
- Global TypeScript was available to run a static syntax transpilation pass; a full project type-check could not pass because Next.js, React, lucide-react, Playwright and Vitest dependencies are not installed.
- Vitest, ESLint, the Next.js production build and Playwright browser tests were therefore not run.
- Local responsive/browser testing remains required after `npm install` succeeds on the owner's Windows machine.

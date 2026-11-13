# Mr LapShop — Owner inputs for the next backend milestone

Version 1.4 is frontend-only. The following owner decisions unlock the persistent catalogue, owner-only dashboard and actual checkout.

## 1. Backend and budget (required first)
- [ ] Choose Railway PostgreSQL + Cloudflare R2, Appwrite, or self-hosted VPS.
- [ ] Confirm a monthly budget range.
- [ ] Confirm who will own billing and receive service alerts.
- [ ] Create only a development project at first. Do not put secrets in GitHub or chat.

## 2. Owner account
- [ ] Provide the owner's login email (not a password).
- [ ] Confirm MFA by authenticator app.
- [ ] There will be exactly one owner account; there are no staff accounts.

## 3. Order and delivery rules
- [ ] Confirm delivery cities/areas, fees and timing.
- [ ] Confirm when COD is offered and whether any advance is required.
- [ ] Confirm if the advance is fixed at Rs. 1,000, Rs. 2,000, or 20%, and who decides which option applies.
- [ ] Confirm bank-transfer verification steps and who marks payment as confirmed.
- [ ] Confirm shop-pickup flow.
- [ ] Approve exact cancellation, return, replacement and refund terms, including the final cancellation fee and timelines.

## 4. Product information
The owner can add inventory after the dashboard exists. For the first real listings, prepare any available:
- Brand/device type, exact model and unique SKU/serial reference where appropriate.
- New, Used or Open Box condition only.
- CPU, RAM, storage, screen, GPU and OS where relevant.
- Used/open-box cosmetic grade and battery condition.
- Price, stock quantity, photos and unit-specific warranty details.

## 5. Reviews and campaigns
- [ ] Confirm verified-purchase review eligibility (recommended: order must be marked Delivered).
- [ ] Approve the review fields and moderation workflow.
- [ ] Define discount-code rules and giveaway eligibility/prize/closing date.
- [ ] Confirm marketing channel and opt-in wording before customer notifications are enabled.

## 6. Local test before backend work
On Windows in VS Code, run:

```powershell
npm install
npm run type-check
npm run lint
npm run test
npm run build
npm run dev
```

Check `/`, `/shop`, `/product/sample-macbook-air`, `/cart` and `/wishlist`. Test adding/removing items and refreshing the browser. The enquiry and wishlist lists should remain saved in the same browser profile.

Never send database passwords, secret keys, bank account credentials or customer data through chat. Enter secrets only into local `.env.local` or the appropriate provider dashboard.

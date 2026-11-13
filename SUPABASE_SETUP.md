# Mr LapShop — Connected Supabase project

The development project `mr-lapshop-dev` is active and now has the ten migrations listed below. The database is PostgreSQL 17 (not MySQL). The project URL and publishable API key are public-client configuration values; never put a database password, Supabase secret key or service-role key in the browser or source control.

## Connected project

- Project: `mr-lapshop-dev`
- Project reference: `tgoqtjyobpkopwqwqeft`
- Database: Supabase PostgreSQL 17
- Region: `ap-northeast-2` (Seoul)
- Project URL: `https://tgoqtjyobpkopwqwqeft.supabase.co`

The final archive intentionally excludes `.env.local`. Copy `.env.example` to `.env.local` and configure the values for your local environment. Keep `.env.local` private and untracked.

## Migration history recorded in the cloud

1. `20261111160822_restrict_public_execute_on_rls_event_function.sql`
2. `20261111161040_mr_lapshop_initial_store_schema.sql`
3. `20261111161059_mr_lapshop_admin_operations.sql`
4. `20261111161351_harden_owner_rls_and_database_indexes.sql`
5. `20261111161520_limit_anonymous_table_privileges.sql`
6. `20261111171616_mr_lapshop_final_order_request_flow.sql` — enables pending request submission, adds payment methods and the full-payment-before-confirmation rule.
7. `20261111172047_mr_lapshop_final_checkout_and_beast_collection.sql` — adds the product performance-pick flag and the delivery-fee-pending marker; updates the order request function.
8. `20261111172422_mr_lapshop_require_full_payment_before_confirmation.sql` — atomic stock deduction when a new order enters processing, requiring verified full payment.
9. `20261111172729_mr_lapshop_quote_delivery_before_confirmation.sql` — additionally requires a delivery quote before a delivery order can enter processing.
10. `20261111173032_mr_lapshop_guest_tracking_delivery_fee_status.sql` — returns the same delivery-fee-pending and payment-required flags to guest tracking as authenticated order views.

The corresponding SQL files are included under `supabase/migrations`. The project has had these migrations applied; do not paste them into the SQL Editor again.

## Database configuration confirmed

- 12 application tables with Row Level Security enabled.
- 12 initial product categories.
- `product-images` Storage bucket with owner-only writes and an 8 MB upload limit.
- `store_settings.checkout_enabled = true`, pickup and delivery request options enabled.
- `store_settings.delivery_fee_pkr = NULL` until the shop quotes the fee.
- Allowed order request payment preferences are JazzCash (`jazzcash`), Easypaisa (`easypaisa`) and UBL Bank (`ubl_bank`). Legacy cash-on-delivery and cash-at-pickup flags remain disabled.
- `orders.payment_status` starts pending and `payment_required_before_confirmation` is true.
- New order requests do not reduce inventory. A private database trigger checks the owner, requires `payment_status = paid`, requires a quoted delivery charge for delivery orders, and atomically decrements stock as the order moves from `new` into processing.
- No sample laptops, customer accounts, owner accounts or fake orders have been created.

## Local environment

Copy `.env.example` to `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

Set these values:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://tgoqtjyobpkopwqwqeft.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
ORDER_NOTIFICATION_EMAIL=mrlapshop@gmail.com
```

Do not set a Supabase service-role key in the frontend. Do not paste secrets into chat.

## Owner Auth setup

Customer email/password registration is separate from the one-owner admin allowlist. The project currently has no owner Auth identity. To finish owner access:

1. Enable email/password signup and confirmation in Supabase Auth.
2. Configure the local Site URL and redirect `http://localhost:3000/auth/callback`.
3. Register the intended owner email in the site's normal customer registration flow.
4. Verify the email.
5. Run `supabase/OWNER_BOOTSTRAP.sql` in Supabase SQL Editor after replacing the placeholder with the exact verified owner email.
6. Verify there is exactly one owner row, enable/test MFA, and sign in at `/admin/login`.
7. Add production Site URL and Auth callback redirect after the production domain is known.

Do not create staff accounts or insert directly into `auth.users`.

## Product and Beast Collection management

After owner setup:

- `/admin/products` — create/edit real products with accurate SKU, condition, specifications, price, stock, warranty and images.
- Use the **Show in The Beast Collection** checkbox only for selected high-performance/upgraded units.
- The Latest Arrivals carousel automatically uses live, published, in-stock laptop products sorted newest-first.
- Demo catalogue cards are explicitly sample content and cannot be ordered. The live product list is empty until the owner publishes verified inventory.

## Order-request process

The checkout is a request form, not a payment gateway:

1. Customer submits contact details, delivery/pickup choice, preferred payment provider and cart items.
2. Supabase validates products, published prices and available stock, then saves a pending order request.
3. The site does not collect or process payment credentials.
4. The shop calls or WhatsApps the customer, confirms the exact device, availability and final amount, including delivery charges if applicable.
5. The shop sends payment instructions separately. Full 100% payment must be received and verified before marking the order paid and moving it from `new` into processing.
6. The owner enters the agreed delivery fee in the order detail screen before processing a delivery order. The database rejects processing while the fee is pending.
7. Stock is deducted atomically at the moment the order first moves from `new` into processing after payment/fee checks pass.

## Email notification setup

The application uses Resend for server-side order-request notifications. Before email notifications will send, configure the following in Vercel (and `.env.local` for local tests):

```dotenv
ORDER_NOTIFICATION_EMAIL=mrlapshop@gmail.com
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=orders@your-verified-domain.com
```

`RESEND_FROM_EMAIL` must be a sender/domain verified in Resend. The API key is server-only and must not be prefixed with `NEXT_PUBLIC_`. If it is not configured, the order still saves to Supabase, but the shop email notification is not sent. Test a real order request in a non-production preview after setting the variables.

## Current advisor status and remaining checks

- Supabase health advisor: no findings after the last migration.
- Security advisor: it still flags public execution of three `SECURITY DEFINER` functions: `get_public_checkout_settings`, `place_order`, and `track_guest_order`. These serve the public checkout and secure token-based guest tracking flows, but should be reviewed before production. The tracking function requires a 64-character bearer token; the order RPC validates all customer/cart inputs. Add anti-abuse/rate limiting and run a final security review before opening the site to public traffic.
- Performance advisor: it reports unused indexes on this new, nearly empty database; that is expected until real catalogue/orders traffic arrives. Do not drop indexes solely on this early report without workload evidence.
- No live Resend notification was verified because the API key and verified sender are not configured.
- No real product/order/customer or owner Auth data has been inserted.

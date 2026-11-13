# Supabase cloud setup report — final review pass

## Project

- Name: `mr-lapshop-dev`
- Project reference: `tgoqtjyobpkopwqwqeft`
- Database: PostgreSQL 17
- Region: Seoul (`ap-northeast-2`)
- State at last check: active/healthy

## Applied migration history

The Supabase Management API reported the following ten migrations as applied:

1. `20261111160822_restrict_public_execute_on_rls_event_function`
2. `20261111161040_mr_lapshop_initial_store_schema`
3. `20261111161059_mr_lapshop_admin_operations`
4. `20261111161351_harden_owner_rls_and_database_indexes`
5. `20261111161520_limit_anonymous_table_privileges`
6. `20261111171616_mr_lapshop_final_order_request_flow`
7. `20261111172047_mr_lapshop_final_checkout_and_beast_collection`
8. `20261111172422_mr_lapshop_require_full_payment_before_confirmation`
9. `20261111172729_mr_lapshop_quote_delivery_before_confirmation`
10. `20261111173032_mr_lapshop_guest_tracking_delivery_fee_status`

## Verified schema/data state

- `products.performance_pick` exists.
- `orders.delivery_fee_pending` exists.
- `orders.payment_required_before_confirmation` exists.
- `public.orders` has a trigger calling `private.guard_order_confirmation_and_decrement_stock`.
- Store checkout/order requests are enabled for pickup and delivery. `delivery_fee_pkr` is NULL pending the shop's quote. Legacy COD/cash-at-pickup/bank-transfer booleans remain disabled.
- Product count: 0. Order count: 0. The project still needs the owner's real inventory and owner Auth identity.

## Order guarantees now enforced

- A customer submission creates a pending request and no online payment is collected.
- The order RPC rechecks live product status, price and stock. It does not decrement inventory when the customer submits the request.
- When the owner moves a new order into processing, the database trigger requires the owner role, full payment marked paid, and a delivery quote for delivery orders. It then atomically deducts inventory.
- Guest tracking now returns delivery-fee-pending and payment-required flags as well as the order summary.

## Advisor review

- Health advisor: no findings at the last post-migration check.
- Security advisor: still warns about public execution of three SECURITY DEFINER functions (`get_public_checkout_settings`, `place_order`, `track_guest_order`). Their availability is needed for public checkout/settings and token-protected guest tracking, but review anti-abuse protections and rate limiting before production.

## Not configured / not tested

- Owner Auth user and MFA remain to be created by the owner.
- Resend API key and verified sender address are not configured; therefore email notification delivery has not been tested.
- No actual products, stock, customer accounts or orders exist yet.

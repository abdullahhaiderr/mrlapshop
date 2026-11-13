# Mr LapShop — Development backlog

## Completed milestones
- Version 1.4: product-detail preview pages, browser-local enquiry list and wishlist, enquiry-to-WhatsApp summary, header counts and catalogue sort.
- Version 1.5: Supabase identity/order foundation, customer accounts, guest checkout foundation, separate cart/enquiry routes, order RPC and secure guest token tracking.
- Version 1.6: owner dashboard foundation, product/category/order/customer operations, product-image handling, internal laptop-preparation checklist and activity log.
- Version 1.7: live catalogue integration, dynamic shop filtering/sorting, live product details/gallery, stock-aware cart gating, customer address book, saved checkout address selector, order progress and frosted white header.

## Future milestones
- Version 1.8: verified-purchase written reviews, review moderation, promotion/discount configuration and public promotion surfaces.
- Version 1.9: choose an email provider, verify sending domain, implement transactional emails, double opt-in or approved consent confirmation, unsubscribe tokens, bounce/complaint handling and customer notifications.
- Version 2.0: owner-managed store settings, final policies, full checkout security and RLS testing, performance/accessibility audit, backups, production environment and launch preparation.

## Additional scalability backlog
- Move shop search, filters, sorting and pagination into database queries if the catalogue grows beyond the current 250-product response cap.
- Add a dedicated product image reordering UI if owner workflow requires it.
- Consider inventory reservation expiry if future checkout/payment workflows introduce advance payments or long-lived pending orders.

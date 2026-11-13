import Link from "next/link";
import { requireStoreOwner } from "@/lib/supabase/owner";

export const metadata = { title: "Orders | Mr LapShop owner" };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string; updated?: string; checklistSaved?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireStoreOwner();
  let query = supabase.from("orders").select("id, order_number, customer_name, phone, fulfillment, payment_method, payment_status, status, total_pkr, created_at").order("created_at", { ascending: false });
  const validStatuses = ["new", "confirmed", "packed", "dispatched", "ready_for_pickup", "delivered", "cancelled", "return_requested", "returned", "refunded"];
  if (validStatuses.includes(params.status ?? "")) query = query.eq("status", params.status as "new" | "confirmed" | "packed" | "dispatched" | "delivered" | "cancelled" | "ready_for_pickup" | "return_requested" | "returned" | "refunded");
  const { data: orders, error } = await query.limit(200);
  return <section className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow">SALES & FULFILMENT</span><h1>Order <em>desk.</em></h1><p>Review customer orders, update payment/order status and manage internal laptop-preparation checks.</p></div></div>
    {params.error === "payment_required" ? <p className="form-feedback form-feedback-error">Verify 100% payment first, then update the order to Confirmed or another processing status.</p> : params.error && <p className="form-feedback form-feedback-error">The requested order update could not be saved. Refresh and try again.</p>}{params.updated && <p className="form-feedback form-feedback-success">Order status updated.</p>}{params.checklistSaved && <p className="form-feedback form-feedback-success">Fulfilment checklist saved.</p>}
    <form className="admin-filterbar" action="/admin/orders"><select name="status" defaultValue={params.status ?? "all"} aria-label="Filter order status"><option value="all">All order statuses</option>{validStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select><button className="button button-dark" type="submit">Filter</button></form>
    <section className="admin-panel"><div className="admin-panel-head"><div><h2>Orders ({orders?.length ?? 0})</h2><p>Showing up to 200 most recent orders.</p></div></div>{error ? <div className="admin-empty">Could not load orders. Check the V1.5 and V1.6 database migrations and owner permissions.</div> : !orders?.length ? <div className="admin-empty">No orders found for this filter.</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Fulfilment</th><th>Payment</th><th>Status</th><th>Total</th><th>Date</th><th /></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.order_number}</strong></td><td>{order.customer_name}<small>{order.phone}</small></td><td>{order.fulfillment}</td><td>{order.payment_method.replaceAll("_", " ")}<small>{order.payment_status.replaceAll("_", " ")}</small></td><td><span className="admin-pill">{order.status.replaceAll("_", " ")}</span></td><td>Rs. {Number(order.total_pkr).toLocaleString("en-PK")}</td><td>{new Date(order.created_at).toLocaleDateString("en-PK")}</td><td><Link href={`/admin/orders/${order.order_number}`}>Manage</Link></td></tr>)}</tbody></table></div>}</section>
  </section>;
}

import Link from "next/link";
import { requireStoreOwner } from "@/lib/supabase/owner";

export const metadata = { title: "Owner dashboard | Mr LapShop" };

export default async function AdminPage() {
  const { supabase } = await requireStoreOwner();
  const [products, activeProducts, categories, orders, newOrders, customers] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  const recentResult = await supabase.from("orders")
    .select("id, order_number, customer_name, status, total_pkr, created_at")
    .order("created_at", { ascending: false }).limit(6);

  const stats = [
    { label: "All products", value: products.count ?? "—" },
    { label: "Published products", value: activeProducts.count ?? "—" },
    { label: "Categories", value: categories.count ?? "—" },
    { label: "Total orders", value: orders.count ?? "—" },
    { label: "New orders", value: newOrders.count ?? "—" },
    { label: "Customer accounts", value: customers.count ?? "—" },
  ];

  return (
    <section className="admin-content">
      <div className="admin-page-heading"><div><span className="eyebrow">STORE OPERATIONS</span><h1>Good to see you, <em>owner.</em></h1><p>Manage the catalogue and keep customer orders moving.</p></div><Link className="button button-primary" href="/admin/products/new">Add product</Link></div>
      <div className="admin-stats-grid admin-stats-grid-v16">{stats.map((stat) => <article key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></article>)}</div>
      <div className="admin-shortcuts-grid">
        <Link href="/admin/products"><strong>Product inventory</strong><span>Create listings, manage prices, stock and photos.</span></Link>
        <Link href="/admin/categories"><strong>Categories</strong><span>Organise laptop and accessory catalogue groups.</span></Link>
        <Link href="/admin/orders"><strong>Order desk</strong><span>Review orders, confirm payment and update progress.</span></Link>
        <Link href="/admin/customers"><strong>Customer records</strong><span>View account contact details and recorded consent.</span></Link>
      </div>
      <section className="admin-panel">
        <div className="admin-panel-head"><div><h2>Recent orders</h2><p>Latest orders recorded by the store database.</p></div><Link href="/admin/orders">View all orders →</Link></div>
        {!recentResult.data?.length ? <div className="admin-empty">No orders have been placed yet. Orders will appear here after the development database is connected and checkout is configured.</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th><th>Date</th><th /></tr></thead><tbody>{recentResult.data.map((order) => <tr key={order.id}><td>{order.order_number}</td><td>{order.customer_name}</td><td><span className="admin-pill">{order.status.replaceAll("_", " ")}</span></td><td>Rs. {Number(order.total_pkr).toLocaleString("en-PK")}</td><td>{new Date(order.created_at).toLocaleDateString("en-PK")}</td><td><Link href={`/admin/orders/${order.order_number}`}>Open</Link></td></tr>)}</tbody></table></div>}
      </section>
      <p className="admin-v16-note">Development note: the public storefront still uses the Version 1.5 demonstration catalogue. Live database catalogue publishing will be connected in a later milestone, after real inventory is entered and the database is verified.</p>
    </section>
  );
}

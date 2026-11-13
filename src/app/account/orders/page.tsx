import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "My orders | Mr LapShop" };

export default async function CustomerOrdersPage() {
  if (!isSupabaseConfigured()) redirect("/account/login");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account/login?next=/account/orders");
  const { data: orders } = await supabase.from("orders").select("order_number, status, payment_status, total_pkr, created_at").eq("user_id", user.id).order("created_at", { ascending: false });

  return <main className="account-page account-page-wide"><section className="account-card account-dashboard"><span className="eyebrow">CUSTOMER AREA</span><h1>Your <em>orders.</em></h1><p>Orders placed while signed in appear here. Guest orders can be tracked from the confirmation link.</p>{!orders?.length ? <div className="account-empty"><p>No orders yet.</p><Link href="/shop">Start shopping →</Link></div> : <div className="account-order-list">{orders.map((order) => <article key={order.order_number} className="account-order-row"><div><strong>{order.order_number}</strong><span>{new Date(order.created_at).toLocaleDateString("en-PK")}</span></div><span className="account-status">{order.status} · {order.payment_status}</span><strong>Rs. {Number(order.total_pkr).toLocaleString("en-PK")}</strong><Link href={`/order/${order.order_number}`}>Details</Link></article>)}</div>}<Link className="account-back-link" href="/account">← Account overview</Link></section></main>;
}

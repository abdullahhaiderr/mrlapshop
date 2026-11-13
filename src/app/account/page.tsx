import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { signOutAction } from "@/app/account/actions";
import { MarketingPreferencesForm } from "@/components/account/marketing-preferences-form";

export const metadata = { title: "My account | Mr LapShop" };

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    return <main className="account-page"><section className="account-card"><span className="eyebrow">CUSTOMER ACCOUNT</span><h1>Accounts are <em>being connected.</em></h1><p>Customer registration and sign-in will become available once the Supabase development project is configured.</p><Link className="button button-primary" href="/shop">Continue shopping</Link></section></main>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account/login");

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("full_name, email, phone, marketing_opt_in").eq("id", user.id).maybeSingle(),
    supabase.from("orders").select("order_number, status, total_pkr, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <main className="account-page account-page-wide">
      <section className="account-card account-dashboard">
        <div className="account-dashboard-head"><div><span className="eyebrow">CUSTOMER AREA</span><h1>Hello, <em>{profile?.full_name || user.email?.split("@")[0] || "there"}.</em></h1><p>{profile?.email || user.email}</p></div><form action={signOutAction}><button className="button button-outline" type="submit">Sign out</button></form></div>
        <div className="account-section-head"><h2>Your recent orders</h2><Link href="/account/orders">View all</Link></div>
        {!orders?.length ? <div className="account-empty"><p>You have not placed an order yet.</p><Link href="/shop">Explore the shop →</Link></div> : (
          <div className="account-order-list">{orders.map((order) => <article key={order.order_number} className="account-order-row"><div><strong>{order.order_number}</strong><span>{new Date(order.created_at).toLocaleDateString("en-PK")}</span></div><span className="account-status">{order.status}</span><strong>Rs. {Number(order.total_pkr).toLocaleString("en-PK")}</strong><Link href={`/order/${order.order_number}`}>Details</Link></article>)}</div>
        )}
        <div className="account-section-head"><h2>Delivery details</h2><Link href="/account/addresses">Manage saved addresses →</Link></div>
        <div className="account-preferences"><h2>Email preferences</h2><p>Promotional emails are optional. Order confirmations and essential order updates are separate.</p><MarketingPreferencesForm defaultChecked={Boolean(profile?.marketing_opt_in)} /></div>
      </section>
    </main>
  );
}

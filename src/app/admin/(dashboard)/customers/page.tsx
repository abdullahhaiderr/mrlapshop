import { requireStoreOwner } from "@/lib/supabase/owner";

export const metadata = { title: "Customers | Mr LapShop owner" };

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireStoreOwner();
  let query = supabase.from("profiles").select("id, email, full_name, phone, email_verified, marketing_opt_in, created_at").order("created_at", { ascending: false });
  if (params.q?.trim()) query = query.or(`email.ilike.%${params.q.trim().replace(/[,%()_*\\]/g, "").slice(0, 80)}%,full_name.ilike.%${params.q.trim().replace(/[,%()_*\\]/g, "").slice(0, 80)}%`);
  const { data: customers, error } = await query.limit(200);
  return <section className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow">CUSTOMER RECORDS</span><h1>Your <em>customers.</em></h1><p>Registered customer accounts only. Guest customers remain visible through their order records.</p></div></div>
    <form className="admin-filterbar" action="/admin/customers"><input name="q" defaultValue={params.q} placeholder="Search name or email" aria-label="Search customers"/><button className="button button-dark" type="submit">Search</button></form>
    <section className="admin-panel"><div className="admin-panel-head"><div><h2>Registered customers ({customers?.length ?? 0})</h2><p>Promotional consent is shown separately from account registration.</p></div></div>{error ? <div className="admin-empty">Could not load customer records. Confirm owner access and the initial migration.</div> : !customers?.length ? <div className="admin-empty">No registered customer accounts found.</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Phone</th><th>Email status</th><th>Promotional email</th><th>Joined</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td><strong>{customer.full_name || "Name not provided"}</strong><small>{customer.email}</small></td><td>{customer.phone || "—"}</td><td><span className="admin-pill">{customer.email_verified ? "Verified" : "Unverified"}</span></td><td><span className={`admin-pill ${customer.marketing_opt_in ? "admin-pill-active" : "admin-pill-draft"}`}>{customer.marketing_opt_in ? "Opted in" : "Not subscribed"}</span></td><td>{new Date(customer.created_at).toLocaleDateString("en-PK")}</td></tr>)}</tbody></table></div>}</section>
    <p className="admin-v16-note">Only owners can access this page. Customer contact data must be used for order service and fulfilment. Do not use purchase history as marketing consent.</p>
  </section>;
}

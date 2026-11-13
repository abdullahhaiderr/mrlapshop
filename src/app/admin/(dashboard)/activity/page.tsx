import { requireStoreOwner } from "@/lib/supabase/owner";

export const metadata = { title: "Owner activity | Mr LapShop" };

export default async function AdminActivityPage() {
  const { supabase } = await requireStoreOwner();
  const { data: entries, error } = await supabase.from("admin_audit_log")
    .select("id, actor_id, action, entity_type, entity_id, details, created_at")
    .order("created_at", { ascending: false }).limit(100);

  return <section className="admin-content">
    <div className="admin-page-heading"><div><span className="eyebrow">SECURITY & ACCOUNTABILITY</span><h1>Owner <em>activity.</em></h1><p>Recent catalogue and order operations recorded by the application.</p></div></div>
    <section className="admin-panel"><div className="admin-panel-head"><div><h2>Recent activity ({entries?.length ?? 0})</h2><p>Most recent 100 events. This is an application activity log, not an immutable forensic record.</p></div></div>
      {error ? <div className="admin-empty">Could not load activity. Confirm that the Version 1.6 database migration has been applied.</div> : !entries?.length ? <div className="admin-empty">No owner actions have been recorded yet.</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Action</th><th>Record</th><th>Details</th><th>Time</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td><strong>{entry.action.replaceAll(".", " · ").replaceAll("_", " ")}</strong><small>Actor: {entry.actor_id?.slice(0, 8) ?? "Unknown"}</small></td><td>{entry.entity_type}<small>{entry.entity_id}</small></td><td><code className="admin-audit-details">{JSON.stringify(entry.details ?? {})}</code></td><td>{new Date(entry.created_at).toLocaleString("en-PK")}</td></tr>)}</tbody></table></div>}
    </section>
  </section>;
}

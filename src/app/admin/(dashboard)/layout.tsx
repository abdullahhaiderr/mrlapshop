import type { ReactNode } from "react";
import Link from "next/link";
import { requireStoreOwner } from "@/lib/supabase/owner";
import { AdminNav } from "@/components/admin/admin-nav";
import { signOutAction } from "@/app/account/actions";

export const metadata = { robots: { index: false, follow: false } };

export default async function OwnerDashboardLayout({ children }: { children: ReactNode }) {
  const { user } = await requireStoreOwner();

  return (
    <main className="admin-page">
      <div className="admin-wrap admin-shell">
        <aside className="admin-sidebar">
          <Link href="/admin" className="admin-brand" aria-label="Mr LapShop admin overview">
            <span className="admin-brand-mark">MR</span>
            <span>MR LAPSHOP</span>
          </Link>
          <span className="admin-sidebar-kicker">Store workspace</span>
          <AdminNav />
          <div className="admin-sidebar-footer">
            <span>Workspace access</span>
            <strong><i aria-hidden="true" /> Owner account</strong>
          </div>
        </aside>

        <div className="admin-main">
          <header className="admin-topbar">
            <div>
              <span className="eyebrow">MR LAPSHOP · PRIVATE AREA</span>
              <strong>Store management</strong>
              <span className="admin-signed-in">Signed in as {user.email}</span>
            </div>
            <div className="admin-topbar-actions">
              <Link href="/" className="admin-storefront-link">View storefront</Link>
              <form action={signOutAction}>
                <button className="button button-outline" type="submit">Sign out</button>
              </form>
            </div>
          </header>
          {children}
        </div>
      </div>
    </main>
  );
}

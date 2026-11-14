import type { ReactNode } from "react";

export const metadata = { robots: { index: false, follow: false } };
import { requireStoreOwner } from "@/lib/supabase/owner";
import { AdminNav } from "@/components/admin/admin-nav";
import { signOutAction } from "@/app/account/actions";

export default async function OwnerDashboardLayout({ children }: { children: ReactNode }) {
  const { user } = await requireStoreOwner();

  return (
    <main className="admin-page">
      <div className="admin-wrap">
        <header className="admin-topbar">
          <div><span className="eyebrow">MR LAPSHOP · PRIVATE AREA</span><strong>Owner workspace</strong><span className="admin-signed-in">{user.email}</span></div>
          <form action={signOutAction}><button className="button button-outline" type="submit">Sign out</button></form>
        </header>
        <AdminNav />
        {children}
      </div>
    </main>
  );
}

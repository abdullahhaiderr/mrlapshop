import type { ReactNode } from "react";
import Image from "next/image";
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
            <Image src="/images/mr-lapshop-logo.webp" alt="Mr LapShop" width={420} height={164} priority />
          </Link>
          <AdminNav />
          <div className="admin-sidebar-footer">
            <span>Store status</span>
            <strong><i aria-hidden="true" /> Live and healthy</strong>
            <small>{user.email}</small>
            <form action={signOutAction}><button type="submit">Sign out</button></form>
          </div>
        </aside>
        <div className="admin-main">{children}</div>
      </div>
    </main>
  );
}

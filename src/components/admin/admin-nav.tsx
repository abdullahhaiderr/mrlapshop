"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type DashboardLink = {
  href: string;
  label: string;
  active: (path: string, search: string) => boolean;
};

const links: DashboardLink[] = [
  { href: "/admin", label: "Overview", active: (path: string) => path === "/admin" },
  { href: "/admin/products", label: "Products", active: (path: string, search: string) => path === "/admin/products" && !search.includes("status=active") },
  { href: "/admin/orders", label: "Orders", active: (path: string) => path.startsWith("/admin/orders") },
  { href: "/admin/products?status=active", label: "Inventory", active: (path: string, search: string) => path === "/admin/products" && search.includes("status=active") },
  { href: "/admin/customers", label: "Customers", active: (path: string) => path.startsWith("/admin/customers") },
  { href: "/admin/testimonials", label: "Testimonials", active: (path: string, search: string) => path === "/admin/testimonials" && !search.includes("tab=reviews") },
  { href: "/admin/testimonials?tab=reviews", label: "Reviews", active: (path: string, search: string) => path === "/admin/testimonials" && search.includes("tab=reviews") },
  { href: "/admin/promotions", label: "Promotions", active: (path: string) => path.startsWith("/admin/promotions") },
  { href: "/admin/settings", label: "Settings", active: (path: string) => path.startsWith("/admin/settings") },
];

export function AdminNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  return (
    <nav className="admin-nav" aria-label="Owner dashboard">
      {links.map((link) => {
        const isActive = link.active(pathname, search);
        return (
          <Link href={link.href} key={link.label} prefetch aria-current={isActive ? "page" : undefined}>
            <span className="admin-nav-mark" aria-hidden="true" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

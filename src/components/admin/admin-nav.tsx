"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/activity", label: "Activity" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Owner dashboard">
      {links.map((link) => {
        const isActive = link.href === "/admin"
          ? pathname === "/admin"
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link href={link.href} key={link.href} prefetch aria-current={isActive ? "page" : undefined}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

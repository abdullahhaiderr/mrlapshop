import Link from "next/link";

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
  return (
    <nav className="admin-nav" aria-label="Owner dashboard">
      {links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
    </nav>
  );
}

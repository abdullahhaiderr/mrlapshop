"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { StorefrontProvider } from "@/components/providers/storefront-provider";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  // The owner workspace has its own private navigation and does not need
  // storefront cart, wishlist, search, announcement or footer hydration.
  if (isAdminRoute) {
    return <div id="main-content">{children}</div>;
  }

  return (
    <StorefrontProvider>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <AnnouncementBar />
      <Header />
      <div id="main-content">{children}</div>
      <Footer />
      <WhatsAppFloat />
    </StorefrontProvider>
  );
}

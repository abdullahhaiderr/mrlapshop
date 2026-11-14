import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";
import { store } from "@/config/store";
import { getSiteUrl, getStoreStructuredData, serializeJsonLd } from "@/lib/seo";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { StorefrontProvider } from "@/components/providers/storefront-provider";

const sora = Sora({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: ["400", "500", "600", "700", "800"] });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Mr LapShop | Laptops, Accessories & Repairs in Rawalpindi",
    template: "%s | Mr LapShop",
  },
  description: "Shop new, used and open-box laptops, accessories and expert laptop repair services at Mr LapShop in Rawalpindi and Islamabad.",
  applicationName: store.name,
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico", apple: "/apple-touch-icon.png" },
  openGraph: {
    title: "Mr LapShop | Laptops, Accessories & Repairs",
    description: "Explore new, used and open-box laptops, accessories and laptop repair services at Mr LapShop in Rawalpindi.",
    siteName: store.name,
    type: "website",
    url: getSiteUrl(),
    locale: "en_PK",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Mr LapShop — laptops, accessories and repairs in Rawalpindi" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mr LapShop | Laptops, Accessories & Repairs",
    description: "New, used and open-box laptops, accessories and expert laptop repairs in Rawalpindi and Islamabad.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${dmSans.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(getStoreStructuredData()) }} />
        <StorefrontProvider>
          <a className="skip-link" href="#main-content">Skip to content</a>
          <AnnouncementBar />
          <Header />
          <div id="main-content">{children}</div>
          <Footer />
          <WhatsAppFloat />
        </StorefrontProvider>
      </body>
    </html>
  );
}

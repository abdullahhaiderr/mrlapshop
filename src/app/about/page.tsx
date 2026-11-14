import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, Laptop, Headphones } from "lucide-react";
import { store } from "@/config/store";

export const metadata: Metadata = {
  title: "About Mr LapShop",
  description: "Get to know Mr LapShop for new, used and open-box laptops, accessories and repair services in Rawalpindi and Islamabad.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="inner-page">
      <section className="page-hero page-hero-about"><div className="container"><span className="eyebrow eyebrow-on-dark">ABOUT THE STORE</span><h1>Good tech. <em>Clear choices.</em></h1><p>Mr LapShop brings laptops and technology categories together in one place in Rawalpindi.</p><div className="breadcrumb"><Link href="/">Home</Link><span>/</span><strong>About</strong></div></div></section>
      <section className="section-block about-content"><div className="container about-content-grid"><div><span className="eyebrow">MR LAPSHOP</span><h2>A place to explore your <em>next device.</em></h2></div><div><p>Mr LapShop serves customers across Rawalpindi and Islamabad with new, used and open-box laptops from Apple, HP, Dell, Lenovo and ASUS, as well as Chromebooks and technology accessories. The shop also supports laptop buying, selling, upgrades and technical repair.</p><p>Services include SSD and RAM upgrades, screen and battery replacement, motherboard repair, Windows and macOS installation, driver and software setup, and laptop maintenance. The team can help prepare a purchased device with its operating system, drivers and essential setup before handover.</p><p>Product listings are maintained individually by the shop, with the exact model, configuration, condition, price, stock, photos and warranty recorded for each available unit.</p><Link className="button button-primary" href="/shop">Explore the catalogue <ArrowRight size={17} /></Link></div></div>
        <div className="container about-value-grid"><div className="about-value-card card-depth"><Laptop size={25} /><h3>Flexible laptop choices</h3><p>New, used and open-box laptops across Apple, HP, Dell, Lenovo, ASUS and Chromebook ranges.</p></div><div className="about-value-card card-depth"><Headphones size={25} /><h3>Accessories & gaming</h3><p>Headphones, microphones, keyboards, mice, gaming consoles and other tech essentials.</p></div><div className="about-value-card card-depth"><MapPin size={25} /><h3>Visit us in Rawalpindi</h3><p>{store.address.full}</p></div></div>
      </section>
    </main>
  );
}

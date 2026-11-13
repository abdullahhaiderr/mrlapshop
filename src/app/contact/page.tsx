import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, MapPin, Phone, ArrowUpRight } from "lucide-react";
import { store } from "@/config/store";
import { ContactForm } from "@/components/contact/contact-form";
import { SocialLinks } from "@/components/brand/social-links";

export const metadata: Metadata = {
  title: "Contact Mr LapShop",
  description: "Contact Mr LapShop for laptops, accessories, upgrades and laptop repair in Rawalpindi and Islamabad.",
};

type ContactPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const product = Array.isArray(params.product) ? params.product[0] : params.product;
  const safeProductName = product?.slice(0, 120);
  const initialMessage = safeProductName ? `I am interested in ${safeProductName}. Please share the current availability and price.` : "";

  return (
    <main className="inner-page">
      <section className="page-hero page-hero-contact"><div className="container"><span className="eyebrow eyebrow-on-dark">WE'RE EASY TO FIND</span><h1>Let's talk <em>technology.</em></h1><p>Questions about a laptop or planning a visit? Find our contact details below.</p><div className="breadcrumb"><Link href="/">Home</Link><span>/</span><strong>Contact</strong></div></div></section>
      <section className="section-block contact-page-section"><div className="container contact-page-grid">
        <div className="contact-info-panel card-depth"><span className="eyebrow">STORE DETAILS</span><h2>Come by, <em>we're here.</em></h2><p className="contact-intro">Visit the store in Satellite Town, Rawalpindi, or call us directly.</p>
          <div className="contact-info-item"><span><MapPin size={19} /></span><div><strong>Our address</strong><p>{store.address.full}</p><Link href={store.address.mapsUrl} target="_blank" rel="noreferrer">Open in Google Maps <ArrowUpRight size={15} /></Link></div></div>
          <div className="contact-info-item"><span><Phone size={19} /></span><div><strong>Phone & WhatsApp</strong><p>{store.contact.displayNumber}</p><div className="contact-number-actions"><a href={store.contact.phoneHref}>Call the shop</a><a href={store.contact.whatsappHref} target="_blank" rel="noopener noreferrer">WhatsApp the shop</a></div></div></div>
          <div className="contact-social-list"><strong>Follow Mr LapShop</strong><SocialLinks className="contact-social-icons" iconOnly /></div>
          <div className="contact-info-item"><span><Clock3 size={19} /></span><div><strong>Opening hours</strong>{store.hours.rows.map((row) => <p className="hours-row" key={row.day}><span>{row.day}</span><span className={row.time === "Closed" ? "closed-label" : ""}>{row.time}</span></p>)}</div></div>
          <div className="contact-map-card card-depth"><div className="map-pattern"><MapPin size={35} /></div><div><strong>Mr LapShop · Rawalpindi</strong><span>Techno City 2, 6th Road</span></div><Link href={store.address.mapsUrl} target="_blank" rel="noreferrer" aria-label="Open Mr LapShop in Google Maps"><ArrowUpRight size={19} /></Link></div>
        </div>
        <ContactForm initialMessage={initialMessage} />
      </div></section>
    </main>
  );
}

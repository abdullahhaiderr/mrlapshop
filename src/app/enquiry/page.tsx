"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle, Minus, Package, Trash2 } from "lucide-react";
import { demoProducts } from "@/data/products";
import { store } from "@/config/store";
import { useStorefront } from "@/components/providers/storefront-provider";

export default function EnquiryListPage() {
  const { enquiryIds, removeFromEnquiry, clearEnquiry, hydrated } = useStorefront();
  const products = demoProducts.filter((product) => enquiryIds.includes(product.id));
  const message = [
    "Hello Mr LapShop, I would like to enquire about these products:",
    ...products.map((product, index) => `${index + 1}. ${product.brand} ${product.name} (${product.condition})`),
    "Please confirm current availability, exact configuration, price, delivery or pickup options, and warranty. This is an enquiry, not a confirmed order.",
  ].join("\n");
  const whatsappHref = `${store.contact.whatsappHref}?text=${encodeURIComponent(message)}`;

  if (!hydrated) return <main className="commerce-page"><div className="container commerce-loading">Loading your saved enquiry list…</div></main>;

  return (
    <main className="commerce-page">
      <section className="commerce-page-hero"><div className="container"><span className="eyebrow eyebrow-on-dark">YOUR SHORTLIST</span><h1>Enquiry <em>list.</em></h1><p>Collect products you want to ask the shop about. No order or payment is made from this preview list.</p></div></section>
      <section className="container commerce-content">
        {products.length === 0 ? (
          <div className="empty-commerce-card card-depth"><span className="empty-commerce-icon"><Package size={28} /></span><span className="eyebrow">YOUR ENQUIRY LIST</span><h2>Nothing added just yet.</h2><p>Browse the sample catalogue and add products you want the shop to confirm for you.</p><Link href="/shop" className="button button-primary">Explore the catalogue <ArrowRight size={17} /></Link></div>
        ) : (
          <div className="enquiry-layout">
            <div className="enquiry-items">
              {products.map((product) => (
                <article className="enquiry-item card-depth" key={product.id}>
                  <Link className="enquiry-item-image" href={`/product/${product.slug}`}><Image src={product.image} alt={`Placeholder for ${product.name}`} fill sizes="120px" /></Link>
                  <div className="enquiry-item-copy"><span>{product.brand} · {product.condition}</span><h2><Link href={`/product/${product.slug}`}>{product.name}</Link></h2><p>Price on request · {product.warrantyLabel}</p><Link href={`/product/${product.slug}`} className="enquiry-details-link">View details <ArrowRight size={13}/></Link></div>
                  <button type="button" className="enquiry-remove" onClick={() => removeFromEnquiry(product.id)} aria-label={`Remove ${product.name} from enquiry list`}><Trash2 size={17}/></button>
                </article>
              ))}
              <button type="button" className="enquiry-clear" onClick={clearEnquiry}><Minus size={15}/> Clear enquiry list</button>
            </div>
            <aside className="enquiry-summary card-depth"><span className="eyebrow">NEXT STEP</span><h2>Ask the shop to confirm.</h2><p>{products.length} sample {products.length === 1 ? "product" : "products"} selected. The shop will confirm exact configurations, prices, availability and warranty.</p><a href={whatsappHref} target="_blank" rel="noreferrer" className="button button-primary"><MessageCircle size={17}/> Send enquiry on WhatsApp</a><small>This does not place an order or collect payment. Delivery and payment terms are confirmed separately by the shop.</small><Link href="/shop" className="enquiry-continue">Continue browsing <ArrowRight size={14}/></Link></aside>
          </div>
        )}
      </section>
    </main>
  );
}

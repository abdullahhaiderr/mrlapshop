import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ChevronRight, Info, MapPin, ShieldCheck, PackageCheck } from "lucide-react";
import { ProductActions } from "@/components/product/product-actions";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { getPublicProductBySlug } from "@/lib/catalogue";
import { formatPKR } from "@/lib/format";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getPublicProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.brand} ${product.name}`,
    description: product.isDemo === false
      ? product.shortDescription || `View specifications, condition, current price and availability for ${product.brand} ${product.name} at Mr LapShop.`
      : `View this illustrative ${product.condition.toLowerCase()} ${product.brand} laptop sample from Mr LapShop.`,
    openGraph: product.images?.[0]?.url ? { images: [{ url: product.images[0].url, alt: product.images[0].alt }] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { product, related } = await getPublicProductBySlug(slug);
  if (!product) notFound();

  const isDemo = product.isDemo !== false;
  const canPurchase = !isDemo && Number.isInteger(product.pricePkr) && Number(product.pricePkr) > 0 && Number(product.stock) > 0;
  const displayImages = product.images ?? [];

  return (
    <main className="inner-page product-detail-page">
      <div className="container product-breadcrumb"><Link href="/">Home</Link><ChevronRight size={14} /><Link href="/shop">Shop</Link><ChevronRight size={14} /><span>{product.name}</span></div>
      <section className="container product-detail-layout">
        <ProductGallery images={displayImages} fallbackImage={product.image} productName={product.name} isDemo={isDemo} />
        <div className="product-detail-copy">
          <span className="eyebrow">{product.brand} · {product.category}</span>
          <h1>{product.name}</h1>
          <div className="product-detail-chips"><span>{product.condition}</span><span>{isDemo ? "Sample listing" : Number(product.stock) > 0 ? "In stock" : "Out of stock"}</span>{!isDemo && product.stock !== undefined && <span>{product.stock} available</span>}</div>
          <p className="product-detail-intro">{isDemo ? "This is a design-preview listing. The owner will enter the exact unit model, configuration, price, stock, photos and warranty before it is offered for sale." : product.shortDescription || product.description || `View the available ${product.brand} ${product.name} listing and its confirmed specifications.`}</p>
          <div className="product-detail-price">
            <strong>{canPurchase ? formatPKR(Number(product.pricePkr)) : "Price on request"}</strong>
            {!isDemo && product.compareAtPricePkr && product.compareAtPricePkr > Number(product.pricePkr) && <del>{formatPKR(product.compareAtPricePkr)}</del>}
            <small>{isDemo ? "Ask the shop for the current price and unit availability." : canPurchase ? "Price shown for the published product. Final order totals are verified at checkout." : "The shop can confirm price and availability for this product."}</small>
          </div>
          <ProductActions product={product} />
          <div className="product-detail-assurances">
            <div><ShieldCheck size={18} /><span><strong>Unit-specific warranty</strong><small>{product.warrantyLabel}. {isDemo ? "Final terms are confirmed on the actual listing." : product.isDemo === false ? "Refer to the product listing and written shop terms." : ""}</small></span></div>
            <div><BadgeCheck size={18} /><span><strong>Condition shown clearly</strong><small>{isDemo ? `This sample shows ${product.condition.toLowerCase()} as a design example only.` : `Condition recorded for this product: ${product.condition}.`}</small></span></div>
            <div><PackageCheck size={18} /><span><strong>{isDemo ? "Sample listing" : Number(product.stock) > 0 ? "Stock availability" : "Availability check"}</strong><small>{isDemo ? "This preview item is not orderable." : Number(product.stock) > 0 ? "The current listed stock is checked again before an order is accepted." : "This product is currently out of stock. Contact the shop for an update."}</small></span></div>
            <div><MapPin size={18} /><span><strong>Local shop in Rawalpindi</strong><small>Visit the store to discuss a device or service.</small></span></div>
          </div>
        </div>
      </section>
      <section className="container product-detail-information">
        <div className="product-spec-panel">
          <span className="eyebrow">UNIT INFORMATION</span>
          <h2>Specifications & details</h2>
          {product.specs.length ? <ul>{product.specs.map((spec) => <li key={spec}>{spec}</li>)}</ul> : <p>Detailed specifications will be added by the shop before the product is offered for sale.</p>}
          {!isDemo && product.description && <p>{product.description}</p>}
          {isDemo && <p>{product.note}</p>}
        </div>
        <aside className="product-detail-notice"><Info size={20} /><div><strong>{isDemo ? "Please confirm before purchase" : "Order and product information"}</strong><p>{isDemo ? "This page is part of the sample storefront. It is not a live stock offer, paid order or warranty promise. The shop will confirm the actual unit and its terms directly." : "Product price and stock are rechecked during checkout. Warranty, condition and product details are specific to this listing."}</p></div></aside>
      </section>
      {related.length > 0 && <section className="section-block related-products-section"><div className="container"><div className="section-heading"><span className="eyebrow">KEEP EXPLORING</span><h2>More from <em>the catalogue.</em></h2><p>{isDemo ? "Other illustrative products in the preview catalogue." : "More products currently published by Mr LapShop."}</p></div><div className="product-grid product-grid-enhanced">{related.map((item) => <ProductCard key={item.id} product={item} compact />)}</div></div></section>}
    </main>
  );
}

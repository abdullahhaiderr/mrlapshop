"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { DemoProduct } from "@/data/products";
import { ProductCard } from "@/components/product/product-card";

type Props = { products: DemoProduct[] };

export function LatestArrivalsMarquee({ products }: Props) {
  const latest = [...products]
    .filter((product) => { const category = (product.categorySlug ?? "").toLowerCase(); return product.isDemo === false && (product.stock ?? 0) > 0 && !category.includes("accessor") && !["headphones", "headsets", "microphones", "keyboards", "mice", "consoles"].some((slug) => category.includes(slug)); })
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 12);

  return (
    <section className="section-block latest-arrivals-section" aria-labelledby="latest-arrivals-title">
      <div className="container">
        <div className="section-heading section-heading-row">
          <div>
            <span className="eyebrow"><Sparkles size={14} /> JUST LANDED</span>
            <h2 id="latest-arrivals-title">Latest <em>arrivals.</em></h2>
            <p>Fresh additions from the live Mr LapShop catalogue, moving through a continuous showcase.</p>
          </div>
          <Link className="text-link" href="/shop?sort=newest">Explore new arrivals <ArrowRight size={16} /></Link>
        </div>
        {latest.length ? (
          <div className="latest-marquee" role="region" aria-label="Latest laptop arrivals carousel">
            <div className="latest-marquee-track">
              <div className="latest-marquee-group">
                {latest.map((product) => <div className="latest-marquee-card" key={`latest-${product.id}`}><ProductCard product={product} compact /></div>)}
              </div>
              <div className="latest-marquee-group" aria-hidden="true" inert>
                {latest.map((product) => <div className="latest-marquee-card" key={`latest-copy-${product.id}`}><ProductCard product={product} compact /></div>)}
              </div>
            </div>
          </div>
        ) : (
          <div className="latest-marquee-empty">
            <span><Sparkles size={20} /></span>
            <div><strong>New arrivals will appear here.</strong><p>Once real products are published in the owner dashboard, the newest in-stock laptops will automatically join this carousel.</p></div>
            <Link href="/shop">Browse the catalogue <ArrowRight size={15} /></Link>
          </div>
        )}
      </div>
    </section>
  );
}

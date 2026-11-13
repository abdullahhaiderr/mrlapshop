"use client";

import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { demoProducts } from "@/data/products";
import { ProductCard } from "@/components/product/product-card";
import { useStorefront } from "@/components/providers/storefront-provider";

export default function WishlistPage() {
  const { wishlistIds, hydrated } = useStorefront();
  const products = demoProducts.filter((product) => wishlistIds.includes(product.id));

  if (!hydrated) return <main className="commerce-page"><div className="container commerce-loading">Loading your wishlist…</div></main>;

  return (
    <main className="commerce-page">
      <section className="commerce-page-hero"><div className="container"><span className="eyebrow eyebrow-on-dark">SAVED FOR LATER</span><h1>Your <em>wishlist.</em></h1><p>Keep the sample products you are interested in together on this browser.</p></div></section>
      <section className="container commerce-content">
        {products.length ? <><div className="commerce-results-heading"><span>{products.length} saved {products.length === 1 ? "product" : "products"}</span><Link href="/shop" className="text-link">Explore more <ArrowRight size={15}/></Link></div><div className="product-grid product-grid-enhanced">{products.map((product) => <ProductCard key={product.id} product={product}/>)}</div></> : <div className="empty-commerce-card card-depth"><span className="empty-commerce-icon"><Heart size={28}/></span><span className="eyebrow">YOUR WISHLIST</span><h2>Save your favourites.</h2><p>Use the heart on a product card to save it here. Your saved list stays in this browser.</p><Link href="/shop" className="button button-primary">Browse the catalogue <ArrowRight size={17}/></Link></div>}
      </section>
    </main>
  );
}

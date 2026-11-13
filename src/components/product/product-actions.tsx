"use client";

import Link from "next/link";
import { Check, Heart, MessageCircle, Plus, ShoppingCart } from "lucide-react";
import type { DemoProduct } from "@/data/products";
import { store } from "@/config/store";
import { useStorefront } from "@/components/providers/storefront-provider";

export function ProductActions({ product }: { product: DemoProduct }) {
  const { addToEnquiry, addToCart, isInEnquiry, isWishlisted, toggleWishlist } = useStorefront();
  const inEnquiry = isInEnquiry(product.id);
  const wishlisted = isWishlisted(product.id);
  const isDemo = product.isDemo !== false;
  const canPurchase = !isDemo && Number.isInteger(product.pricePkr) && Number(product.pricePkr) > 0 && Number(product.stock) > 0;
  const enquiryMessage = `Hello Mr LapShop, I am interested in ${product.brand} ${product.name}. Please confirm the exact model, configuration, condition, current availability, price and warranty.`;
  const whatsappHref = `${store.contact.whatsappHref}?text=${encodeURIComponent(enquiryMessage)}`;

  return (
    <div className="product-detail-actions">
      {canPurchase ? (
        <button className="button button-primary" type="button" onClick={() => addToCart(product.id)}><ShoppingCart size={17} /> Add to cart</button>
      ) : (
        <button className="button button-primary" type="button" onClick={() => addToEnquiry(product.id)}>{inEnquiry ? <Check size={17} /> : <Plus size={17} />}{inEnquiry ? "Added to enquiry" : isDemo ? "Add to enquiry list" : "Ask about availability"}</button>
      )}
      <a className="button button-outline" href={whatsappHref} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Ask on WhatsApp</a>
      <button className={`product-detail-wishlist${wishlisted ? " is-active" : ""}`} type="button" onClick={() => toggleWishlist(product.id)} aria-pressed={wishlisted}>
        <Heart size={17} fill={wishlisted ? "currentColor" : "none"} /> {wishlisted ? "Saved to wishlist" : "Save to wishlist"}
      </button>
      {inEnquiry && <Link className="product-detail-list-link" href="/enquiry">View your enquiry list</Link>}
      {canPurchase && <Link className="product-detail-list-link" href="/cart">View shopping cart</Link>}
    </div>
  );
}

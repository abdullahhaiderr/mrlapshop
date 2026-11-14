"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, Heart, Plus, ShoppingCart } from "lucide-react";
import type { DemoProduct } from "@/data/products";
import { BrandMark } from "@/components/brand/brand-mark";
import { useStorefront } from "@/components/providers/storefront-provider";
import { formatPKR } from "@/lib/format";

type ProductCardProps = { product: DemoProduct; compact?: boolean };

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const { addToEnquiry, isInEnquiry, isWishlisted, toggleWishlist, addToCart } = useStorefront();
  const isDemo = product.isDemo !== false;
  const canPurchase = !isDemo && Number.isInteger(product.pricePkr) && Number(product.pricePkr) > 0 && Number(product.stock) > 0;
  const conditionClass = product.condition.toLowerCase().replaceAll(" ", "-");
  const inEnquiry = isInEnquiry(product.id);
  const wishlisted = isWishlisted(product.id);
  const primaryImage = product.images?.[0];

  return (
    <article className={`product-card product-card-premium card-depth${compact ? " product-card-compact" : ""}`}>
      <div className="product-card-topline">
        <span className={`product-condition-badge condition-${conditionClass}`}>{product.condition}</span>
        {isDemo ? <span className="product-sample-badge">Demo listing</span> : <span className={`product-live-badge${product.stock ? " is-available" : " is-unavailable"}`}>{product.stock ? "Available" : "Out of stock"}</span>}
      </div>
      <Link className="product-image-wrap" href={`/product/${product.slug}`} aria-label={`View ${product.brand} ${product.name}`}>
        <Image src={product.image} alt={primaryImage?.alt ?? (isDemo ? `Illustrative placeholder image for ${product.brand} ${product.name}` : `Product photo pending for ${product.brand} ${product.name}`)} fill sizes="(max-width: 680px) 90vw, (max-width: 1100px) 42vw, 25vw" className="product-image product-image-primary" />
        {product.images?.[1] && (
          <Image
            src={product.images[1].url}
            alt={product.images[1].alt || `Additional view of ${product.brand} ${product.name}`}
            fill
            sizes="(max-width: 680px) 90vw, (max-width: 1100px) 42vw, 25vw"
            className="product-image product-image-hover"
          />
        )}
        <span className="product-image-action"><ArrowRight size={17} /></span>
      </Link>
      <div className="product-card-body">
        <div className="product-brand-row">
          <span className="product-brand-identity"><BrandMark name={product.brand} size={19} /><span>{product.brand}</span></span>
          <span className="product-category-label">{product.category}</span>
        </div>
        <h3><Link href={`/product/${product.slug}`}>{product.name}</Link></h3>
        <div className="spec-list">{product.specs.slice(0, 3).map((spec) => <span key={spec}>{spec}</span>)}</div>
        <div className="product-card-information">
          <span><BadgeCheck size={13} /> {product.warrantyLabel}</span>
          {isDemo ? <span>Illustrative unit</span> : <span>{product.stock ? `${product.stock} in stock` : "Currently unavailable"}</span>}
        </div>
        <div className="product-card-price-row">
          <div>
            <strong>{canPurchase ? formatPKR(Number(product.pricePkr)) : "Price on request"}</strong>
            <small>{canPurchase ? "Current listed price" : isDemo ? "Confirm exact unit details with the shop" : "Contact the shop for availability"}</small>
            {!isDemo && product.compareAtPricePkr && product.compareAtPricePkr > Number(product.pricePkr) && <del>{formatPKR(product.compareAtPricePkr)}</del>}
          </div>
          <span className={`product-stock-mark${!isDemo && !product.stock ? " is-out-of-stock" : ""}`}><i /> {isDemo ? "Sample" : product.stock ? "In stock" : "Sold out"}</span>
        </div>
        <div className="product-card-actions product-card-actions-v14">
          {canPurchase ? (
            <button className="product-add-button" type="button" onClick={() => addToCart(product.id)}><ShoppingCart size={15} /> Add to cart</button>
          ) : (
            <button className={`product-add-button${inEnquiry ? " is-added" : ""}`} type="button" onClick={() => addToEnquiry(product.id)} aria-label={inEnquiry ? `${product.name} is in your enquiry list` : `Ask about ${product.name}`}>
              {inEnquiry ? <Check size={16} /> : <Plus size={16} />}
              {inEnquiry ? "Added to list" : isDemo ? "Add to enquiry" : "Ask about availability"}
            </button>
          )}
          <button className={`product-wishlist-button${wishlisted ? " is-active" : ""}`} type="button" onClick={() => toggleWishlist(product.id)} aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} aria-pressed={wishlisted}>
            <Heart size={17} fill={wishlisted ? "currentColor" : "none"} />
          </button>
        </div>
        <Link className="product-detail-link" href={`/product/${product.slug}`}>View product details <ArrowRight size={14} /></Link>
      </div>
    </article>
  );
}

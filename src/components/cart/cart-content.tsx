"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import type { DemoProduct } from "@/data/products";
import { formatPKR } from "@/lib/format";
import { useStorefront } from "@/components/providers/storefront-provider";

export function CartContent({ catalogueProducts }: { catalogueProducts: DemoProduct[] }) {
  const { cartItems, updateCartQuantity, removeFromCart, hydrated } = useStorefront();
  const productMap = new Map(catalogueProducts.map((product) => [product.id, product]));
  const lines = cartItems.map((item) => ({ ...item, product: productMap.get(item.productId) ?? null }));
  const purchasableLines = lines.filter((line) => line.product && line.product.isDemo === false && Number.isInteger(line.product.pricePkr) && Number(line.product.pricePkr) > 0 && Number(line.product.stock) > 0 && line.quantity <= Number(line.product.stock));
  const subtotal = purchasableLines.reduce((sum, line) => sum + Number(line.product?.pricePkr ?? 0) * line.quantity, 0);
  const allLinesReady = lines.length > 0 && lines.every((line) => line.product && line.product.isDemo === false && Number.isInteger(line.product.pricePkr) && Number(line.product.pricePkr) > 0 && Number(line.product.stock) >= line.quantity && Number(line.product.stock) > 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (!hydrated) return <main className="commerce-page"><div className="container commerce-loading">Loading your cart…</div></main>;

  return (
    <main className="commerce-page">
      <section className="commerce-page-hero"><div className="container"><span className="eyebrow eyebrow-on-dark">YOUR SHOPPING CART</span><h1>Your <em>cart.</em></h1><p>Review your selected products and quantities before continuing to checkout.</p></div></section>
      <section className="container commerce-content">
        {lines.length === 0 ? (
          <div className="empty-commerce-card card-depth"><span className="empty-commerce-icon"><ShoppingCart size={28} /></span><span className="eyebrow">YOUR CART</span><h2>Your cart is waiting.</h2><p>Explore the catalogue and add products you are ready to purchase.</p><Link href="/shop" className="button button-primary">Explore products <ArrowRight size={17} /></Link></div>
        ) : (
          <div className="cart-layout-v15">
            <div className="cart-lines-v15">
              {lines.map(({ product, productId, quantity }) => product ? (
                <article className="cart-line-v15 card-depth" key={productId}>
                  <Link className="cart-line-image-v15" href={`/product/${product.slug}`}><Image src={product.image} alt={product.images?.[0]?.alt ?? `Product image for ${product.name}`} fill sizes="120px" /></Link>
                  <div className="cart-line-copy-v15"><span>{product.brand} · {product.condition}{product.isDemo !== false ? " · Sample listing" : ""}</span><h2><Link href={`/product/${product.slug}`}>{product.name}</Link></h2>
                    {product.isDemo !== false ? <p>This is a sample item and cannot be ordered.</p> : <p>{Number(product.stock) > 0 ? `${product.stock} currently in stock` : "Currently out of stock"}</p>}
                    <div className="cart-quantity-v15"><button type="button" onClick={() => updateCartQuantity(productId, quantity - 1)} aria-label={`Decrease quantity of ${product.name}`}><Minus size={14}/></button><span>{quantity}</span><button type="button" onClick={() => updateCartQuantity(productId, quantity + 1)} disabled={quantity >= 10 || (product.isDemo === false && quantity >= Number(product.stock))} aria-label={`Increase quantity of ${product.name}`}><Plus size={14}/></button><button type="button" className="cart-remove-v15" onClick={() => removeFromCart(productId)} aria-label={`Remove ${product.name}`}><Trash2 size={15}/> Remove</button></div>
                  </div>
                  <strong className="cart-line-price-v15">{product.isDemo === false && product.pricePkr ? formatPKR(product.pricePkr * quantity) : "Price on request"}</strong>
                </article>
              ) : (
                <article className="cart-line-v15 card-depth" key={productId}><div className="cart-line-copy-v15"><span>Unavailable product</span><h2>This item is no longer in the active catalogue.</h2><p>Remove it from your cart and choose a currently published product.</p><button type="button" className="cart-remove-v15" onClick={() => removeFromCart(productId)}><Trash2 size={15}/> Remove item</button></div></article>
              ))}
            </div>
            <aside className="cart-summary-v15 card-depth"><span className="eyebrow">ORDER SUMMARY</span><h2>Almost there.</h2><div className="cart-summary-row-v15"><span>Items</span><strong>{itemCount}</strong></div><div className="cart-summary-row-v15"><span>Product subtotal</span><strong>{allLinesReady ? formatPKR(subtotal) : "To be confirmed"}</strong></div><div className="cart-summary-row-v15"><span>Delivery</span><strong>At checkout</strong></div>
              {!allLinesReady && <p className="cart-setup-warning-v15">Your cart contains a sample, unavailable or out-of-stock item, or an item without a confirmed price. Remove or update it before checkout. Delivery and payment options are enabled only after the owner configures the store.</p>}
              {allLinesReady ? <Link href="/checkout" className="button button-primary">Continue to checkout <ArrowRight size={17}/></Link> : <button className="button button-primary" type="button" disabled>Checkout unavailable</button>}
              <Link className="enquiry-continue" href="/shop">Continue shopping</Link><Link className="cart-enquiry-link-v15" href="/enquiry">Need a product enquiry instead? →</Link>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

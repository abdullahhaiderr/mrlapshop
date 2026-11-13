"use client";

import Image from "next/image";
import { useState } from "react";

export type GalleryImage = { url: string; alt: string };

export function ProductGallery({ images, fallbackImage, productName, isDemo }: { images: GalleryImage[]; fallbackImage: string; productName: string; isDemo: boolean }) {
  const availableImages = images.length ? images : [{ url: fallbackImage, alt: isDemo ? `Illustrative placeholder image for ${productName}` : `Product image for ${productName}` }];
  const [activeIndex, setActiveIndex] = useState(0);
  const active = availableImages[Math.min(activeIndex, availableImages.length - 1)];

  return (
    <div className="product-gallery-v17">
      <div className="product-detail-gallery card-depth">
        {isDemo && <span className="product-detail-demo-tag">Sample product image</span>}
        <Image src={active.url} alt={active.alt} fill priority sizes="(max-width: 800px) 100vw, 52vw" className="product-detail-image" />
      </div>
      {availableImages.length > 1 && <div className="product-gallery-thumbs" aria-label="Product photos">{availableImages.map((image, index) => <button type="button" key={`${image.url}-${index}`} className={index === activeIndex ? "is-active" : ""} onClick={() => setActiveIndex(index)} aria-label={`Show product photo ${index + 1}`} aria-pressed={index === activeIndex}><Image src={image.url} alt="" width={76} height={76} /></button>)}</div>}
      {!isDemo && images.length === 0 && <p className="product-no-photo-note">Product photos are being added. Contact the shop to request current photos before purchase.</p>}
    </div>
  );
}

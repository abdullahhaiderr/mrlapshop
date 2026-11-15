import type { MetadataRoute } from "next";
import { getPublicSitemapProducts } from "@/lib/catalogue";
import { getSiteUrl } from "@/lib/seo";

// Generate the sitemap on request so newly published products are included
// automatically without manual XML edits or a redeployment.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now },
    { url: `${baseUrl}/shop`, lastModified: now },
    { url: `${baseUrl}/about`, lastModified: now },
    { url: `${baseUrl}/contact`, lastModified: now },
  ];

  const products = await getPublicSitemapProducts();
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/product/${encodeURIComponent(product.slug)}`,
    lastModified: product.lastModified ? new Date(product.lastModified) : now,
    ...(product.images.length ? { images: product.images } : {}),
  }));

  return [...staticRoutes, ...productRoutes];
}

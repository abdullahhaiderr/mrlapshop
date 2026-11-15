import type { MetadataRoute } from "next";
import { getPublicSitemapProducts } from "@/lib/catalogue";
import { getSiteUrl } from "@/lib/seo";

// Generate the sitemap at request time so newly published products are included
// without a manual sitemap edit or a separate deployment.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.65 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
  ];

  const products = await getPublicSitemapProducts();
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/product/${encodeURIComponent(product.slug)}`,
    lastModified: product.createdAt ? new Date(product.createdAt) : now,
    changeFrequency: "weekly",
    priority: 0.8,
    ...(product.images.length ? { images: product.images } : {}),
  }));

  return [...staticRoutes, ...productRoutes];
}

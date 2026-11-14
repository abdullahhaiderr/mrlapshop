import type { MetadataRoute } from "next";
import { getPublicCatalogue } from "@/lib/catalogue";
import { getSiteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.65 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
  ];

  const catalogue = await getPublicCatalogue();
  const productRoutes: MetadataRoute.Sitemap = catalogue.mode === "live"
    ? catalogue.products
        .filter((product) => product.isDemo === false && Boolean(product.slug))
        .map((product) => ({
          url: `${baseUrl}/product/${encodeURIComponent(product.slug)}`,
          lastModified: product.createdAt ? new Date(product.createdAt) : now,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }))
    : [];

  return [...staticRoutes, ...productRoutes];
}

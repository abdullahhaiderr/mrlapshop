import type { Metadata } from "next";
import { ShopCatalog } from "@/components/shop/shop-catalog";
import { getPublicCatalogue, getPublicCategories } from "@/lib/catalogue";
import { catalogueCategories } from "@/config/store";

export const metadata: Metadata = {
  title: "Shop laptops and accessories",
  description: "Browse currently published laptops and accessories from Mr LapShop in Rawalpindi. Filter by brand, condition, budget, processor, memory and availability.",
};

export const dynamic = "force-dynamic";

type SearchParams = { search?: string; category?: string; brand?: string; condition?: string; min?: string; max?: string; cpu?: string; ram?: string; storage?: string; inStock?: string; sort?: string; page?: string };

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, catalogue, categories] = await Promise.all([searchParams, getPublicCatalogue(), getPublicCategories()]);
  const allowedSorts = new Set(["featured", "newest", "price-asc", "price-desc", "name"]);
  const allowedConditions = new Set(["New", "Used", "Open Box"]);
  const rawCondition = params.condition?.toLowerCase().replaceAll("-", " ");
  const condition = rawCondition ? [...allowedConditions].find((item) => item.toLowerCase() === rawCondition) : undefined;
  const parseInteger = (value?: string) => value && /^\d{1,9}$/.test(value) ? value : "";
  const initialFilters = {
    search: (params.search ?? "").slice(0, 80),
    category: (categories.some((item) => item.slug === params.category) || catalogueCategories.some((item) => item.slug === params.category)) ? params.category : "",
    brand: (params.brand ?? "").slice(0, 50),
    condition: condition ?? "",
    minPrice: parseInteger(params.min), maxPrice: parseInteger(params.max),
    cpu: (params.cpu ?? "").slice(0, 50), ram: parseInteger(params.ram), storage: parseInteger(params.storage),
    inStock: params.inStock === "1", sort: allowedSorts.has(params.sort ?? "") ? params.sort! : "featured",
    page: Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1)),
  };

  return (
    <main className="inner-page">
      <section className="page-hero page-hero-shop"><div className="container"><span className="eyebrow eyebrow-on-dark">THE CATALOGUE</span><h1>Find your next <em>laptop.</em></h1><p>{catalogue.mode === "live" ? "Browse the shop's currently published products, with listing details maintained by Mr LapShop." : catalogue.mode === "empty" ? "The live catalogue is connected. New products will appear here as soon as the shop publishes them." : "Browse the storefront preview. Real product availability, prices and specifications will appear when the shop publishes verified inventory."}</p><div className="breadcrumb"><span>Home</span><span>/</span><strong>Shop</strong></div></div></section>
      <ShopCatalog products={catalogue.products} categories={categories} mode={catalogue.mode} connectionWarning={catalogue.connectionWarning} initialFilters={initialFilters} />
    </main>
  );
}

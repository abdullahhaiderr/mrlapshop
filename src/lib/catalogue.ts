import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { demoProducts, type DemoProduct, type ProductCondition } from "@/data/products";

export type CatalogueMode = "live" | "empty" | "preview";
export type CatalogueSnapshot = {
  products: DemoProduct[];
  mode: CatalogueMode;
  connectionWarning?: boolean;
};

export type PublicCategory = {
  id?: string;
  name: string;
  slug: string;
  category_group: "Laptops" | "Accessories";
};

type ProductImageRow = { storage_path: string; alt_text: string; position: number };
type CategoryRelation = { name: string; slug: string; category_group?: "Laptops" | "Accessories" } | Array<{ name: string; slug: string; category_group?: "Laptops" | "Accessories" }> | null;
type ProductRow = {
  id: string; slug: string; brand: string; title: string; condition: "new" | "used" | "open_box";
  category_id?: string | null; series?: string | null; model?: string | null; cosmetic_grade?: string | null;
  cpu_family?: string | null; cpu_model?: string | null; generation?: string | null; ram_gb?: number | null;
  ram_type?: string | null; storage_gb?: number | null; storage_type?: string | null; screen_in?: number | null;
  resolution?: string | null; touch?: boolean; two_in_one?: boolean; gpu?: string | null; operating_system?: string | null;
  battery_note?: string | null; warranty_months?: number | null; warranty_terms?: string | null; price_pkr?: number | null;
  compare_at_pkr?: number | null; stock: number; featured: boolean; performance_pick?: boolean; short_description?: string | null;
  description?: string | null; created_at?: string; categories?: CategoryRelation; product_images?: ProductImageRow[];
};

const previewCategorySlug: Record<string, string> = {
  Apple: "macbook", HP: "hp", Dell: "dell", Lenovo: "lenovo", ASUS: "asus", Chromebook: "chromebook",
};

const previewProducts: DemoProduct[] = demoProducts.map((product) => ({
  ...product,
  isDemo: true,
  categorySlug: previewCategorySlug[product.brand] ?? product.category.toLowerCase().replaceAll(" ", "-"),
  images: [{ url: product.image, alt: `Illustrative placeholder image for ${product.brand} ${product.name}` }],
}));

function titleCondition(condition: ProductRow["condition"]): ProductCondition {
  if (condition === "open_box") return "Open Box";
  return condition === "used" ? "Used" : "New";
}

function relationCategory(value: CategoryRelation): { name: string; slug: string } | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function mapProduct(row: ProductRow, supabase: Awaited<ReturnType<typeof createClient>>): DemoProduct {
  const category = relationCategory(row.categories ?? null);
  const imageRows = [...(row.product_images ?? [])].sort((a, b) => a.position - b.position);
  const images = imageRows.map((item) => ({
    url: supabase.storage.from("product-images").getPublicUrl(item.storage_path).data.publicUrl,
    alt: item.alt_text,
  }));
  const specs = [
    row.cpu_model || row.cpu_family,
    row.ram_gb ? `${row.ram_gb} GB RAM${row.ram_type ? ` · ${row.ram_type}` : ""}` : null,
    row.storage_gb ? `${row.storage_gb} GB ${row.storage_type || "storage"}` : null,
    row.screen_in ? `${row.screen_in}-inch display${row.resolution ? ` · ${row.resolution}` : ""}` : null,
    row.gpu,
    row.operating_system,
    row.cosmetic_grade ? `Grade ${row.cosmetic_grade}` : null,
    row.battery_note,
  ].filter((value): value is string => Boolean(value));
  const warrantyLabel = row.warranty_months === null || row.warranty_months === undefined
    ? "Warranty to be confirmed"
    : row.warranty_months === 0 ? "No warranty" : `${row.warranty_months}-month warranty`;

  return {
    id: row.id,
    slug: row.slug,
    brand: row.brand,
    name: row.title,
    category: category?.name ?? "Technology",
    categorySlug: category?.slug ?? "",
    image: images[0]?.url ?? "/images/product-photo-pending.svg",
    images,
    specs,
    condition: titleCondition(row.condition),
    featured: row.featured,
    performancePick: Boolean(row.performance_pick),
    note: row.description || row.short_description || "",
    warrantyLabel,
    isDemo: false,
    pricePkr: row.price_pkr === null || row.price_pkr === undefined ? null : Number(row.price_pkr),
    compareAtPricePkr: row.compare_at_pkr === null || row.compare_at_pkr === undefined ? null : Number(row.compare_at_pkr),
    stock: Number(row.stock),
    shortDescription: row.short_description,
    description: row.description,
    cpuFamily: row.cpu_family,
    ramGb: row.ram_gb,
    storageGb: row.storage_gb,
    screenIn: row.screen_in,
    createdAt: row.created_at,
    tag: undefined,
  };
}

export async function getPublicCatalogue(): Promise<CatalogueSnapshot> {
  if (!isSupabaseConfigured()) return { products: previewProducts, mode: "preview" };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, brand, title, condition, category_id, series, model, cosmetic_grade, cpu_family, cpu_model, generation, ram_gb, ram_type, storage_gb, storage_type, screen_in, resolution, touch, two_in_one, gpu, operating_system, battery_note, warranty_months, warranty_terms, price_pkr, compare_at_pkr, stock, featured, performance_pick, short_description, description, created_at, categories(name, slug), product_images(storage_path, alt_text, position)")
      .eq("status", "active")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(250);
    if (error) throw error;
    const products = ((data ?? []) as unknown as ProductRow[]).map((row) => mapProduct(row, supabase));
    return { products, mode: products.length ? "live" : "empty" };
  } catch {
    return { products: previewProducts, mode: "preview", connectionWarning: true };
  }
}

export async function getPublicProductBySlug(slug: string): Promise<{ product: DemoProduct | null; related: DemoProduct[]; mode: CatalogueMode }> {
  const snapshot = await getPublicCatalogue();
  const product = snapshot.products.find((item) => item.slug === slug) ?? null;
  if (!product) return { product: null, related: [], mode: snapshot.mode };
  const related = snapshot.products
    .filter((item) => item.id !== product.id && (item.brand === product.brand || item.categorySlug === product.categorySlug || item.category === product.category))
    .slice(0, 4);
  return { product, related, mode: snapshot.mode };
}

export async function getPublicCategories(): Promise<PublicCategory[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("categories").select("id, name, slug, category_group").eq("is_active", true).order("sort_order").limit(100);
    if (error) throw error;
    return (data ?? []) as PublicCategory[];
  } catch {
    return [];
  }
}

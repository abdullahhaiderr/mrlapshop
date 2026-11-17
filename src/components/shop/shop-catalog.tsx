"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import type { DemoProduct } from "@/data/products";
import { ProductCard } from "@/components/product/product-card";
import type { PublicCategory, CatalogueMode } from "@/lib/catalogue";
import { catalogueCategories } from "@/config/store";

type Filters = { search: string; category: string; brand: string; condition: string; minPrice: string; maxPrice: string; cpu: string; ram: string; storage: string; inStock: boolean; sort: string; page: number };
type Props = { products: DemoProduct[]; categories: PublicCategory[]; mode: CatalogueMode; connectionWarning?: boolean; initialFilters: Partial<Filters> };
const conditions = ["All conditions", "New", "Used", "Open Box"];
const pageSize = 12;

export function ShopCatalog({ products, categories, mode, connectionWarning, initialFilters }: Props) {
  const [filters, setFilters] = useState<Filters>({
    search: initialFilters.search ?? "", category: initialFilters.category ?? "", brand: initialFilters.brand ?? "",
    condition: initialFilters.condition ?? "", minPrice: initialFilters.minPrice ?? "", maxPrice: initialFilters.maxPrice ?? "",
    cpu: initialFilters.cpu ?? "", ram: initialFilters.ram ?? "", storage: initialFilters.storage ?? "",
    inStock: initialFilters.inStock ?? false, sort: initialFilters.sort ?? "featured", page: Math.max(1, initialFilters.page ?? 1),
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const categoryOptions = categories.length ? categories : catalogueCategories.map((item) => ({ name: item.label, slug: item.slug, category_group: item.group as "Laptops" | "Accessories" }));
  const brands = useMemo(() => ["All brands", ...Array.from(new Set(products.map((item) => item.brand))).sort((a, b) => a.localeCompare(b))], [products]);
  const ramOptions = useMemo(() => Array.from(new Set(products.map((item) => item.ramGb).filter((value): value is number => typeof value === "number"))).sort((a, b) => a - b), [products]);
  const storageOptions = useMemo(() => Array.from(new Set(products.map((item) => item.storageGb).filter((value): value is number => typeof value === "number"))).sort((a, b) => a - b), [products]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.category) params.set("category", filters.category);
    if (filters.brand) params.set("brand", filters.brand);
    if (filters.condition) params.set("condition", filters.condition.toLowerCase().replaceAll(" ", "-"));
    if (filters.minPrice) params.set("min", filters.minPrice);
    if (filters.maxPrice) params.set("max", filters.maxPrice);
    if (filters.cpu) params.set("cpu", filters.cpu);
    if (filters.ram) params.set("ram", filters.ram);
    if (filters.storage) params.set("storage", filters.storage);
    if (filters.inStock) params.set("inStock", "1");
    if (filters.sort !== "featured") params.set("sort", filters.sort);
    if (filters.page > 1) params.set("page", String(filters.page));
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/shop?${query}` : "/shop");
  }, [filters]);

  const filteredProducts = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const min = filters.minPrice ? Number(filters.minPrice) : null;
    const max = filters.maxPrice ? Number(filters.maxPrice) : null;
    const filtered = products.filter((product) => {
      const searchable = `${product.brand} ${product.name} ${product.category} ${product.specs.join(" ")} ${product.condition} ${product.cpuFamily ?? ""}`.toLowerCase();
      if (query && !searchable.includes(query)) return false;
      if (filters.category && product.categorySlug !== filters.category) return false;
      if (filters.brand && filters.brand !== "All brands" && product.brand.toLowerCase() !== filters.brand.toLowerCase()) return false;
      if (filters.condition && filters.condition !== "All conditions" && product.condition !== filters.condition) return false;
      if (min !== null && (!Number.isFinite(min) || product.pricePkr == null || product.pricePkr < min)) return false;
      if (max !== null && (!Number.isFinite(max) || product.pricePkr == null || product.pricePkr > max)) return false;
      if (filters.cpu && !`${product.cpuFamily ?? ""} ${product.specs.join(" ")}`.toLowerCase().includes(filters.cpu.toLowerCase())) return false;
      if (filters.ram && product.ramGb !== Number(filters.ram)) return false;
      if (filters.storage && product.storageGb !== Number(filters.storage)) return false;
      if (filters.inStock && !(Number(product.stock) > 0)) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      if (filters.sort === "price-asc") return (a.pricePkr ?? Number.MAX_SAFE_INTEGER) - (b.pricePkr ?? Number.MAX_SAFE_INTEGER);
      if (filters.sort === "price-desc") return (b.pricePkr ?? -1) - (a.pricePkr ?? -1);
      if (filters.sort === "newest") return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      if (filters.sort === "name") return a.name.localeCompare(b.name);
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
  }, [products, filters]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(filters.page, pageCount);
  const visibleProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const set = (patch: Partial<Filters>) => setFilters((current) => ({ ...current, ...patch, page: 1 }));

  function clearFilters() {
    setFilters({ search: "", category: "", brand: "", condition: "", minPrice: "", maxPrice: "", cpu: "", ram: "", storage: "", inStock: false, sort: "featured", page: 1 });
  }

  return (
    <div className="container shop-catalog-wrap">
      <div className="shop-category-shortcuts" aria-label="Shop categories"><span>Browse:</span>{categoryOptions.slice(0, 12).map((item) => <button type="button" key={item.slug} aria-pressed={filters.category === item.slug} onClick={() => set({ category: filters.category === item.slug ? "" : item.slug })}><Tag size={12} aria-hidden="true" />{item.name}</button>)}</div>
      <div className="shop-toolbar">
        <label className="shop-search-field"><Search size={18} /><span className="sr-only">Search products</span><input value={filters.search} onChange={(event) => set({ search: event.target.value })} placeholder="Search by brand, model or specification" /></label>
        <button className="filter-toggle" type="button" onClick={() => setMobileFiltersOpen((open) => !open)}><SlidersHorizontal size={17} /> Filters</button>
        <label className="shop-sort-field">Sort by <select aria-label="Sort products" value={filters.sort} onChange={(event) => set({ sort: event.target.value })}><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name A–Z</option></select></label>
        <span className="result-count">{filteredProducts.length} {mode === "preview" ? "sample listings" : "products"}</span>
      </div>
      <div className="shop-layout">
        <aside className={`shop-filters${mobileFiltersOpen ? " shop-filters-open" : ""}`} aria-label="Catalogue filters">
          <div className="filter-heading"><h2>Filter products</h2><button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters"><X size={18} /></button></div>
          <label className="filter-label" htmlFor="category-filter">Category</label>
          <select id="category-filter" value={filters.category} onChange={(event) => set({ category: event.target.value })}><option value="">All categories</option>{categoryOptions.map((option) => <option key={option.slug} value={option.slug}>{option.name}</option>)}</select>
          <label className="filter-label" htmlFor="brand-filter">Brand</label>
          <select id="brand-filter" value={filters.brand || "All brands"} onChange={(event) => set({ brand: event.target.value === "All brands" ? "" : event.target.value })}>{brands.map((option) => <option key={option}>{option}</option>)}</select>
          <label className="filter-label" htmlFor="condition-filter">Condition</label>
          <select id="condition-filter" value={filters.condition || "All conditions"} onChange={(event) => set({ condition: event.target.value === "All conditions" ? "" : event.target.value })}>{conditions.map((option) => <option key={option}>{option}</option>)}</select>
          <div className="filter-price-grid"><label className="filter-label">Minimum price<input inputMode="numeric" type="number" min="0" value={filters.minPrice} onChange={(event) => set({ minPrice: event.target.value })} placeholder="Rs." /></label><label className="filter-label">Maximum price<input inputMode="numeric" type="number" min="0" value={filters.maxPrice} onChange={(event) => set({ maxPrice: event.target.value })} placeholder="Rs." /></label></div>
          <label className="filter-label" htmlFor="cpu-filter">Processor</label><input className="shop-filter-input" id="cpu-filter" value={filters.cpu} onChange={(event) => set({ cpu: event.target.value })} placeholder="e.g. Core i5, Ryzen 7" />
          <label className="filter-label" htmlFor="ram-filter">RAM</label><select id="ram-filter" value={filters.ram} onChange={(event) => set({ ram: event.target.value })}><option value="">Any RAM</option>{ramOptions.map((value) => <option key={value} value={value}>{value} GB</option>)}</select>
          <label className="filter-label" htmlFor="storage-filter">Storage</label><select id="storage-filter" value={filters.storage} onChange={(event) => set({ storage: event.target.value })}><option value="">Any storage</option>{storageOptions.map((value) => <option key={value} value={value}>{value} GB</option>)}</select>
          <label className="filter-stock-check"><input type="checkbox" checked={filters.inStock} onChange={(event) => set({ inStock: event.target.checked })} /> In-stock products only</label>
          <div className="filter-note"><span className="filter-note-icon"><SlidersHorizontal size={16} /></span><p>{mode === "live" ? "These filters use the product details and stock currently published by the shop." : "The preview catalogue contains sample items only. Live filters become active when the database is connected and products are published."}</p></div>
          <button className="clear-filters" type="button" onClick={clearFilters}>Clear all filters</button>
        </aside>
        <div className="shop-results">
          {mode === "preview" && <div className="catalog-disclaimer"><strong>Sample catalogue</strong><span>{connectionWarning ? "The live catalogue could not be reached, so this clearly labelled preview is shown." : "These six placeholder laptop listings are examples, not current stock, prices or orderable products."}</span></div>}
          {mode === "empty" && <div className="catalog-disclaimer"><strong>Live catalogue</strong><span>The shop has not published products yet. Check back soon for current inventory.</span></div>}
          {visibleProducts.length > 0 ? <div className="product-grid shop-product-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-results"><span className="empty-results-icon"><Search size={25} /></span><h3>No matching products</h3><p>Try another search or clear your filters to explore the available catalogue.</p><button className="button button-dark" onClick={clearFilters} type="button">Clear filters</button></div>}
          {pageCount > 1 && <nav className="catalog-pagination" aria-label="Catalogue pages"><button type="button" disabled={currentPage <= 1} onClick={() => setFilters((current) => ({ ...current, page: currentPage - 1 }))}><ChevronLeft size={16}/> Previous</button><span>Page {currentPage} of {pageCount}</span><button type="button" disabled={currentPage >= pageCount} onClick={() => setFilters((current) => ({ ...current, page: currentPage + 1 }))}>Next <ChevronRight size={16}/></button></nav>}
        </div>
      </div>
    </div>
  );
}

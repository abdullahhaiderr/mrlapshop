export type ProductCondition = "New" | "Used" | "Open Box";
export type DemoProduct = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  category: string;
  categorySlug?: string;
  isDemo?: boolean;
  pricePkr?: number | null;
  compareAtPricePkr?: number | null;
  stock?: number;
  images?: Array<{ url: string; alt: string }>;
  shortDescription?: string | null;
  description?: string | null;
  cpuFamily?: string | null;
  ramGb?: number | null;
  storageGb?: number | null;
  screenIn?: number | null;
  createdAt?: string;
  image: string;
  specs: string[];
  condition: ProductCondition;
  featured?: boolean;
  performancePick?: boolean;
  tag?: string;
  note: string;
  warrantyLabel: string;
};

// Six illustrative laptop catalogue records. They are not live inventory:
// model configurations, prices, stock and warranty must be entered by the owner.
export const demoProducts: DemoProduct[] = [
  {
    id: "demo-apple-air",
    isDemo: true,
    slug: "sample-macbook-air",
    brand: "Apple",
    name: "MacBook Air — Sample Unit",
    category: "MacBook",
    image: "/images/laptop-01.webp",
    specs: ["macOS", "Configuration to be added", "Lightweight range"],
    condition: "Open Box",
    featured: true,
    tag: "Sample listing",
    note: "Illustrative placeholder only. The owner will enter the exact model, chip, memory, storage, condition and warranty for each unit.",
    warrantyLabel: "Warranty set per unit",
  },
  {
    id: "demo-dell-latitude",
    isDemo: true,
    slug: "sample-dell-latitude",
    brand: "Dell",
    name: "Latitude Laptop — Sample Unit",
    category: "Business",
    image: "/images/laptop-02.webp",
    specs: ["Business range", "Configuration to be added", "Windows"],
    condition: "Used",
    featured: true,
    tag: "Sample listing",
    note: "Illustrative placeholder only. Confirm exact configuration, cosmetic condition, battery details and warranty with the store.",
    warrantyLabel: "Warranty set per unit",
  },
  {
    id: "demo-asus-gaming",
    isDemo: true,
    slug: "sample-asus-gaming",
    brand: "ASUS",
    name: "Gaming Laptop — Sample Unit",
    category: "Gaming",
    image: "/images/laptop-03.webp",
    specs: ["Gaming range", "Graphics details to be added", "Windows"],
    condition: "New",
    featured: true,
    tag: "Sample listing",
    note: "Illustrative placeholder only. Exact processor, graphics, memory, storage and warranty will be entered by the owner.",
    warrantyLabel: "Warranty set per unit",
  },
  {
    id: "demo-hp-probook",
    isDemo: true,
    slug: "sample-hp-business",
    brand: "HP",
    name: "HP Laptop — Sample Unit",
    category: "Business",
    image: "/images/laptop-04.webp",
    specs: ["Business range", "Configuration to be added", "Windows"],
    condition: "Used",
    featured: true,
    tag: "Sample listing",
    note: "Illustrative placeholder only. Exact model, processor generation, RAM, storage, condition and warranty will be entered by the owner.",
    warrantyLabel: "Warranty set per unit",
  },
  {
    id: "demo-lenovo-thinkpad",
    isDemo: true,
    slug: "sample-lenovo-thinkpad",
    brand: "Lenovo",
    name: "ThinkPad Laptop — Sample Unit",
    category: "Business",
    image: "/images/laptop-05.webp",
    specs: ["Business range", "Configuration to be added", "Windows"],
    condition: "Open Box",
    tag: "Sample listing",
    note: "Illustrative placeholder only. The listing is a design example, not a statement of current stock.",
    warrantyLabel: "Warranty set per unit",
  },
  {
    id: "demo-chromebook",
    isDemo: true,
    slug: "sample-chromebook",
    brand: "Chromebook",
    name: "Chromebook — Sample Device",
    category: "Chromebook",
    image: "/images/laptop-06.webp",
    specs: ["ChromeOS", "Configuration to be added", "Cloud-first range"],
    condition: "New",
    tag: "Sample listing",
    note: "Illustrative placeholder only. Confirm the manufacturer, model, configuration, condition and warranty before publishing real inventory.",
    warrantyLabel: "Warranty set per unit",
  },
];

export const brandNames = ["Apple", "HP", "Dell", "Lenovo", "ASUS", "Chromebook"] as const;


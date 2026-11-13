import { describe, expect, it } from "vitest";
import { brandNames, demoProducts } from "@/data/products";
import { catalogueCategories, store } from "@/config/store";

describe("Mr LapShop demo catalogue", () => {
  it("contains six clearly separate sample laptop listings", () => {
    expect(demoProducts).toHaveLength(6);
    expect(new Set(demoProducts.map((product) => product.id)).size).toBe(6);
    expect(demoProducts.every((product) => product.tag === "Sample listing")).toBe(true);
  });

  it("uses only the shop's three supported laptop conditions", () => {
    const allowed = new Set(store.productConditions);
    expect(demoProducts.every((product) => allowed.has(product.condition))).toBe(true);
    expect([...allowed]).toEqual(["New", "Used", "Open Box"]);
  });

  it("includes the confirmed laptop brands", () => {
    expect(brandNames).toEqual(["Apple", "HP", "Dell", "Lenovo", "ASUS", "Chromebook"]);
  });

  it("includes the laptop and accessory category entry points", () => {
    const labels = new Set<string>(catalogueCategories.map((category) => category.label));
    for (const label of ["Apple MacBooks", "HP laptops", "Dell laptops", "Lenovo laptops", "ASUS laptops", "Chromebooks", "Headphones", "Microphones", "Keyboards", "Mice", "Gaming consoles"]) {
      expect(labels.has(label)).toBe(true);
    }
  });
});

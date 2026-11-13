import { describe, expect, it } from "vitest";
import { canPublishProduct, getAllowedProductImageExtension } from "@/lib/admin/product-rules";

describe("product publishing rules", () => {
  it("requires a positive integer price and an explicit non-negative warranty decision", () => {
    expect(canPublishProduct(120000, 3)).toBe(true);
    expect(canPublishProduct(120000, 0)).toBe(true);
    expect(canPublishProduct(null, 3)).toBe(false);
    expect(canPublishProduct(0, 3)).toBe(false);
    expect(canPublishProduct(120000, null)).toBe(false);
    expect(canPublishProduct(120000.5, 3)).toBe(false);
    expect(canPublishProduct(120000, -1)).toBe(false);
  });
});

describe("product image signature validation", () => {
  it("accepts matching JPEG, PNG and WebP signatures", () => {
    expect(getAllowedProductImageExtension("image/jpeg", new Uint8Array([0xff, 0xd8, 0xff, 0x00]))).toBe("jpg");
    expect(getAllowedProductImageExtension("image/png", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("png");
    expect(getAllowedProductImageExtension("image/webp", new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]))).toBe("webp");
  });

  it("rejects a mismatched MIME type, unsupported format and fake extension payload", () => {
    expect(getAllowedProductImageExtension("image/png", new Uint8Array([0xff, 0xd8, 0xff]))).toBeNull();
    expect(getAllowedProductImageExtension("image/svg+xml", new Uint8Array([60, 115, 118, 103]))).toBeNull();
    expect(getAllowedProductImageExtension("image/jpeg", new Uint8Array([0, 0, 0]))).toBeNull();
  });
});

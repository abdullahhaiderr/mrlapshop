export type ProductImageExtension = "jpg" | "png" | "webp";

export function getAllowedProductImageExtension(mimeType: string, bytes: Uint8Array): ProductImageExtension | null {
  if (mimeType === "image/jpeg" && bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (mimeType === "image/png" && bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "png";
  if (mimeType === "image/webp" && bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "webp";
  return null;
}

export function canPublishProduct(pricePkr: number | null, warrantyMonths: number | null): boolean {
  return pricePkr !== null && Number.isInteger(pricePkr) && pricePkr > 0 && warrantyMonths !== null && Number.isInteger(warrantyMonths) && warrantyMonths >= 0;
}

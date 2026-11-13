/** Small, validated helpers for browser-only saved lists. These are not order records. */
export function parseStoredIdList(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((item): item is string =>
      typeof item === "string" && item.length > 0 && item.length <= 120,
    ))];
  } catch {
    return [];
  }
}

export function addUniqueId(ids: string[], id: string): string[] {
  if (!id || ids.includes(id)) return ids;
  return [...ids, id];
}

export function removeId(ids: string[], id: string): string[] {
  return ids.filter((item) => item !== id);
}

export type StoredCartItem = { productId: string; quantity: number };

export function parseStoredCart(value: string | null): StoredCartItem[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    const result = new Map<string, number>();
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const candidate = item as { productId?: unknown; quantity?: unknown };
      if (typeof candidate.productId !== "string" || candidate.productId.length < 1 || candidate.productId.length > 120) continue;
      if (typeof candidate.quantity !== "number" || !Number.isInteger(candidate.quantity) || candidate.quantity < 1 || candidate.quantity > 10) continue;
      result.set(candidate.productId, Math.min(10, (result.get(candidate.productId) ?? 0) + candidate.quantity));
    }
    return [...result].map(([productId, quantity]) => ({ productId, quantity }));
  } catch {
    return [];
  }
}

import { describe, expect, it } from "vitest";
import { addUniqueId, parseStoredCart, parseStoredIdList, removeId } from "@/lib/local-commerce";

describe("browser-saved product lists", () => {
  it("returns an empty list for missing or malformed storage", () => {
    expect(parseStoredIdList(null)).toEqual([]);
    expect(parseStoredIdList("not-json")).toEqual([]);
    expect(parseStoredIdList("{}" )).toEqual([]);
  });

  it("keeps only unique, bounded string IDs", () => {
    expect(parseStoredIdList(JSON.stringify(["a", "a", "b", 5, null, ""]))).toEqual(["a", "b"]);
  });

  it("adds an ID only once and removes it safely", () => {
    expect(addUniqueId(["a"], "b")).toEqual(["a", "b"]);
    expect(addUniqueId(["a"], "a")).toEqual(["a"]);
    expect(removeId(["a", "b"], "a")).toEqual(["b"]);
  });
});


describe("browser-saved cart", () => {
  it("returns an empty cart for missing or malformed storage", () => {
    expect(parseStoredCart(null)).toEqual([]);
    expect(parseStoredCart("not-json")).toEqual([]);
  });

  it("merges duplicate lines and ignores invalid quantities", () => {
    expect(parseStoredCart(JSON.stringify([
      { productId: "p1", quantity: 2 },
      { productId: "p1", quantity: 3 },
      { productId: "p2", quantity: 0 },
      { productId: "p3", quantity: 30 },
      { productId: "p4", quantity: 1.5 },
    ]))).toEqual([{ productId: "p1", quantity: 5 }]);
  });
});

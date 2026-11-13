import { describe, expect, it } from "vitest";
import { formatPKR } from "@/lib/format";

describe("formatPKR", () => {
  it("formats whole PKR values without decimal places", () => {
    expect(formatPKR(125000)).toBe("Rs. 125,000");
  });

  it("rejects negative or fractional values", () => {
    expect(() => formatPKR(-1)).toThrow(RangeError);
    expect(() => formatPKR(12.5)).toThrow(RangeError);
  });
});

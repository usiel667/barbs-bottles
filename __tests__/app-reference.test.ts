/**
 * Tests verifying that the APP_REFERENCE.md documentation accurately reflects
 * the actual codebase symbols, constants, and utility function behaviour.
 *
 * The reference document was added in this PR; these tests act as a living
 * contract so the doc stays in sync with the code it describes.
 */

import { describe, it, expect } from "vitest";

// ─── constants/ProductConstants.ts ──────────────────────────────────────────
import {
  BottleSizes,
  BottleMaterials,
  OrderStatuses,
  AvailableColors,
} from "@/constants/ProductConstants";

// ─── constants/StatesArray.ts ────────────────────────────────────────────────
import { StatesArray } from "@/constants/StatesArray";

// ─── lib/utils.ts ────────────────────────────────────────────────────────────
import { cn, formatPrice, formatDate } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// ProductConstants — BottleSizes
// ─────────────────────────────────────────────────────────────────────────────

describe("BottleSizes (constants/ProductConstants.ts)", () => {
  it("exports an array", () => {
    expect(Array.isArray(BottleSizes)).toBe(true);
  });

  it("contains exactly 5 entries as documented", () => {
    expect(BottleSizes).toHaveLength(5);
  });

  it("every entry has an id and description string", () => {
    for (const item of BottleSizes) {
      expect(typeof item.id).toBe("string");
      expect(typeof item.description).toBe("string");
    }
  });

  it("contains the documented size ids: 12oz, 16oz, 20oz, 24oz, 32oz", () => {
    const ids = BottleSizes.map((s) => s.id);
    expect(ids).toContain("12oz");
    expect(ids).toContain("16oz");
    expect(ids).toContain("20oz");
    expect(ids).toContain("24oz");
    expect(ids).toContain("32oz");
  });

  it("ids appear in ascending size order", () => {
    const ids = BottleSizes.map((s) => s.id);
    expect(ids).toEqual(["12oz", "16oz", "20oz", "24oz", "32oz"]);
  });

  it("has no duplicate ids", () => {
    const ids = BottleSizes.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ProductConstants — BottleMaterials
// ─────────────────────────────────────────────────────────────────────────────

describe("BottleMaterials (constants/ProductConstants.ts)", () => {
  it("exports an array", () => {
    expect(Array.isArray(BottleMaterials)).toBe(true);
  });

  it("contains exactly 4 entries as documented", () => {
    expect(BottleMaterials).toHaveLength(4);
  });

  it("every entry has an id and description string", () => {
    for (const item of BottleMaterials) {
      expect(typeof item.id).toBe("string");
      expect(typeof item.description).toBe("string");
    }
  });

  it("contains the documented material ids", () => {
    const ids = BottleMaterials.map((m) => m.id);
    expect(ids).toContain("stainless_steel");
    expect(ids).toContain("plastic");
    expect(ids).toContain("glass");
    expect(ids).toContain("aluminum");
  });

  it("has no duplicate ids", () => {
    const ids = BottleMaterials.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ProductConstants — OrderStatuses
// ─────────────────────────────────────────────────────────────────────────────

describe("OrderStatuses (constants/ProductConstants.ts)", () => {
  it("exports an array", () => {
    expect(Array.isArray(OrderStatuses)).toBe(true);
  });

  it("contains exactly 7 entries as documented", () => {
    expect(OrderStatuses).toHaveLength(7);
  });

  it("every entry has an id and description string", () => {
    for (const item of OrderStatuses) {
      expect(typeof item.id).toBe("string");
      expect(typeof item.description).toBe("string");
    }
  });

  it("contains the documented status ids", () => {
    const ids = OrderStatuses.map((s) => s.id);
    expect(ids).toContain("pending");
    expect(ids).toContain("designing");
    expect(ids).toContain("production");
    expect(ids).toContain("quality_check");
    expect(ids).toContain("shipped");
    expect(ids).toContain("delivered");
    expect(ids).toContain("cancelled");
  });

  it("contains statuses in the documented order", () => {
    const ids = OrderStatuses.map((s) => s.id);
    expect(ids).toEqual([
      "pending",
      "designing",
      "production",
      "quality_check",
      "shipped",
      "delivered",
      "cancelled",
    ]);
  });

  it("has no duplicate ids", () => {
    const ids = OrderStatuses.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ProductConstants — AvailableColors
// ─────────────────────────────────────────────────────────────────────────────

describe("AvailableColors (constants/ProductConstants.ts)", () => {
  it("exports an array", () => {
    expect(Array.isArray(AvailableColors)).toBe(true);
  });

  it("contains exactly 8 entries as documented", () => {
    expect(AvailableColors).toHaveLength(8);
  });

  it("every entry has an id and description string", () => {
    for (const item of AvailableColors) {
      expect(typeof item.id).toBe("string");
      expect(typeof item.description).toBe("string");
    }
  });

  it("contains the documented color ids", () => {
    const ids = AvailableColors.map((c) => c.id);
    expect(ids).toContain("black");
    expect(ids).toContain("white");
    expect(ids).toContain("blue");
    expect(ids).toContain("red");
    expect(ids).toContain("green");
    expect(ids).toContain("purple");
    expect(ids).toContain("pink");
    expect(ids).toContain("orange");
  });

  it("has no duplicate ids", () => {
    const ids = AvailableColors.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// StatesArray
// ─────────────────────────────────────────────────────────────────────────────

describe("StatesArray (constants/StatesArray.ts)", () => {
  it("exports an array", () => {
    expect(Array.isArray(StatesArray)).toBe(true);
  });

  it("contains all 50 US states plus DC (51 entries)", () => {
    expect(StatesArray).toHaveLength(51);
  });

  it("every entry has a 2-character id and a non-empty description", () => {
    for (const entry of StatesArray) {
      expect(typeof entry.id).toBe("string");
      expect(entry.id).toHaveLength(2);
      expect(typeof entry.description).toBe("string");
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });

  it("all ids are uppercase 2-letter codes", () => {
    for (const entry of StatesArray) {
      expect(entry.id).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("has no duplicate state ids", () => {
    const ids = StatesArray.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes DC (District of Columbia)", () => {
    const dc = StatesArray.find((s) => s.id === "DC");
    expect(dc).toBeDefined();
    expect(dc!.description).toBe("District Of Columbia");
  });

  it("includes a sample of well-known states with correct ids", () => {
    const ids = StatesArray.map((s) => s.id);
    expect(ids).toContain("CA");
    expect(ids).toContain("TX");
    expect(ids).toContain("NY");
    expect(ids).toContain("FL");
    expect(ids).toContain("WA");
    expect(ids).toContain("AK");
    expect(ids).toContain("HI");
  });

  it("maps state codes to correct full names for a representative sample", () => {
    const byId = Object.fromEntries(StatesArray.map((s) => [s.id, s.description]));
    expect(byId["AL"]).toBe("Alabama");
    expect(byId["CA"]).toBe("California");
    expect(byId["NY"]).toBe("New York");
    expect(byId["TX"]).toBe("Texas");
    expect(byId["WY"]).toBe("Wyoming");
  });

  it("boundary entry: first state is Alabama (AL)", () => {
    expect(StatesArray[0].id).toBe("AL");
    expect(StatesArray[0].description).toBe("Alabama");
  });

  it("boundary entry: last state is Wyoming (WY)", () => {
    const last = StatesArray[StatesArray.length - 1];
    expect(last.id).toBe("WY");
    expect(last.description).toBe("Wyoming");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// lib/utils — formatPrice
// ─────────────────────────────────────────────────────────────────────────────

describe("formatPrice (lib/utils.ts)", () => {
  it("formats a number to a USD currency string", () => {
    expect(formatPrice(12)).toBe("$12.00");
  });

  it("formats a string number to a USD currency string", () => {
    expect(formatPrice("12")).toBe("$12.00");
  });

  it("formats a decimal number correctly", () => {
    expect(formatPrice(9.99)).toBe("$9.99");
  });

  it("formats a string decimal correctly", () => {
    expect(formatPrice("9.99")).toBe("$9.99");
  });

  it("formats zero as $0.00", () => {
    expect(formatPrice(0)).toBe("$0.00");
  });

  it("formats zero string as $0.00", () => {
    expect(formatPrice("0")).toBe("$0.00");
  });

  it("formats a large price with thousands separator", () => {
    // e.g. 1000 → $1,000.00
    expect(formatPrice(1000)).toMatch(/^\$1[,.]000\.00$/);
  });

  it("returns a string regardless of numeric input", () => {
    expect(typeof formatPrice(42)).toBe("string");
    expect(typeof formatPrice("42")).toBe("string");
  });

  it("always starts with the dollar sign", () => {
    expect(formatPrice(5)).toMatch(/^\$/);
    expect(formatPrice("5")).toMatch(/^\$/);
  });

  it("handles a string with extra decimal places by rounding", () => {
    // Intl.NumberFormat rounds to 2 decimal places
    const result = formatPrice("10.999");
    expect(result).toBe("$11.00");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// lib/utils — formatDate
// ─────────────────────────────────────────────────────────────────────────────

describe("formatDate (lib/utils.ts)", () => {
  it("formats a Date object to a readable string", () => {
    // Jan 4, 2026 — the example shown in APP_REFERENCE.md
    const date = new Date("2026-01-04T00:00:00Z");
    const result = formatDate(date);
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/4/);
    expect(result).toMatch(/2026/);
  });

  it("formats an ISO date string to a readable string", () => {
    const result = formatDate("2026-01-04");
    expect(result).toMatch(/2026/);
  });

  it("returns a string", () => {
    expect(typeof formatDate(new Date())).toBe("string");
    expect(typeof formatDate("2024-06-15")).toBe("string");
  });

  it("includes a short month name (3 characters)", () => {
    // short month format used in the doc example: "Jan 4, 2026"
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const result = formatDate(new Date("2025-07-20"));
    const hasShortMonth = months.some((m) => result.includes(m));
    expect(hasShortMonth).toBe(true);
  });

  it("includes the numeric day", () => {
    const result = formatDate(new Date("2025-07-20"));
    expect(result).toMatch(/20/);
  });

  it("includes the 4-digit year", () => {
    const result = formatDate(new Date("2025-07-20"));
    expect(result).toMatch(/2025/);
  });

  it("handles a Date string in YYYY-MM-DD format", () => {
    const result = formatDate("2024-03-15");
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/Mar/);
  });

  it("boundary: formats a Date at the start of the year", () => {
    const result = formatDate(new Date("2025-01-01T12:00:00Z"));
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/2025/);
  });

  it("boundary: formats a Date at the end of the year", () => {
    const result = formatDate(new Date("2025-12-31T12:00:00Z"));
    expect(result).toMatch(/Dec/);
    expect(result).toMatch(/2025/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// lib/utils — cn
// ─────────────────────────────────────────────────────────────────────────────

describe("cn (lib/utils.ts)", () => {
  it("returns a string", () => {
    expect(typeof cn("foo", "bar")).toBe("string");
  });

  it("merges multiple class names", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toContain("text-red-500");
    expect(result).toContain("bg-blue-500");
  });

  it("deduplicates conflicting Tailwind classes (tailwind-merge behaviour)", () => {
    // tailwind-merge: later wins for the same utility group
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
    expect(result).not.toContain("text-red-500");
  });

  it("handles conditional classes via clsx (falsy values are omitted)", () => {
    const result = cn("base", false && "omitted", "included");
    expect(result).toContain("base");
    expect(result).toContain("included");
    expect(result).not.toContain("omitted");
  });

  it("handles undefined and null without throwing", () => {
    expect(() => cn(undefined, null as unknown as string, "ok")).not.toThrow();
  });

  it("returns empty string when called with no arguments", () => {
    expect(cn()).toBe("");
  });

  it("handles arrays of classes (clsx feature)", () => {
    const result = cn(["class-a", "class-b"]);
    expect(result).toContain("class-a");
    expect(result).toContain("class-b");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cross-cutting: shape contract shared by ProductConstants and StatesArray
// ─────────────────────────────────────────────────────────────────────────────

describe("Shared { id, description } shape contract", () => {
  const collections = [
    { name: "BottleSizes", items: BottleSizes },
    { name: "BottleMaterials", items: BottleMaterials },
    { name: "OrderStatuses", items: OrderStatuses },
    { name: "AvailableColors", items: AvailableColors },
    { name: "StatesArray", items: StatesArray },
  ];

  for (const { name, items } of collections) {
    it(`${name}: every item has non-empty id and description`, () => {
      for (const item of items) {
        expect(item.id.length).toBeGreaterThan(0);
        expect(item.description.length).toBeGreaterThan(0);
      }
    });

    it(`${name}: ids are unique strings`, () => {
      const ids = items.map((i) => i.id);
      expect(ids.every((id) => typeof id === "string")).toBe(true);
      expect(new Set(ids).size).toBe(ids.length);
    });
  }
});
# Coldest Bottle Product Variables Reference

> Source: [coldest.com](https://coldest.com) — scraped May 2026
> Purpose: Map all real Coldest product attributes so the DB schema can be updated to match.

---

## Current Schema vs Coldest Reality

### `bottleSizeEnum` — Needs Update

**Current (incorrect):**
- 12oz, 16oz, 20oz, 24oz, 32oz

**Coldest actual sizes:**
- 6.7oz (Mini)
- 15oz (Limitless Ultra v8)
- 20oz (Tumbler v2)
- 24oz (Limitless Ultra v8)
- 36oz (Limitless Ultra v8, Universal)
- 46oz (Limitless Ultra v8)
- 64oz (Half Gallon)
- 128oz (1 Gallon)

### `bottleMaterialEnum` — Over-Scoped

**Current:**
- stainless_steel, plastic, glass, aluminum

**Coldest actual:**
- **Stainless steel only** — proprietary "Coldest Armor™" triple insulation
- Lead-free, PFAS-free, PFOA-free, PFOS-free, PFNA-free, PFPES-free, PTFE-free
- Plastic, glass, and aluminum do not apply

---

## All Product Variables from Coldest

### 1. Product Line / Series

Coldest organizes bottles into distinct product lines:

| Series | Description |
|---|---|
| **Limitless Ultra v8** | Main flagship — bottle with handle, 3 lids included |
| **Universal** | Handle-less bottle, sleek/minimal design, 3 lids included |
| **Tumbler v2** | Tumbler-style drinkware |
| **Sports Bottles** | Traditional sports bottle form factor |
| **Mini** | 6.7oz compact/attachable bottle |
| **Jugs** | Half gallon (64oz) and full gallon (128oz) |

### 2. Version

Products are versioned as they improve each year:
- **v7** — previous generation (colors marked with "+" suffix)
- **v8** — current generation (Ultra suffix on colors)

### 3. Sizes & Pricing

| Size  | Product Line       | MSRP | Sale Price | Reviews |
| ----- | ------------------ | ---- | ---------- | ------- |
| 15oz  | Limitless Ultra v8 | $54  | $45        | 842     |
| 24oz  | Limitless Ultra v8 | $50  | $50        | 1,575   |
| 36oz  | Limitless Ultra v8 | $68  | $55        | 2,770   |
| 46oz  | Limitless Ultra v8 | $80  | $65        | 4,550   |
| 36oz  | Universal          | $50  | $40-$46    | 725     |
| 20oz  | Tumbler v2         | $40  | $35        | 930     |
| 6.7oz | Mystery Mini       | $12  | $10        | 1,082   |

### 4. Colors / Designs

Coldest uses **100+ artistic print designs**, not simple colors. Each design name has an "Ultra" suffix for v8 products. Examples:

**Sample designs:**
- Irises Ultra
- Stealth Black Ultra
- Starry Night Ultra
- Glossy Pink Ultra
- The Marrakech Ultra
- Polished Steel Ultra
- Rocketship Alloy Ultra
- Moonlight Mermaid Ultra
- The Great Wave Ultra
- Stung by a Bee Ultra
- Red Luna Ultra
- Gold Dragon Ultra
- Baby Fireflies Ultra

> **Note:** New color drops happen **every Thursday**. The design catalog is constantly growing.

### 5. Included Lids

Different products come with different lid combinations:

**Limitless Ultra v8 (3 lids):**
- Sports Lid
- Sip Lid + Bunker
- Chug Lid + Infuser

**Universal (3 lids):**
- Sports Lid
- Chug Lid
- Loop Lid

**Cold retention varies by lid type:**
- Chug Lid v1.0: 36+ hours cold
- Flip Top Lid v4.0: 36+ hours cold
- Sip Lid v1.0: 24+ hours cold (open top)

### 6. Performance Specs

| Spec | Value |
|---|---|
| Cold Retention | 36+ hours (up to 100+ hours on gallon) |
| Hot Retention | 13+ hours |
| Leak Proof | 100% (lab tested) — Chug & Flip Top lids |
| Insulation | Triple insulated (Coldest Armor™) |
| Floats | Yes |
| Cupholder Fit | 99% for Limitless/Universal; 80% for some Sport sizes |

### 7. Physical Attributes

| Attribute              | Notes                                                                             |
| ---------------------- | --------------------------------------------------------------------------------- |
| Has Handle             | Limitless = Yes, Universal = No, Sports = No                                      |
| Non-slip Rubber Bottom | Yes (all models)                                                                  |
| Dimensions             | 36oz Limitless: H-12.12" × W-2.6"                                                 |
| Cirkul Compatible      | Yes (wide mouth models: 14oz, 18oz, 24oz, 32oz, 40oz, 64oz, Universal, Limitless) |
| Paracord Handle        | Optional add-on ($12-$15)                                                         |
| Attachable Minis       | Yes (Limitless)                                                                   |

### 8. Coating Type & Care

Coating type determines dishwasher safety:

| Coating | Dishwasher Safe? |
|---|---|
| Powder Coat | ✅ Yes (top rack) |
| Glitter | ❌ No |
| Patterns | ❌ No |
| Glossy Paint | ❌ No |

**General care:**
- Hand wash recommended for all
- Do not freeze or microwave
- Clean regularly, especially after non-water drinks
- Dirty lids: soak 30 min in vinegar/soap + warm water

### 9. Warranty & Returns

- **Warranty:** Lifetime
- **Returns:** 30-day full refund
- **Close-out items:** Final sale, no returns

### 10. Rating & Reviews

Products carry visible ratings:
- Average rating (e.g. 4.8 / 5.0)
- Verified review count (e.g. 2,770 reviews)
- 150,000+ total verified reviews across all products

---

## Diagram: How Variables Connect to a Product

```
┌──────────────────────────────────────────────────┐
│                    PRODUCT                        │
├──────────────────────────────────────────────────┤
│  name              "COLDEST 36oz Limitless Ultra" │
│  series            "Limitless Ultra"              │
│  version           "v8"                           │
│  size              "36oz"                         │
│  material          "stainless_steel"              │
│  insulation        "Coldest Armor™ Triple"        │
│                                                   │
│  msrpPrice         $68.00                         │
│  salePrice         $55.00                         │
│                                                   │
│  coatingType       "pattern" | "powder" | ...     │
│  dishwasherSafe    depends on coatingType         │
│                                                   │
│  hasHandle         true                           │
│  rubberBottom      true                           │
│  floats            true                           │
│  cirkulCompatible  true                           │
│  cupholderFit      "99%"                          │
│                                                   │
│  coldHours         36                             │
│  hotHours          13                             │
│  leakProof         true                           │
│                                                   │
│  includedLids      ["Sports", "Sip+Bunker",       │
│                     "Chug+Infuser"]               │
│  lidCount          3                              │
│                                                   │
│  dimensions        { h: "12.12in", w: "2.6in" }  │
│  warranty          "lifetime"                     │
│                                                   │
│  designs[]  ──────────────────────────────┐       │
│             Available color/art options    │       │
│             (100+ per product)            │       │
│                                           ▼       │
│  ┌─────────────────────────────────────────┐      │
│  │  DESIGN                                 │      │
│  │  name: "Starry Night Ultra"             │      │
│  │  coatingType: "pattern"                 │      │
│  │  imageUrl: "https://..."                │      │
│  │  isNew: false                           │      │
│  │  dropDate: "2025-03-13"                 │      │
│  └─────────────────────────────────────────┘      │
│                                                   │
│  rating            4.8                            │
│  reviewCount       2770                           │
│  active            true                           │
└──────────────────────────────────────────────────┘
```

---

## Existing Schema Fields That Still Work

These current `products` table fields are still valid:
- `id` — primary key
- `name` — product name
- `description` — product description
- `basePrice` — maps to sale price
- `colors` — rename to `designs` (JSON array of design names)
- `features` — JSON array, still useful for misc features
- `designTemplate` — URL to design template
- `designPreview` — URL to preview image
- `designVariations` — JSON array of variation URLs
- `active` — product active status
- `createdAt` / `updatedAt` — timestamps

## Fields That Need Changing

- `size` enum → update values to match Coldest sizes
- `material` enum → simplify or remove (everything is stainless steel)
- `colors` → rename to `designs` to reflect artistic prints

## New Fields Needed

- `series` — product line (Limitless Ultra, Universal, etc.)
- `version` — product version (v7, v8)
- `msrpPrice` — original/compare-at price
- `coatingType` — powder_coat, glitter, pattern, glossy
- `dishwasherSafe` — boolean (derived from coating, but useful to store)
- `hasHandle` — boolean
- `coldRetentionHours` — integer
- `hotRetentionHours` — integer
- `leakProof` — boolean
- `cupholderFit` — varchar (e.g. "99%", "80%", "no")
- `cirkulCompatible` — boolean
- `includedLids` — JSON array of lid names
- `lidCount` — integer
- `dimensions` — JSON object or separate height/width fields
- `warranty` — varchar (e.g. "lifetime")
- `rating` — decimal
- `reviewCount` — integer

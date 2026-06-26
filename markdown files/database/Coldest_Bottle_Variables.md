# Coldest Bottle Product Variables Reference

> Source: [coldest.com](https://coldest.com) — scraped May 2026, updated June 2026  
> Purpose: Map all real Coldest product attributes so the DB schema can be updated to match.  
> Last gap-fill: compared against live sitemap and collections index June 2026.

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
- 32oz (Go Series) ← **new, was missing**
- 36oz (Limitless Ultra v8, Universal, First Responder)
- 46oz (Limitless Ultra v8, First Responder)
- 64oz (Half Gallon / Jug)
- 128oz (1 Gallon / Jug)

> **Note:** 32oz was not in the original plan. The "Go Series" uses this size. Add it to `bottleSizeEnum`.

### `bottleMaterialEnum` — Over-Scoped

**Current:**
- stainless_steel, plastic, glass, aluminum

**Coldest actual:**
- **Stainless steel only** — proprietary "Coldest Armor™" triple insulation
- Lead-free, PFAS-free, PFOA-free, PFOS-free, PFNA-free, PFPES-free, PTFE-free
- Plastic, glass, and aluminum do not apply

---

## All Product Lines / Series

Coldest organizes bottles into distinct product lines. The `series` field maps to one of these:

| Series | Description | Has Handle | Sizes |
|---|---|---|---|
| **Limitless Ultra v8** | Main flagship — bottle with handle, 3 lids included | Yes | 15oz, 24oz, 36oz, 46oz |
| **Universal** | Handle-less bottle, sleek/minimal design, 3 lids included | No | 36oz |
| **Tumbler v2** | Tumbler-style drinkware | No | 20oz |
| **Go Series** | Compact on-the-go bottle — 32oz ← **new** | Unknown | 32oz |
| **Sports Bottles** | Traditional sports bottle form factor ← **was missing** | No | Various |
| **Mini** | 6.7oz compact/attachable bottle | No | 6.7oz |
| **Jugs** | Half gallon and full gallon | Yes | 64oz, 128oz |
| **First Responder** | Military/first-responder themed limited edition | Yes | 36oz, 46oz |

> **ProductSeries constant needs:** Add `"Go Series"` and `"Sports Bottles"`. Rename `"Limitless Gallon"` to `"Jugs"` if you want to match site language, or keep as-is.

### Version (v7 vs v8)

- **v8** — current generation (design names carry "Ultra" suffix)
- **v7** — previous generation (design names carry "+" suffix). **v7 products are still live on the site** (`/products/coldest-limitless-36oz-tumbler-v7`, `/products/coldest-limitless-46oz-tumbler-v7`). They show under `/collections/legacy-drops`.
- The `version` field should be stored on each product row.

### Mystery / Blind-Box Products

Coldest sells "mystery" versions of most bottles where the customer doesn't choose the design — they receive a surprise color. These live at `/collections/mystery` and have their own product URLs:

- `/products/coldest-mystery-mini-collectable` — Mystery Mini 6.7oz (~$10–12)
- `/products/baby-mystery-mini` — Baby Mystery Mini (surprise color variant)
- `/products/mystery-limitless-gallon` — Mystery Gallon
- `/products/mystery-limitless-24oz-tumbler`, `36oz`, `46oz` — Mystery Limitless sizes

> For our purposes, mystery products are the same SKU with `isMysterySale: true` flag, or a separate product row with no `selectedColor`. Decide at implementation time.

---

## Sizes, Pricing & Reviews

| Size | Series | MSRP | Sale Price | Reviews | Notes |
|---|---|---|---|---|---|
| 15oz | Limitless Ultra v8 | $54 | $45 | 842 | |
| 24oz | Limitless Ultra v8 | $50 | $50 | 1,575 | No discount currently |
| 36oz | Limitless Ultra v8 | $68 | $55 | 2,770 | |
| 46oz | Limitless Ultra v8 | $80 | $65 | 4,550 | |
| 20oz | Tumbler v2 | $40 | ~$35 | 930 | Seed has $29.99 — verify against live site |
| 32oz | Go Series | Unknown | Unknown | Unknown | New — not yet seeded |
| 36oz | Universal | $50 | $40–$46 | 725 | Price varies by design |
| 6.7oz | Mini (regular) | ~$30 | ~$29.99 | — | Standard retail mini |
| 6.7oz | Mini (mystery) | $12 | $10 | 1,082 | Blind-box, surprise design |
| 64oz | Jugs | Unknown | Unknown | Unknown | Half gallon — not yet seeded |
| 128oz | Jugs | $130 | $115 | 350 | |
| 36oz | First Responder | $75 | $68 | — | |
| 46oz | First Responder | $75 | $75 | — | No discount |

> **Mini price note:** The $10 mystery mini and the ~$29.99 regular mini are different products on the site. Our seed has "Coldest Mini 6.7oz" at $29.99, which matches the regular retail mini — that is likely correct. The mystery mini should be a separate product row if we want to track it.

> **Tumbler note:** Site lists ~$35 sale. Seed has $29.99. Verify before finalizing seed data.

---

## Design Names & Design Series

Coldest uses **100+ artistic print designs** per product, not simple colors. Each v8 design name carries the "Ultra" suffix. v7 designs carry a "+" suffix.

### Design Collections / Themes

The site groups designs into named series (from `/collections`):

| Collection | Description |
|---|---|
| **Core Colors** | Solid base colors (Stealth Black, Polished Steel, etc.) |
| **Matte Series** | Matte-finish solid colors |
| **Glitter Series** | Glitter-coat finishes |
| **Glow in Dark / Glowie** | Glow-in-the-dark prints (Glowie Turtle, Glowie Snowflakes, etc.) |
| **Glossy** | High-gloss paint finish (Glossy Pink, etc.) |
| **Nova Series** | Cosmic/space art prints |
| **Dream Series** | Soft dreamy art prints |
| **Dragon Series** | Dragon-themed prints |
| **Luna Collection** | Moon/lunar-themed prints |
| **Red Series** | Red-palette designs |
| **Legacy Drops** | Retired v7 designs still available |
| **New Drop / New Arrivals** | Latest Thursday design drops |
| **Best Sellers** | Top-selling designs across all products |

> **New color drops happen every Thursday.** The design catalog grows continuously.

### Sample Design Names (v8 "Ultra" suffix)

Irises Ultra · Stealth Black Ultra · Starry Night Ultra · Glossy Pink Ultra ·
The Marrakech Ultra · Polished Steel Ultra · Rocketship Alloy Ultra ·
Moonlight Mermaid Ultra · The Great Wave Ultra · Stung by a Bee Ultra ·
Red Luna Ultra · Gold Dragon Ultra · Glowie Baby Fireflies Ultra ·
Berry Bae Ultra · Pursuit of Winning Ultra · Water Lilies Ultra ·
Buzzer Beater Ultra · Clover Floral Ultra · The World Stage Ultra

---

## Coating Type

Coating determines dishwasher safety and care:

| coatingType | Dishwasher Safe? | Examples |
|---|---|---|
| `solid` | ✅ Yes (top rack) | Stealth Black, Polished Steel |
| `matte` | ✅ Yes (top rack) | Matte series |
| `powder_coat` | ✅ Yes (top rack) | General powder-coat solids |
| `pattern` | ❌ No | Starry Night, Irises, The Great Wave |
| `glossy` | ❌ No | Glossy Pink |
| `glitter` | ❌ No | Glitter series |
| `glow_in_dark` | ❌ No | Glowie Turtle, Glowie Snowflakes |

> `coatingType` belongs on the **design** level, not the product level — the same bottle can have designs with different coatings. Store on `designs` JSON object or a separate designs table.

---

## Lid Information

Different products come with different lid combinations:

**Limitless Ultra v8 (3 lids):**
- Sports Lid
- Sip Lid + Bunker
- Chug Lid + Infuser

**Universal (3 lids):**
- Sports Lid
- Chug Lid
- Loop Lid

**Tumbler v2:**
- Comes with lid (type varies by size)

**Cold retention varies by lid type:**
- Chug Lid v1.0: 36+ hours cold
- Flip Top Lid v4.0: 36+ hours cold
- Sip Lid v1.0: 24+ hours cold (open top)

---

## Performance Specs

| Spec | Value |
|---|---|
| Cold Retention | 36+ hours (standard); 100+ hours on gallon |
| Hot Retention | 13+ hours |
| Leak Proof | 100% (lab tested) — Chug & Flip Top lids only |
| Insulation | Triple insulated (Coldest Armor™) |
| Floats | Yes |
| Cupholder Fit | 99% for Limitless/Universal; 80% for some Sport sizes |

---

## Physical Attributes

| Attribute | Notes |
|---|---|
| Has Handle | Limitless = Yes, Universal = No, Sports = No, Go = Unknown |
| Mouth Type | Wide mouth (most models) vs. Standard mouth — affects Cirkul compatibility |
| Non-slip Rubber Bottom | Yes (all models) |
| Dimensions | 36oz Limitless: H-12.12" × W-2.6" |
| Cirkul Compatible | Yes (wide-mouth models: 14oz, 18oz, 24oz, 32oz, 40oz, 64oz, Universal, Limitless) |
| Cupholder Friendly | `/collections/cupholder-friendly` — confirmed collection |
| Paracord Handle | Optional add-on ($12–$15) |
| Attachable Minis | Yes (Limitless) |

---

## Coating & Care

**General care:**
- Hand wash recommended for all
- Do not freeze or microwave
- Clean regularly, especially after non-water drinks
- Dirty lids: soak 30 min in vinegar/soap + warm water

---

## Warranty & Returns

- **Warranty:** Lifetime
- **Returns:** 30-day full refund
- **Close-out items:** Final sale, no returns (`/collections/water-bottle-close-outs`)

---

## Rating & Reviews

Products carry visible ratings:
- Average rating (e.g. 4.8 / 5.0)
- Verified review count (e.g. 2,770 reviews)
- 150,000+ total verified reviews across all products

---

## Schema Fields — Full Reference

### Fields That Still Work (keep as-is)
- `id` — primary key
- `name` — product name
- `description` — product description
- `basePrice` — maps to sale price
- `designs` — renamed from `colors`; JSON array of `{ name, inStock }`
- `features` — JSON array, still useful for misc features
- `designTemplate` — URL to design template
- `designPreview` — URL to preview image
- `designVariations` — JSON array of variation URLs
- `active` — product active status
- `createdAt` / `updatedAt` — timestamps

### Fields Implemented in Schema Update Plan
- `series` — product line
- `msrpPrice` — compare-at price
- `hasHandle` — boolean
- `coldRetentionHours` — integer
- `hotRetentionHours` — integer
- `leakProof` — boolean
- `warranty` — varchar
- `rating` — decimal
- `reviewCount` — integer

### Fields Still Missing from Schema (identified here, not yet in plan)

| Field | Type | Priority | Notes |
|---|---|---|---|
| `version` | varchar(5) | High | `"v7"` or `"v8"` — v7 still sold under legacy drops |
| `mouthType` | varchar(20) | Medium | `"wide"` or `"standard"` — affects Cirkul compatibility |
| `cirkulCompatible` | boolean | Medium | wide-mouth models only |
| `cupholderFit` | varchar(10) | Low | `"99%"`, `"80%"`, `"no"` |
| `lidCount` | integer | Low | 3 for Limitless/Universal |
| `includedLids` | text (JSON) | Low | array of lid name strings |
| `dimensions` | text (JSON) | Low | `{ h: "12.12in", w: "2.6in" }` |
| `isMysterySale` | boolean | Low | blind-box mystery product flag |

> `coatingType` and `dishwasherSafe` belong on the **design object** (inside the `designs` JSON), not the product row, because coating varies per design on the same bottle.

---

## Diagram: How Variables Connect to a Product

```
┌──────────────────────────────────────────────────┐
│                    PRODUCT                        │
├──────────────────────────────────────────────────┤
│  name              "COLDEST 36oz Limitless Ultra" │
│  series            "Limitless Ultra v8"           │
│  version           "v8"                           │
│  size              "36oz"                         │
│  material          "stainless_steel"              │
│  insulation        "Coldest Armor™ Triple"        │
│                                                   │
│  msrpPrice         $68.00                         │
│  salePrice         $55.00                         │
│                                                   │
│  mouthType         "wide"                         │
│  hasHandle         true                           │
│  rubberBottom      true                           │
│  floats            true                           │
│  cirkulCompatible  true                           │
│  cupholderFit      "99%"                          │
│  isMysterySale     false                          │
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
│             Available art/color options   │       │
│             (100+ per product)            │       │
│                                           ▼       │
│  ┌─────────────────────────────────────────┐      │
│  │  DESIGN                                 │      │
│  │  name: "Starry Night Ultra"             │      │
│  │  coatingType: "pattern"                 │      │
│  │  dishwasherSafe: false                  │      │
│  │  imageUrl: "https://..."                │      │
│  │  isNew: false                           │      │
│  │  dropDate: "2025-03-13"                 │      │
│  │  inStock: true                          │      │
│  └─────────────────────────────────────────┘      │
│                                                   │
│  rating            4.8                            │
│  reviewCount       2770                           │
│  active            true                           │
└──────────────────────────────────────────────────┘
```

---

## Live Site URLs Reference

| Product | URL |
|---|---|
| 15oz Limitless Ultra v8 | `/products/15oz` |
| 24oz Limitless Ultra v8 | `/products/coldest-limitless-24oz-ultra-v8` |
| 36oz Limitless Ultra v8 | `/products/coldest-limitless-bottle` |
| 46oz Limitless Ultra v8 | `/products/coldest-limitless-bottle-46oz` |
| 20oz Tumbler v2 | `/products/tumbler` |
| 32oz Go Series | `/products/32oz-go` |
| 36oz Universal | `/products/36oz-coldest-universal-bottle` |
| 128oz Gallon | `/products/coldest-1-gallon-limitless-ultra` |
| First Responder (36/46oz) | `/products/first-responders-military-limited-edition` |
| Mini 6.7oz (mystery) | `/products/coldest-mystery-mini-collectable` |
| Baby Mystery Mini | `/products/baby-mystery-mini` |
| v7 36oz (legacy) | `/products/coldest-limitless-36oz-tumbler-v7` |
| v7 46oz (legacy) | `/products/coldest-limitless-46oz-tumbler-v7` |
| Go Series collection | `/collections/32oz-go-series` |
| v8 collection | `/collections/v8` |
| Legacy drops (v7) | `/collections/legacy-drops` |
| Mystery products | `/collections/mystery` |

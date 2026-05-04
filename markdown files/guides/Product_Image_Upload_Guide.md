# Product Image Upload — Integration Guide

**Do this after products and orders are fully built.**
This is a standalone feature — it does not affect orders, customers, or any existing product logic.

---

## What Needs to Change

| Layer | Change | Complexity |
|-------|--------|------------|
| `db/schema.ts` | Add nullable `imageUrl` column to products table | Low |
| Database | Run a new Drizzle migration | Low |
| `zod-schema/product.ts` | Add `imageUrl` to insert/update schemas | Low |
| Upload service | Install and configure UploadThing | Medium |
| `actions.ts` | No changes needed — imageUrl saves like any text field | None |
| `ProductForm.tsx` | Add image upload input and preview | Medium |
| `products/page.tsx` | Add image thumbnail column to list | Low |

---

## Recommended Service — UploadThing

UploadThing is purpose-built for Next.js, has a generous free tier, and handles storage so you don't need S3 or Cloudinary configuration.

- Dashboard: https://uploadthing.com/dashboard
- Docs: https://docs.uploadthing.com/getting-started/appdir

---

## Step 1 — Add `imageUrl` to the Schema

**File:** `db/schema.ts`

Add one line inside the `products` table definition, after `active`:

```ts
// before
active: boolean("active").notNull().default(true),

// after
active: boolean("active").notNull().default(true),
imageUrl: text("image_url"),
```

It is nullable by default (no `.notNull()`) so existing products are not affected.

---

## Step 2 — Run the Migration

In your terminal:

```bash
npm run db:generate
npm run db:migrate
```

This adds the column to the live database without touching any existing rows.

---

## Step 3 — Update `zod-schema/product.ts`

`createInsertSchema` will automatically pick up the new column from Drizzle, so no manual changes are needed to `insertProductSchema` or `updateProductSchema`. 

Verify by checking that `InsertProductType` now includes `imageUrl?: string | null` after regenerating types.

---

## Step 4 — Install UploadThing

```bash
npm install uploadthing @uploadthing/react
```

Add your UploadThing secret key to `.env.local`:

```env
UPLOADTHING_TOKEN=your_token_here
```

Get your token from: https://uploadthing.com/dashboard → your app → API Keys

---

## Step 5 — Create the Upload Route Handler

**New file:** `app/api/uploadthing/core.ts`

```ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
  productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

**New file:** `app/api/uploadthing/route.ts`

```ts
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({ router: ourFileRouter });
```

---

## Step 6 — Update `ProductForm.tsx`

Add the upload button and image preview. The uploaded URL gets stored in a hidden input so it submits with the rest of the form.

**Add to imports:**

```tsx
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { useState } from "react";
import Image from "next/image";
```

**Add state inside the component (after the `selectedColors` block):**

```tsx
const [imageUrl, setImageUrl] = useState<string>(product?.imageUrl ?? "");
```

**Add this field to the form (after the Active checkbox, before Submit):**

```tsx
{/* Product Image */}
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Product Image <span className="text-gray-400 font-normal">(optional)</span>
  </label>

  {/* Hidden input so imageUrl submits with the form */}
  <input type="hidden" name="imageUrl" value={imageUrl} />

  {/* Preview existing or newly uploaded image */}
  {imageUrl && (
    <div className="mb-3">
      <Image
        src={imageUrl}
        alt="Product preview"
        width={120}
        height={120}
        className="rounded-lg object-cover border"
      />
    </div>
  )}

  <UploadButton<OurFileRouter, "productImage">
    endpoint="productImage"
    onClientUploadComplete={(res) => {
      if (res?.[0]?.url) setImageUrl(res[0].url);
    }}
    onUploadError={(error) => {
      console.error("Upload error:", error);
    }}
  />
  <FieldError errors={state?.errors?.imageUrl} />
</div>
```

---

## Step 7 — Display Thumbnails in `products/page.tsx`

**In the desktop table — add a column header:**

```tsx
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Image</th>
```

**In each table row — add before the Name cell:**

```tsx
<td className="px-6 py-4">
  {product.imageUrl ? (
    <Image
      src={product.imageUrl}
      alt={product.name}
      width={48}
      height={48}
      className="rounded-lg object-cover border"
    />
  ) : (
    <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
      <Package className="h-5 w-5 text-gray-400" />
    </div>
  )}
</td>
```

**In the mobile card list — add inside each card:**

```tsx
{product.imageUrl && (
  <Image
    src={product.imageUrl}
    alt={product.name}
    width={48}
    height={48}
    className="rounded-lg object-cover border"
  />
)}
```

---

## Step 8 — Configure Next.js Image Domains

**File:** `next.config.ts`

UploadThing serves images from `utfs.io`. Add it to the allowed image domains inside `nextConfig` (before the `withSentryConfig` wrapper):

```ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
};
```

---

## Checklist

- [ ] Add `imageUrl` column to `db/schema.ts`
- [ ] Run `npm run db:generate` and `npm run db:migrate`
- [ ] Verify `InsertProductType` includes `imageUrl`
- [ ] Install `uploadthing` and `@uploadthing/react`
- [ ] Add `UPLOADTHING_TOKEN` to `.env.local`
- [ ] Create `app/api/uploadthing/core.ts`
- [ ] Create `app/api/uploadthing/route.ts`
- [ ] Update `ProductForm.tsx` with upload button and hidden input
- [ ] Add thumbnail to `products/page.tsx` table and mobile cards
- [ ] Add `utfs.io` to `next.config.ts` image remote patterns
- [ ] Test upload, save, and display end-to-end

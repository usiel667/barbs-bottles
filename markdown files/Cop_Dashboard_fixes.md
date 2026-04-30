# `app/(dashboard)/home/page.tsx` errors and fixes

## 1. `await` inside a non-async component

**Why it errors:** `HomePage` is declared as a normal function, but it uses `await Promise.all(...)`.

**Change this:**

```tsx
export default function HomePage() {
```

**To this:**

```tsx
export default async function HomePage() {
```

## 2. Invalid `db.select(...)` syntax for `totalOrders`

**Why it errors:** This line has malformed object syntax:

```tsx
db.select([totalOrders: count() }).from(orders),
```

**Change it to:**

```tsx
db.select({ totalOrders: count() }).from(orders),
```

## 3. Wrong column name in the revenue query

**Why it errors:** `orders.amount` does not exist in `db/schema.ts`. The schema defines the column as `totalPrice`.

**Change this:**

```tsx
db.select({ totalRevenue: sum(orders.amount) }).from(orders),
```

**To this:**

```tsx
db.select({ totalRevenue: sum(orders.totalPrice) }).from(orders),
```

## Corrected top block

```tsx
export default async function HomePage() {
  const [[{ totalOrders }], [{ totalCustomers }], [{ totalProducts }], [{ totalRevenue }]] =
    await Promise.all([
      db.select({ totalOrders: count() }).from(orders),
      db.select({ totalCustomers: count() }).from(customers),
      db.select({ totalProducts: count() }).from(products),
      db.select({ totalRevenue: sum(orders.totalPrice) }).from(orders),
    ]);

  const formattedRevenue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(totalRevenue ?? 0));
```

## Non-error display issues to update

These are not syntax errors, but they should be changed so the page shows the real values.

### Customers

**Change this:**

```tsx
<p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
```

**To this:**

```tsx
<p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCustomers}</p>
```

### Products

**Change this:**

```tsx
<p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
```

**To this:**

```tsx
<p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProducts}</p>
```

### Revenue

**Change this:**

```tsx
<p className="text-2xl font-bold text-gray-900 dark:text-white">$0</p>
```

**To this:**

```tsx
<p className="text-2xl font-bold text-gray-900 dark:text-white">{formattedRevenue}</p>
```

# Debugging db/seed.ts

## Issue Description
The seeding script was failing starting at line 56 due to mismatches between the seed data objects and the Drizzle schema definitions.

## Reasons for the Errors

1.  **Incorrect Property Name**: The seed script used `customText`, but the schema defines the column as `customDesignText`.
2.  **Invalid Enum Value**: The seed script used `"designing"`, but the `OrderStatusEnum` in the schema only accepts `"design"`.

## Code Comparison

### Old Code (Incorrect)
```ts
  // Seed orders
  await db.insert(orders).values([
    {
      customerId: customerIds[0].id,
      productId: productIds[0].id,
      quantity: 2,
      selectedColor: "black",
      customText: "Sarah's Hydration",
      designNotes: "Logo on both sides",
      status: "designing",
      totalPrice: "59.98",
      assignedTo: "designer@example.com",
    },
    {
      customerId: customerIds[1].id,
      productId: productIds[1].id,
      quantity: 50,
      selectedColor: "white",
      customText: "Chen Corp",
      designNotes: "Company logo in blue",
      status: "production",
      totalPrice: "999.50",
      assignedTo: "production@example.com",
    },
  ]);
```

### New Code (Corrected)
```ts
  // Seed orders
  await db.insert(orders).values([
    {
      customerId: customerIds[0].id,
      productId: productIds[0].id,
      quantity: 2,
      selectedColor: "black",
      customDesignText: "Sarah's Hydration", // Corrected column name
      designNotes: "Logo on both sides",
      status: "design", // Corrected enum value
      totalPrice: "59.98",
      assignedTo: "designer@example.com",
    },
    {
      customerId: customerIds[1].id,
      productId: productIds[1].id,
      quantity: 50,
      selectedColor: "white",
      customDesignText: "Chen Corp", // Corrected column name
      designNotes: "Company logo in blue",
      status: "production",
      totalPrice: "999.50",
      assignedTo: "production@example.com",
    },
  ]);
```

## Summary of Changes
- Renamed `customText` to `customDesignText`.
- Updated status `"designing"` to `"design"`.

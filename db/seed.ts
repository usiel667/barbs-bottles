import { db } from "./index";
import { customers, products, orders } from "./schema";

const main = async () => {
  console.log("Seeding database...");

  // Seed products
  const productIds = await db.insert(products).values([
    {
      name: "Classic Steel Bottle",
      description: "Durable stainless steel water bottle perfect for daily use",
      size: "20oz",
      material: "stainless_steel",
      basePrice: "24.99",
      colors: JSON.stringify(["black", "white", "blue"]),
      features: JSON.stringify(["Double-walled", "Leak-proof", "BPA-free"]),
    },
    {
      name: "Eco Glass Bottle",
      description: "Premium borosilicate glass bottle with protective sleeve",
      size: "16oz",
      material: "glass",
      basePrice: "19.99",
      colors: JSON.stringify(["white", "green", "purple"]),
      features: JSON.stringify(["Eco-friendly", "Easy to clean", "Taste-neutral"]),
    },
  ]).returning({ id: products.id });

  // Seed customers
  const customerIds = await db.insert(customers).values([
    {
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@example.com",
      phone: "555-123-4567",
      address1: "123 Fitness Ave",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      notes: "Prefers eco-friendly products",
    },
    {
      firstName: "Mike",
      lastName: "Chen",
      email: "mike.chen@example.com",
      phone: "555-987-6543",
      address1: "456 Wellness St",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      notes: "Corporate bulk orders",
    },
  ]).returning({ id: customers.id });

  // Seed orders
  await db.insert(orders).values([
    {
      customerId: customerIds[0].id,
      productId: productIds[0].id,
      quantity: 2,
      selectedColor: "black",
      customDesignText: "Sarah's Hydration",
      designNotes: "Logo on both sides",
      status: "design",
      totalPrice: "59.98",
      assignedTo: "designer@example.com",
    },
    {
      customerId: customerIds[1].id,
      productId: productIds[1].id,
      quantity: 50,
      selectedColor: "white",
      customDesignText: "Chen Corp",
      designNotes: "Company logo in blue",
      status: "production",
      totalPrice: "999.50",
      assignedTo: "production@example.com",
    },
  ]);

  console.log("Seeding completed");
};

main().catch((error) => {
  console.error("Error during seeding:", error);
  process.exit(1);
});

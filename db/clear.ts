import { db } from "./index";
import { orderItems, orders, products, productDesigns, customers } from "./schema";

const main = async () => {
  console.log("Clearing database...");
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(productDesigns);
  await db.delete(products);
  await db.delete(customers);
  console.log("Done.");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

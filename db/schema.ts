import {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  integer,
  text,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

// Enums

export const OrderStatusEnum = pgEnum("order_status", [
  "pending",
  "design",
  "production",
  "quality_check",
  "shipped",
  "delivered",
  "canceled"
]);

export const bottleSizeEnum = pgEnum("bottle_size", [
  "12oz",
  "16oz",
  "20oz",
  "24oz",
  "32oz"

]);

export const bottleMaterialEnum = pgEnum("bottle_material", [
  "stainless_steel",
  "plastic",
  "glass",
  "aluminum"
]);

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  address1: varchar("address1", { length: 255 }).notNull(),
  address2: varchar("address2", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  zipCode: varchar("zip_code", { length: 10 }).notNull(),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

// Products Table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  size: bottleSizeEnum("size").notNull(),
  material: bottleMaterialEnum("material").notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  colors: text("colors").notNull(), // JSON array of available bottle colors
  features: text("features"), // JSON array of features
  // Design/Graphics support for custom bottles
  designTemplate: text("design_template"), // URL to the design template/mockup
  designPreview: text("design_preview"), // URL to design preview image
  designVariations: text("design_variations"), // JSON array of design variation URLs
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  selectedColor: varchar("selected_color", { length: 50 }).notNull(),
  customDesignText: text("custom_design_text"), // Custom text for the design
  customLogoUrl: text("custom_logo_url"), // Customer's logo/image URL
  designNotes: text("design_notes"), // Internal design specifications
  designProofUrl: text("design_proof_url"), // URL to approved design proof
  status: OrderStatusEnum("status").notNull().default("pending"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  estimatedDelivery: timestamp("estimated_delivery"),
  assignedTo: varchar("assigned_to", { length: 255 }).default("unassigned"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

// Relations
export const customerRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const productRelations = relations(products, ({ many }) => ({
  orders: many(orders),
}));

export const orderRelations = relations(orders, ({ one }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
}));

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
  unique,
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

export const bottleMaterialEnum = pgEnum("bottle_material", [
  "stainless_steel"
]);

// Bottle Sizes lookup — replaces the fixed bottleSizeEnum so new sizes
// can be added from the UI without a schema migration.
export const bottleSizes = pgTable("bottle_sizes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  description: varchar("description", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Product Series lookup — replaces the free-text products.series column
// so new series can be added from the UI and reused across products.
export const productSeries = pgTable("product_series", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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
  seriesId: integer("series_id").notNull().references(() => productSeries.id),
  sizeId: integer("size_id").notNull().references(() => bottleSizes.id),
  material: bottleMaterialEnum("material").notNull().default("stainless_steel"),
  features: text("features"),
  hasHandle: boolean("has_handle").notNull().default(false),
  coldRetentionHours: integer("cold_retention_hours"),
  hotRetentionHours: integer("hot_retention_hours"),
  leakProof: boolean("leak_proof").notNull().default(false),
  warranty: varchar("warranty", { length: 100 }).default("lifetime"),
  rating: decimal("rating", { precision: 3, scale: 1 }),
  reviewCount: integer("review_count"),
  designTemplate: text("design_template"),
  designPreview: text("design_preview"),
  designVariations: text("design_variations"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

// Product Designs table — one row per named design/colorway of a product,
// each with its own price/MSRP/stock/quantity (see markdown files/debugging/Bug_Fixes.md Fix 10)
export const productDesigns = pgTable("product_designs", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  msrpPrice: decimal("msrp_price", { precision: 10, scale: 2 }),
  inStock: boolean("in_stock").notNull().default(false),
  quantity: integer("quantity").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  uniqueDesignPerProduct: unique().on(table.productId, table.name),
}));

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),

  customDesignText: text("custom_design_text"),
  customLogoUrl: text("custom_logo_url"),
  designNotes: text("design_notes"),
  designProofUrl: text("design_proof_url"),
  status: OrderStatusEnum("status").notNull().default("pending"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  estimatedDelivery: timestamp("estimated_delivery"),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  assignedTo: varchar("assigned_to", { length: 255 }).default("unassigned"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  selectedColor: varchar("selected_color", { length: 100 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 5, scale: 2 }).default("0"),
});

// Relations
export const customerRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const productRelations = relations(products, ({ one, many }) => ({
  orders: many(orderItems),
  designs: many(productDesigns),
  seriesRef: one(productSeries, {
    fields: [products.seriesId],
    references: [productSeries.id],
  }),
  sizeRef: one(bottleSizes, {
    fields: [products.sizeId],
    references: [bottleSizes.id],
  }),
}));

export const productDesignRelations = relations(productDesigns, ({ one }) => ({
  product: one(products, {
    fields: [productDesigns.productId],
    references: [products.id],
  }),
}));

export const productSeriesRelations = relations(productSeries, ({ many }) => ({
  products: many(products),
}));

export const bottleSizesRelations = relations(bottleSizes, ({ many }) => ({
  products: many(products),
}));

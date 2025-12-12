// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
      isAdmin: i.boolean().optional(),
    }),
    products: i.entity({
      name: i.string().indexed(),
      brand: i.string().indexed(),
      price: i.number(),
      images: i.string(), // JSON string array
      sizes: i.string(), // JSON string array
      description: i.string(),
      tags: i.string(), // JSON string array
      active: i.boolean(),
      legacyId: i.number().optional(),
      featured: i.boolean().optional(),
      stockTracking: i.boolean().optional(),
    }),
    orders: i.entity({
      orderNumber: i.string().unique().indexed(),
      userId: i.string().indexed().optional(), // Optional for guest checkouts
      customerName: i.string(),
      customerEmail: i.string().indexed(),
      customerPhone: i.string(),
      deliveryAddress: i.string(),
      deliveryCity: i.string(),
      deliveryPostalCode: i.string(),
      subtotal: i.number(),
      deliveryCost: i.number(),
      total: i.number(),
      paymentStatus: i.string().indexed(), // pending, succeeded, failed, refunded
      paymentIntentId: i.string().optional(),
      deliveryMethod: i.string(), // standard, express
      paymentMethod: i.string(), // card, eft, cod
      orderStatus: i.string().indexed(), // placed, payment-confirmed, preparing, shipped, out-for-delivery, delivered, cancelled
      createdAt: i.number(), // timestamp
      updatedAt: i.number().optional(),
    }),
    orderItems: i.entity({
      orderId: i.string().indexed(),
      productId: i.string().indexed(),
      productName: i.string(),
      brand: i.string(),
      size: i.string(),
      quantity: i.number(),
      price: i.number(),
      imageUrl: i.string(),
    }),
    inventory: i.entity({
      productId: i.string().indexed(),
      size: i.string(),
      stockLevel: i.number(),
      reserved: i.number(),
      available: i.number(),
    }),
  },
  links: {
    orderToOrderItems: {
      forward: {
        on: "orders",
        has: "many",
        label: "items",
      },
      reverse: {
        on: "orderItems",
        has: "one",
        label: "order",
      },
    },
    productToOrderItems: {
      forward: {
        on: "products",
        has: "many",
        label: "orderItems",
      },
      reverse: {
        on: "orderItems",
        has: "one",
        label: "product",
      },
    },
    productToInventory: {
      forward: {
        on: "products",
        has: "many",
        label: "inventory",
      },
      reverse: {
        on: "inventory",
        has: "one",
        label: "product",
      },
    },
  },
  rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;


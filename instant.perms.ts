// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const rules = {
  products: {
    allow: {
      view: "true",
      create: "auth.isAdmin == true",
      update: "auth.isAdmin == true",
      delete: "auth.isAdmin == true",
    },
  },
  orders: {
    allow: {
      view: "auth.id == data.userId || auth.isAdmin == true",
      create: "auth.id != null",
      update: "auth.isAdmin == true",
      delete: "auth.isAdmin == true",
    },
  },
  orderItems: {
    allow: {
      view: "auth.id == data.ref('order.userId') || auth.isAdmin == true",
      create: "auth.id != null",
      update: "false",
      delete: "false",
    },
  },
  inventory: {
    allow: {
      view: "true",
      create: "auth.isAdmin == true",
      update: "auth.isAdmin == true",
      delete: "auth.isAdmin == true",
    },
  },
} satisfies InstantRules;

export default rules;


import {
  sqliteTable,
  text,
  integer,
  blob,
  foreignKey,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import type { InferSelectModel } from "drizzle-orm";

export const chat = sqliteTable("Chat", {
  id: text("id").primaryKey().notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  title: text("title").notNull(),
  visibility: text("visibility")
    .notNull()
    .default("private")
    .$type<"public" | "private">(),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = sqliteTable("Message", {
  id: text("id").primaryKey().notNull(),
  chatId: text("chatId")
    .notNull()
    .references(() => chat.id),
  role: text("role").notNull(),
  content: blob("content", { mode: "json" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const vote = sqliteTable(
  "Vote",
  {
    chatId: text("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: text("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: integer("isUpvoted", { mode: "boolean" }).notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type Vote = InferSelectModel<typeof vote>;

export const document = sqliteTable(
  "Document",
  {
    id: text("id").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: text("kind")
      .notNull()
      .default("text")
      .$type<"text" | "code" | "image" | "sheet">(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  }
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = sqliteTable(
  "Suggestion",
  {
    id: text("id").notNull(),
    documentId: text("documentId").notNull(),
    documentCreatedAt: integer("documentCreatedAt", {
      mode: "timestamp",
    }).notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: integer("isResolved", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey(() => ({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    })),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const invoice = sqliteTable("Invoice", {
  id: text("id").primaryKey().notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  vendorName: text("vendorName").notNull(),
  customerName: text("customerName").notNull(),
  invoiceNumber: text("invoiceNumber").notNull(),
  invoiceDate: text("invoiceDate"),
  dueDate: text("dueDate"),
  amount: text("amount"),
  lineItems: blob("lineItems", { mode: "json" }),
  fileHash: text("fileHash"),
  tokenUsage: integer("tokenUsage"),
});

export type Invoice = InferSelectModel<typeof invoice>;

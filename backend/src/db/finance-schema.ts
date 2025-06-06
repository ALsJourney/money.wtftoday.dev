import { pgTable, text, timestamp, integer, boolean, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

// Income (Einnahmen) table
export const income = pgTable("income", {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  invoiceDate: timestamp('invoice_date').notNull(),
  customer: text('customer').notNull(),
  description: text('description').notNull(),
  paymentDate: timestamp('payment_date'),
  amount: integer('amount').notNull(), // Amount in cents
  fileUrl: text('file_url'),
  fileName: text('file_name'),
  fileType: text('file_type'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

// Expenses (Ausgaben) table
export const expense = pgTable("expense", {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  invoiceDate: timestamp('invoice_date').notNull(),
  vendor: text('vendor').notNull(),
  description: text('description').notNull(),
  paymentDate: timestamp('payment_date'),
  amount: integer('amount').notNull(), // Amount in cents
  fileUrl: text('file_url'),
  fileName: text('file_name'),
  fileType: text('file_type'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});
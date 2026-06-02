import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('user'),
  created_at: text('created_at').notNull().default(() => new Date().toISOString()),
  updated_at: text('updated_at').notNull().default(() => new Date().toISOString()),
});
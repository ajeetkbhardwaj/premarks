import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').default(''),
  planTier: text('plan_tier').notNull().default('free'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  keyPrefix: text('key_prefix').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  scopes: text('scopes').notNull().default('decks:read,decks:write,mcp,ai'),
  rateLimitPerMin: integer('rate_limit_per_min').notNull().default(60),
  lastUsedAt: timestamp('last_used_at'),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const decks = pgTable('decks', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  themeId: text('theme_id').notNull().default('anime'),
  templateId: text('template_id'),
  markdown: text('markdown').notNull(),
  slideCount: integer('slide_count').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const slides = pgTable('slides', {
  id: text('id').primaryKey(),
  deckId: text('deck_id')
    .references(() => decks.id, { onDelete: 'cascade' })
    .notNull(),
  position: integer('position').notNull(),
  layoutClass: text('layout_class').notNull().default('standard'),
  title: text('title').notNull().default('Untitled Slide'),
  markdownBody: text('markdown_body').notNull(),
  speakerNotes: text('speaker_notes').notNull().default(''),
  lintScore: integer('lint_score').notNull().default(100),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const deckVersions = pgTable('deck_versions', {
  id: text('id').primaryKey(),
  deckId: text('deck_id')
    .references(() => decks.id, { onDelete: 'cascade' })
    .notNull(),
  label: text('label').notNull(),
  markdown: text('markdown').notNull(),
  themeId: text('theme_id').notNull(),
  slideCount: integer('slide_count').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const shares = pgTable('shares', {
  id: text('id').primaryKey(),
  deckId: text('deck_id'),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  themeId: text('theme_id').notNull().default('anime'),
  markdown: text('markdown').notNull(),
  isPublic: boolean('is_public').notNull().default(true),
  watermark: boolean('watermark').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usageEvents = pgTable('usage_events', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  apiKeyId: text('api_key_id'),
  action: text('action').notNull(),
  model: text('model'),
  units: integer('units').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const taskRuns = pgTable('task_runs', {
  id: text('id').primaryKey(),
  taskUuid: text('task_uuid').notNull(),
  phase: text('phase').notNull(),
  status: text('status').notNull(),
  details: text('details').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  apiKeys: many(apiKeys),
  decks: many(decks),
  shares: many(shares),
  usageEvents: many(usageEvents),
}));

export const decksRelations = relations(decks, ({ one, many }) => ({
  owner: one(users, {
    fields: [decks.userId],
    references: [users.id],
  }),
  slides: many(slides),
  versions: many(deckVersions),
}));

export const slidesRelations = relations(slides, ({ one }) => ({
  deck: one(decks, {
    fields: [slides.deckId],
    references: [decks.id],
  }),
}));

export const deckVersionsRelations = relations(deckVersions, ({ one }) => ({
  deck: one(decks, {
    fields: [deckVersions.deckId],
    references: [decks.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  owner: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const usageEventsRelations = relations(usageEvents, ({ one }) => ({
  owner: one(users, {
    fields: [usageEvents.userId],
    references: [users.id],
  }),
}));

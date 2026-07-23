import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const plannerProfiles = sqliteTable("planner_profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  currentTickets: integer("current_tickets").notNull().default(0),
  pity: integer("pity").notNull().default(0),
  guaranteed: integer("guaranteed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const plannerCharacters = sqliteTable("planner_characters", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => plannerProfiles.id),
  characterId: text("character_id").notNull(),
  owned: integer("owned", { mode: "boolean" }).notNull().default(false),
  wishlisted: integer("wishlisted", { mode: "boolean" }).notNull().default(false),
});

export const tierLists = sqliteTable("tier_lists", {
  id: text("id").primaryKey(),
  patch: text("patch").notNull(),
  rows: text("rows", { mode: "json" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

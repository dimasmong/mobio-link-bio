-- Migration 0008_explore_categories_and_galleries.sql
-- MOBIO STUDIO V3 — Explore Categories, Subcategories & Multi-Photo Gallery Support

-- 1. Add category and subcategory_id to explore_items and explore_items_draft
ALTER TABLE explore_items ADD COLUMN category TEXT NOT NULL DEFAULT 'all';
ALTER TABLE explore_items ADD COLUMN subcategory_id TEXT NOT NULL DEFAULT '';

ALTER TABLE explore_items_draft ADD COLUMN category TEXT NOT NULL DEFAULT 'all';
ALTER TABLE explore_items_draft ADD COLUMN subcategory_id TEXT NOT NULL DEFAULT '';

-- 2. Create explore_subcategories (published)
CREATE TABLE IF NOT EXISTS explore_subcategories (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    label_id TEXT NOT NULL,
    label_en TEXT NOT NULL,
    icon TEXT DEFAULT '',
    color TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Create explore_subcategories_draft (draft)
CREATE TABLE IF NOT EXISTS explore_subcategories_draft (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    label_id TEXT NOT NULL,
    label_en TEXT NOT NULL,
    icon TEXT DEFAULT '',
    color TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_explore_subcat_draft ON explore_subcategories_draft (category, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_explore_subcat_pub ON explore_subcategories (category, sort_order ASC);

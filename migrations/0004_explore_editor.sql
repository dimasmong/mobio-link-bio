-- MOBIO STUDIO — Database Migration: 0004_explore_editor.sql
-- Draft & Published isolation and flexible 10 content models for Explore Section.

PRAGMA foreign_keys = OFF;

-- 1. Upgrade explore_items to support all 10 flexible content models
CREATE TABLE IF NOT EXISTS explore_items_new (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('gallery', 'image', 'video', 'music', 'game', 'review', 'project', 'note', 'link', 'custom')),
    title_id TEXT NOT NULL DEFAULT '',
    title_en TEXT NOT NULL DEFAULT '',
    subtitle_id TEXT DEFAULT '',
    subtitle_en TEXT DEFAULT '',
    description_id TEXT DEFAULT '',
    description_en TEXT DEFAULT '',
    url TEXT DEFAULT '',
    cover_image TEXT DEFAULT '',
    badge_id TEXT DEFAULT '',
    badge_en TEXT DEFAULT '',
    metadata_json TEXT DEFAULT '{}',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Copy existing items if any
INSERT OR IGNORE INTO explore_items_new SELECT * FROM explore_items;

DROP TABLE IF EXISTS explore_items;

ALTER TABLE explore_items_new RENAME TO explore_items;

CREATE INDEX IF NOT EXISTS idx_explore_order_enabled ON explore_items (sort_order ASC, is_enabled DESC);

-- 2. Create explore_items_draft table
CREATE TABLE IF NOT EXISTS explore_items_draft (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('gallery', 'image', 'video', 'music', 'game', 'review', 'project', 'note', 'link', 'custom')),
    title_id TEXT NOT NULL DEFAULT '',
    title_en TEXT NOT NULL DEFAULT '',
    subtitle_id TEXT DEFAULT '',
    subtitle_en TEXT DEFAULT '',
    description_id TEXT DEFAULT '',
    description_en TEXT DEFAULT '',
    url TEXT DEFAULT '',
    cover_image TEXT DEFAULT '',
    badge_id TEXT DEFAULT '',
    badge_en TEXT DEFAULT '',
    metadata_json TEXT DEFAULT '{}',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_explore_draft_order_enabled ON explore_items_draft (sort_order ASC, is_enabled DESC);

-- Copy existing published explore items into draft
INSERT OR IGNORE INTO explore_items_draft SELECT * FROM explore_items;

PRAGMA foreign_keys = ON;

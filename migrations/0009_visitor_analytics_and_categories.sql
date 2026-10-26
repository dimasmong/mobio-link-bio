-- Migration 0009: Visitor Analytics and Single-Tier Explore Categories
-- Additive, safe, and backwards-compatible with 0001-0008.

-- 1. Table for privacy-preserving page views & ephemeral visitor sessions
CREATE TABLE IF NOT EXISTS page_views (
    id TEXT PRIMARY KEY,
    page TEXT NOT NULL, -- 'home' | 'explore' | 'contact'
    session_hash TEXT NOT NULL,
    viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
    referrer TEXT DEFAULT 'Direct / None'
);

CREATE INDEX IF NOT EXISTS idx_page_views_time ON page_views (viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_page_time ON page_views (page, viewed_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views (session_hash, viewed_at);

-- 2. Tables for single-tier explore categories (Published & Draft)
CREATE TABLE IF NOT EXISTS explore_categories (
    id TEXT PRIMARY KEY,
    name_id TEXT NOT NULL,
    name_en TEXT NOT NULL,
    icon TEXT DEFAULT 'folder',
    color TEXT DEFAULT '#8b5cf6',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS explore_categories_draft (
    id TEXT PRIMARY KEY,
    name_id TEXT NOT NULL,
    name_en TEXT NOT NULL,
    icon TEXT DEFAULT 'folder',
    color TEXT DEFAULT '#8b5cf6',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_explore_categories_sort ON explore_categories (sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_explore_categories_draft_sort ON explore_categories_draft (sort_order ASC);

-- 3. Seed default customizable categories if not present
INSERT OR IGNORE INTO explore_categories (id, name_id, name_en, icon, color, sort_order, is_enabled)
VALUES
    ('project', 'Proyek', 'Projects', 'code', '#8b5cf6', 0, 1),
    ('gallery', 'Galeri', 'Gallery', 'image', '#38bdf8', 1, 1),
    ('music', 'Musik', 'Music', 'music', '#ec4899', 2, 1),
    ('review', 'Ulasan', 'Reviews', 'star', '#eab308', 3, 1),
    ('game', 'Game', 'Gaming', 'gamepad', '#10b981', 4, 1);

INSERT OR IGNORE INTO explore_categories_draft (id, name_id, name_en, icon, color, sort_order, is_enabled)
VALUES
    ('project', 'Proyek', 'Projects', 'code', '#8b5cf6', 0, 1),
    ('gallery', 'Galeri', 'Gallery', 'image', '#38bdf8', 1, 1),
    ('music', 'Musik', 'Music', 'music', '#ec4899', 2, 1),
    ('review', 'Ulasan', 'Reviews', 'star', '#eab308', 3, 1),
    ('game', 'Game', 'Gaming', 'gamepad', '#10b981', 4, 1);

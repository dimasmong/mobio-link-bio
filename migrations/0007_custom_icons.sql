-- Migration 0007_custom_icons.sql
-- MOBIO STUDIO — Custom Icon System & Expanded Icon Library
-- Extends links and links_draft with icon_type, icon_url, and icon_media_id.
-- Extends media_assets category check to include 'icon'.

PRAGMA foreign_keys = OFF;

-- 1. Extend links table with custom icon fields
ALTER TABLE links ADD COLUMN icon_type TEXT NOT NULL DEFAULT 'preset';
ALTER TABLE links ADD COLUMN icon_url TEXT NOT NULL DEFAULT '';
ALTER TABLE links ADD COLUMN icon_media_id TEXT NOT NULL DEFAULT '';

-- 2. Extend links_draft table with custom icon fields
ALTER TABLE links_draft ADD COLUMN icon_type TEXT NOT NULL DEFAULT 'preset';
ALTER TABLE links_draft ADD COLUMN icon_url TEXT NOT NULL DEFAULT '';
ALTER TABLE links_draft ADD COLUMN icon_media_id TEXT NOT NULL DEFAULT '';

-- 3. Upgrade media_assets to allow 'icon' category in CHECK constraint
CREATE TABLE IF NOT EXISTS media_assets_new (
    id TEXT PRIMARY KEY,
    object_key TEXT NOT NULL UNIQUE,
    original_filename TEXT NOT NULL,
    media_category TEXT NOT NULL CHECK (media_category IN ('avatar', 'cover', 'background', 'general', 'icon')),
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    duration_seconds REAL,
    status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'draft', 'published', 'archived')),
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
);

INSERT OR IGNORE INTO media_assets_new SELECT * FROM media_assets;

DROP TABLE IF EXISTS media_assets;

ALTER TABLE media_assets_new RENAME TO media_assets;

CREATE INDEX IF NOT EXISTS idx_media_assets_category ON media_assets (media_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets (status);

PRAGMA foreign_keys = ON;

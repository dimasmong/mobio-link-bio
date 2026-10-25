-- MOBIO STUDIO — Database Migration: 0002_draft_publishing.sql
-- Draft & Published isolation system for profile, links, and contact methods.

PRAGMA foreign_keys = ON;

-- 1. Ensure profile table has distinct rows for 'published' and 'draft'
INSERT OR IGNORE INTO profile (id, name, handle, avatar_url, location_id, location_en, bio_id, bio_en)
SELECT 'published', name, handle, avatar_url, location_id, location_en, bio_id, bio_en FROM profile WHERE id = 'default';

INSERT OR IGNORE INTO profile (id, name, handle, avatar_url, location_id, location_en, bio_id, bio_en)
SELECT 'draft', name, handle, avatar_url, location_id, location_en, bio_id, bio_en FROM profile WHERE id = 'default';

-- Fallback if 'default' didn't exist yet
INSERT OR IGNORE INTO profile (id, name, handle, avatar_url, location_id, location_en, bio_id, bio_en)
VALUES ('published', '', '', '', '', '', '', '');

INSERT OR IGNORE INTO profile (id, name, handle, avatar_url, location_id, location_en, bio_id, bio_en)
VALUES ('draft', '', '', '', '', '', '', '');

-- 2. Draft table for Links
CREATE TABLE IF NOT EXISTS links_draft (
    id TEXT PRIMARY KEY,
    title_id TEXT NOT NULL DEFAULT '',
    title_en TEXT NOT NULL DEFAULT '',
    description_id TEXT DEFAULT '',
    description_en TEXT DEFAULT '',
    url TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'website',
    icon TEXT NOT NULL DEFAULT 'globe',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_links_draft_order_enabled ON links_draft (sort_order ASC, is_enabled DESC);

-- Copy any existing links to links_draft
INSERT OR IGNORE INTO links_draft SELECT * FROM links;

-- 3. Draft table for Contact Methods
CREATE TABLE IF NOT EXISTS contact_methods_draft (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'telegram', 'email', 'instagram', 'custom')),
    label_id TEXT NOT NULL DEFAULT '',
    label_en TEXT NOT NULL DEFAULT '',
    value TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contact_draft_order_enabled ON contact_methods_draft (sort_order ASC, is_enabled DESC);

-- Copy any existing contact methods to contact_methods_draft
INSERT OR IGNORE INTO contact_methods_draft SELECT * FROM contact_methods;

-- 4. Extend publish_metadata with draft tracking columns
ALTER TABLE publish_metadata ADD COLUMN has_unpublished_changes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE publish_metadata ADD COLUMN draft_updated_at TEXT DEFAULT '';

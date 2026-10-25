-- MOBIO STUDIO — Database Migration: 0001_initial_schema.sql
-- Cloudflare D1 (SQLite) Schema for independent MOBIO installation
-- All tables use clean constraints, UUID/nano-id keys, and audit timestamps.

PRAGMA foreign_keys = ON;

-- 1. Site Settings (Single-row configuration)
CREATE TABLE IF NOT EXISTS site_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    site_title TEXT NOT NULL DEFAULT 'MOBIO Link Bio',
    default_language TEXT NOT NULL DEFAULT 'id' CHECK (default_language IN ('id', 'en')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Profile Identity & Localized Biography
CREATE TABLE IF NOT EXISTS profile (
    id TEXT PRIMARY KEY DEFAULT 'default',
    name TEXT NOT NULL DEFAULT '',
    handle TEXT NOT NULL DEFAULT '',
    avatar_url TEXT DEFAULT '',
    location_id TEXT DEFAULT '',
    location_en TEXT DEFAULT '',
    bio_id TEXT DEFAULT '',
    bio_en TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Vertical Links (Configurable ordering, visibility, and platform metadata)
CREATE TABLE IF NOT EXISTS links (
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

CREATE INDEX IF NOT EXISTS idx_links_order_enabled ON links (sort_order ASC, is_enabled DESC);

-- 4. Explore Items (Modular content: projects, photo gallery, music playlists, notes)
CREATE TABLE IF NOT EXISTS explore_items (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('project', 'gallery', 'music', 'note')),
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

CREATE INDEX IF NOT EXISTS idx_explore_order_enabled ON explore_items (sort_order ASC, is_enabled DESC);

-- 5. Contact Methods (Direct action links: WhatsApp, Telegram, Email, Instagram, Custom)
CREATE TABLE IF NOT EXISTS contact_methods (
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

CREATE INDEX IF NOT EXISTS idx_contact_order_enabled ON contact_methods (sort_order ASC, is_enabled DESC);

-- 6. Appearance Preferences (Themes, background engine, cover banner settings)
CREATE TABLE IF NOT EXISTS appearance_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    palette TEXT NOT NULL DEFAULT 'frost-aurora',
    glass_intensity TEXT NOT NULL DEFAULT 'medium',
    background_type TEXT NOT NULL DEFAULT 'gradient' CHECK (background_type IN ('gradient', 'image', 'video')),
    background_src TEXT DEFAULT '',
    background_poster TEXT DEFAULT '',
    background_animation INTEGER NOT NULL DEFAULT 1 CHECK (background_animation IN (0, 1)),
    background_overlay_opacity REAL NOT NULL DEFAULT 0.45,
    cover_enabled INTEGER NOT NULL DEFAULT 1 CHECK (cover_enabled IN (0, 1)),
    cover_url TEXT DEFAULT '',
    cover_aspect_ratio TEXT DEFAULT 'aspect-[21/9]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. Publish Metadata (Versioning and deployment status tracking)
CREATE TABLE IF NOT EXISTS publish_metadata (
    id TEXT PRIMARY KEY DEFAULT 'current',
    version INTEGER NOT NULL DEFAULT 1,
    published_at TEXT NOT NULL DEFAULT (datetime('now')),
    published_by TEXT NOT NULL DEFAULT 'system',
    notes TEXT DEFAULT ''
);

-- 8. Click Events (Future telemetry and analytics support, aggregated privacy-friendly metrics)
CREATE TABLE IF NOT EXISTS click_events (
    id TEXT PRIMARY KEY,
    link_id TEXT NOT NULL,
    clicked_at TEXT NOT NULL DEFAULT (datetime('now')),
    referrer TEXT DEFAULT '',
    country TEXT DEFAULT '',
    user_agent_hash TEXT DEFAULT '',
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_click_events_link_time ON click_events (link_id, clicked_at DESC);

-- 9. Neutral Baseline Seed (Safe initial singletons for site, profile, and appearance)
INSERT OR IGNORE INTO site_settings (id, site_title, default_language)
VALUES ('default', 'MOBIO Link Bio', 'id');

INSERT OR IGNORE INTO profile (id, name, handle, avatar_url, location_id, location_en, bio_id, bio_en)
VALUES ('default', '', '', '', '', '', '', '');

INSERT OR IGNORE INTO appearance_settings (id, palette, glass_intensity, background_type, background_animation, background_overlay_opacity, cover_enabled)
VALUES ('default', 'frost-aurora', 'medium', 'gradient', 1, 0.45, 1);

INSERT OR IGNORE INTO publish_metadata (id, version, published_by, notes)
VALUES ('current', 1, 'system', 'Initial installation');

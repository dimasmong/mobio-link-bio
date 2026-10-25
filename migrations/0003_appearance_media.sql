-- MOBIO STUDIO — Database Migration: 0003_appearance_media.sql
-- Phase 3: Media Asset Registry, Appearance Draft/Published State, and Visual Tokens

PRAGMA foreign_keys = ON;

-- 1. Media Asset Registry Table (Tracks R2 objects metadata in D1)
CREATE TABLE IF NOT EXISTS media_assets (
    id TEXT PRIMARY KEY,
    object_key TEXT NOT NULL UNIQUE,
    original_filename TEXT NOT NULL,
    media_category TEXT NOT NULL CHECK (media_category IN ('avatar', 'cover', 'background', 'general')),
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

CREATE INDEX IF NOT EXISTS idx_media_assets_category ON media_assets (media_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets (status);

-- 2. Extend appearance_settings with Phase 3 design tokens & media references
ALTER TABLE appearance_settings ADD COLUMN accent_color TEXT NOT NULL DEFAULT '#8b5cf6';
ALTER TABLE appearance_settings ADD COLUMN background_position_x REAL NOT NULL DEFAULT 50.0;
ALTER TABLE appearance_settings ADD COLUMN background_position_y REAL NOT NULL DEFAULT 50.0;
ALTER TABLE appearance_settings ADD COLUMN background_scale REAL NOT NULL DEFAULT 1.0;
ALTER TABLE appearance_settings ADD COLUMN background_overlay_color TEXT NOT NULL DEFAULT 'rgba(248, 250, 252, 0.45)';
ALTER TABLE appearance_settings ADD COLUMN background_brightness REAL NOT NULL DEFAULT 1.0;
ALTER TABLE appearance_settings ADD COLUMN glass_blur TEXT NOT NULL DEFAULT '16px';
ALTER TABLE appearance_settings ADD COLUMN glass_opacity REAL NOT NULL DEFAULT 0.70;
ALTER TABLE appearance_settings ADD COLUMN glass_tint TEXT NOT NULL DEFAULT 'rgba(255, 255, 255, 0.65)';
ALTER TABLE appearance_settings ADD COLUMN glass_border_opacity REAL NOT NULL DEFAULT 0.30;
ALTER TABLE appearance_settings ADD COLUMN glass_highlight_intensity REAL NOT NULL DEFAULT 0.40;
ALTER TABLE appearance_settings ADD COLUMN glass_shadow_intensity REAL NOT NULL DEFAULT 0.15;
ALTER TABLE appearance_settings ADD COLUMN glass_radius TEXT NOT NULL DEFAULT '1.5rem';
ALTER TABLE appearance_settings ADD COLUMN background_media_id TEXT NOT NULL DEFAULT '';
ALTER TABLE appearance_settings ADD COLUMN background_poster_media_id TEXT NOT NULL DEFAULT '';
ALTER TABLE appearance_settings ADD COLUMN cover_media_id TEXT NOT NULL DEFAULT '';

-- 3. Ensure distinct rows exist for 'published' and 'draft' in appearance_settings
INSERT OR IGNORE INTO appearance_settings (
    id, palette, glass_intensity, background_type, background_src, background_poster,
    background_animation, background_overlay_opacity, cover_enabled, cover_url, cover_aspect_ratio,
    accent_color, background_position_x, background_position_y, background_scale,
    background_overlay_color, background_brightness, glass_blur, glass_opacity, glass_tint,
    glass_border_opacity, glass_highlight_intensity, glass_shadow_intensity, glass_radius,
    background_media_id, background_poster_media_id, cover_media_id, created_at, updated_at
)
SELECT
    'published', palette, glass_intensity, background_type, background_src, background_poster,
    background_animation, background_overlay_opacity, cover_enabled, cover_url, cover_aspect_ratio,
    accent_color, background_position_x, background_position_y, background_scale,
    background_overlay_color, background_brightness, glass_blur, glass_opacity, glass_tint,
    glass_border_opacity, glass_highlight_intensity, glass_shadow_intensity, glass_radius,
    background_media_id, background_poster_media_id, cover_media_id, created_at, updated_at
FROM appearance_settings WHERE id = 'default';

INSERT OR IGNORE INTO appearance_settings (
    id, palette, glass_intensity, background_type, background_src, background_poster,
    background_animation, background_overlay_opacity, cover_enabled, cover_url, cover_aspect_ratio,
    accent_color, background_position_x, background_position_y, background_scale,
    background_overlay_color, background_brightness, glass_blur, glass_opacity, glass_tint,
    glass_border_opacity, glass_highlight_intensity, glass_shadow_intensity, glass_radius,
    background_media_id, background_poster_media_id, cover_media_id, created_at, updated_at
)
SELECT
    'draft', palette, glass_intensity, background_type, background_src, background_poster,
    background_animation, background_overlay_opacity, cover_enabled, cover_url, cover_aspect_ratio,
    accent_color, background_position_x, background_position_y, background_scale,
    background_overlay_color, background_brightness, glass_blur, glass_opacity, glass_tint,
    glass_border_opacity, glass_highlight_intensity, glass_shadow_intensity, glass_radius,
    background_media_id, background_poster_media_id, cover_media_id, created_at, updated_at
FROM appearance_settings WHERE id = 'default';

INSERT OR IGNORE INTO appearance_settings (id, palette, glass_intensity, background_type)
VALUES ('published', 'frost-aurora', 'medium', 'gradient');

INSERT OR IGNORE INTO appearance_settings (id, palette, glass_intensity, background_type)
VALUES ('draft', 'frost-aurora', 'medium', 'gradient');

-- 4. Extend profile table with avatar_media_id
ALTER TABLE profile ADD COLUMN avatar_media_id TEXT NOT NULL DEFAULT '';

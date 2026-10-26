-- MOBIO STUDIO — Database Migration: 0010_appearance_v4_customization.sql
-- V4 Customization Engine: Layout Themes, Profile Card Styles, Card Sizes, and Typography
-- Additive, safe, and fully backward-compatible.

PRAGMA foreign_keys = ON;

-- 1. Add V4 Customization Columns to appearance_settings
ALTER TABLE appearance_settings ADD COLUMN layout_theme_id TEXT NOT NULL DEFAULT 'compact-center';
ALTER TABLE appearance_settings ADD COLUMN profile_card_style_id TEXT NOT NULL DEFAULT 'immersive-fade';
ALTER TABLE appearance_settings ADD COLUMN profile_card_size TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE appearance_settings ADD COLUMN font_family_id TEXT NOT NULL DEFAULT 'inter';

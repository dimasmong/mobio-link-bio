-- Migration 0011_interaction_events.sql
-- MOBIO STUDIO — Actual Interaction Click Tracking
-- Separates actual user clicks on Explore items and Contact cards from page views.
-- Additive, safe, and backwards-compatible with 0001-0010.

CREATE TABLE IF NOT EXISTS interaction_events (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL, -- 'explore' | 'contact'
    target_id TEXT,         -- ID of clicked explore item or contact method
    clicked_at TEXT NOT NULL DEFAULT (datetime('now')),
    referrer TEXT DEFAULT 'Direct / None'
);

CREATE INDEX IF NOT EXISTS idx_interaction_events_time ON interaction_events (clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_interaction_events_cat_time ON interaction_events (category, clicked_at);

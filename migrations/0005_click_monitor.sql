-- MOBIO STUDIO — Database Migration: 0005_click_monitor.sql
-- Optimizations and indexing for privacy-friendly Click Monitor analytics.

CREATE INDEX IF NOT EXISTS idx_click_events_time ON click_events (clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_click_events_link_date ON click_events (link_id, clicked_at);

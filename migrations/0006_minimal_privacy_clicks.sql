-- Migration 0006_minimal_privacy_clicks.sql
-- MOBIO STUDIO — Privacy-First Telemetry Hardening
-- Removes persistent user_agent_hash and country fields from click_events.
-- Preserves link_id, clicked_at, event id, and sanitized referrer domain.

CREATE TABLE IF NOT EXISTS click_events_new (
    id TEXT PRIMARY KEY,
    link_id TEXT NOT NULL,
    clicked_at TEXT NOT NULL DEFAULT (datetime('now')),
    referrer TEXT DEFAULT 'Direct / None',
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
);

INSERT INTO click_events_new (id, link_id, clicked_at, referrer)
SELECT id, link_id, clicked_at, COALESCE(referrer, 'Direct / None') FROM click_events;

DROP TABLE click_events;

ALTER TABLE click_events_new RENAME TO click_events;

CREATE INDEX IF NOT EXISTS idx_click_events_time ON click_events (clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_click_events_link_date ON click_events (link_id, clicked_at);

-- Add a leading created_at index for admin visitor analytics.
-- COUNT(DISTINCT session_id) queries filter by created_at before grouping sessions.
CREATE INDEX "page_view_events_created_at_session_id_idx"
ON "page_view_events"("created_at" DESC, "session_id");

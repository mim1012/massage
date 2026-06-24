CREATE INDEX IF NOT EXISTS "shops_visible_regular_created_at_idx"
  ON "shops" ("is_visible", "is_premium", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "shops_visible_popular_order_idx"
  ON "shops" ("is_visible", "review_count" DESC, "rating" DESC, "created_at" DESC);

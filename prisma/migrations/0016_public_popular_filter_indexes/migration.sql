CREATE INDEX IF NOT EXISTS "shops_visible_region_regular_popular_idx"
  ON "shops" ("is_visible", "region", "is_premium", "review_count" DESC, "rating" DESC, "created_at" DESC);

CREATE INDEX IF NOT EXISTS "shops_visible_region_sub_region_regular_popular_idx"
  ON "shops" ("is_visible", "region", "sub_region", "is_premium", "review_count" DESC, "rating" DESC, "created_at" DESC);

CREATE INDEX IF NOT EXISTS "shops_visible_theme_regular_popular_idx"
  ON "shops" ("is_visible", "theme", "is_premium", "review_count" DESC, "rating" DESC, "created_at" DESC);

CREATE INDEX IF NOT EXISTS "shops_visible_region_top_popular_idx"
  ON "shops" ("is_visible", "region", "review_count" DESC, "rating" DESC, "created_at" DESC);

CREATE INDEX IF NOT EXISTS "shops_visible_theme_top_popular_idx"
  ON "shops" ("is_visible", "theme", "review_count" DESC, "rating" DESC, "created_at" DESC);

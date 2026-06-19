CREATE INDEX IF NOT EXISTS "shops_visible_region_premium_order_idx"
  ON "shops" ("is_visible", "region", "is_premium", "premium_order", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "shops_visible_region_sub_region_premium_order_idx"
  ON "shops" ("is_visible", "region", "sub_region", "is_premium", "premium_order", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "shops_visible_theme_premium_order_idx"
  ON "shops" ("is_visible", "theme", "is_premium", "premium_order", "created_at" DESC);

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "shops_name_trgm_idx"
  ON "shops" USING GIN ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "shops_region_label_trgm_idx"
  ON "shops" USING GIN ("region_label" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "shops_sub_region_label_trgm_idx"
  ON "shops" USING GIN ("sub_region_label" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "shops_theme_label_trgm_idx"
  ON "shops" USING GIN ("theme_label" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "shops_tags_gin_idx"
  ON "shops" USING GIN ("tags");

ALTER TABLE "shops"
ADD COLUMN "search_text" TEXT NOT NULL DEFAULT '';

UPDATE "shops"
SET "search_text" = trim(concat_ws(' ',
  "name",
  "region_label",
  coalesce("sub_region_label", ''),
  "theme_label",
  "tagline",
  "description",
  array_to_string("tags", ' ')
));

CREATE INDEX IF NOT EXISTS "shops_search_text_trgm_idx"
  ON "shops" USING GIN ("search_text" gin_trgm_ops);

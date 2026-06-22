ALTER TABLE "shops"
ADD COLUMN "review_count" INTEGER NOT NULL DEFAULT 0;

WITH review_stats AS (
  SELECT
    "shop_id",
    COUNT(*)::INTEGER AS "review_count",
    COALESCE(AVG("rating"), 0)::DOUBLE PRECISION AS "rating"
  FROM "reviews"
  WHERE "is_hidden" = false
  GROUP BY "shop_id"
)
UPDATE "shops" AS s
SET
  "review_count" = COALESCE(rs."review_count", 0),
  "rating" = COALESCE(rs."rating", 0)
FROM review_stats AS rs
WHERE rs."shop_id" = s."id";

UPDATE "shops"
SET
  "review_count" = 0,
  "rating" = 0
WHERE "id" NOT IN (
  SELECT DISTINCT "shop_id"
  FROM "reviews"
  WHERE "is_hidden" = false
);

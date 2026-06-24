CREATE TABLE IF NOT EXISTS "ad_banners" (
  "slot" TEXT NOT NULL,
  "image_url" TEXT NOT NULL,
  "link_url" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ad_banners_pkey" PRIMARY KEY ("slot")
);

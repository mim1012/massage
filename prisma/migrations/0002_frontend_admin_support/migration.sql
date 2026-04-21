-- AlterTable
ALTER TABLE "reviews" ADD COLUMN "is_hidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "partnership_inquiries" (
    "id" TEXT NOT NULL,
    "shop_name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "sub_region" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "kakao_id" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partnership_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "site_name" TEXT NOT NULL,
    "site_title" TEXT NOT NULL,
    "site_description" TEXT NOT NULL,
    "hero_main_text" TEXT NOT NULL,
    "hero_sub_text" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "footer_info" TEXT NOT NULL,
    "seo_section_1_title" TEXT NOT NULL,
    "seo_section_1_content" TEXT NOT NULL,
    "seo_section_2_title" TEXT NOT NULL,
    "seo_section_2_content" TEXT NOT NULL,
    "seo_section_3_title" TEXT NOT NULL,
    "seo_section_3_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "partnership_inquiries_status_created_at_idx" ON "partnership_inquiries"("status", "created_at" DESC);

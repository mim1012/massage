-- CreateEnum
CREATE TYPE "PartnershipInquiryStatus" AS ENUM ('PENDING', 'CONTACTED', 'COMPLETED');

-- AlterTable
ALTER TABLE "partnership_inquiries"
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" TYPE "PartnershipInquiryStatus"
USING (
  CASE
    WHEN "status" = 'pending' THEN 'PENDING'::"PartnershipInquiryStatus"
    WHEN "status" = 'contacted' THEN 'CONTACTED'::"PartnershipInquiryStatus"
    WHEN "status" = 'completed' THEN 'COMPLETED'::"PartnershipInquiryStatus"
    ELSE 'PENDING'::"PartnershipInquiryStatus"
  END
),
ALTER COLUMN "status" SET DEFAULT 'PENDING';

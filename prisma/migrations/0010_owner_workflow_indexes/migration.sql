-- Add indexes for owner-facing moderation and shop management reads.
CREATE INDEX "shops_owner_id_is_premium_premium_order_name_idx"
ON "shops"("owner_id", "is_premium", "premium_order", "name");

CREATE INDEX "reviews_shop_id_is_hidden_created_at_idx"
ON "reviews"("shop_id", "is_hidden", "created_at" DESC);

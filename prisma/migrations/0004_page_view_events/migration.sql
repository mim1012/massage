-- CreateTable
CREATE TABLE "page_view_events" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "shop_id" TEXT,
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "referrer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_view_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_view_events_session_id_created_at_idx" ON "page_view_events"("session_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "page_view_events_path_created_at_idx" ON "page_view_events"("path", "created_at" DESC);

-- CreateIndex
CREATE INDEX "page_view_events_shop_id_created_at_idx" ON "page_view_events"("shop_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "page_view_events_user_id_created_at_idx" ON "page_view_events"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "page_view_events" ADD CONSTRAINT "page_view_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_view_events" ADD CONSTRAINT "page_view_events_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

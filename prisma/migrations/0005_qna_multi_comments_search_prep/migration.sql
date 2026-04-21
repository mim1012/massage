CREATE TYPE "QnaCommentRole" AS ENUM ('ADMIN', 'OWNER');

CREATE TABLE "qna_comments" (
  "id" TEXT NOT NULL,
  "qna_id" TEXT NOT NULL,
  "user_id" TEXT,
  "author_name" TEXT NOT NULL,
  "role" "QnaCommentRole" NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "qna_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "qna_comments_qna_id_created_at_idx" ON "qna_comments"("qna_id", "created_at");
CREATE INDEX "qna_comments_user_id_created_at_idx" ON "qna_comments"("user_id", "created_at" DESC);

ALTER TABLE "qna_comments"
  ADD CONSTRAINT "qna_comments_qna_id_fkey"
  FOREIGN KEY ("qna_id") REFERENCES "qna"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "qna_comments"
  ADD CONSTRAINT "qna_comments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "qna_comments" ("id", "qna_id", "user_id", "author_name", "role", "content", "created_at")
SELECT
  CONCAT('legacy-qna-comment-', q."id"),
  q."id",
  q."answered_by",
  COALESCE(u."name", '운영자'),
  CASE WHEN u."role" = 'OWNER' THEN 'OWNER'::"QnaCommentRole" ELSE 'ADMIN'::"QnaCommentRole" END,
  q."answer",
  COALESCE(q."answered_at", q."created_at")
FROM "qna" q
LEFT JOIN "users" u ON u."id" = q."answered_by"
WHERE q."answer" IS NOT NULL AND BTRIM(q."answer") <> '';

UPDATE "qna"
SET "status" = CASE
  WHEN EXISTS (
    SELECT 1
    FROM "qna_comments" c
    WHERE c."qna_id" = "qna"."id"
  ) THEN 'ANSWERED'::"QnaStatus"
  ELSE 'OPEN'::"QnaStatus"
END;

ALTER TABLE "qna" DROP COLUMN "answer";
ALTER TABLE "qna" DROP COLUMN "answered_by";
ALTER TABLE "qna" DROP COLUMN "answered_at";

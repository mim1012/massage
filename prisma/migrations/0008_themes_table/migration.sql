CREATE TABLE "themes" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "themes_pkey" PRIMARY KEY ("code")
);

INSERT INTO "themes" ("code", "label", "emoji", "sort_order") VALUES
  ('swedish',   '스웨디시', '🌿', 0),
  ('aroma',     '아로마',   '🌸', 1),
  ('thai',      '타이',     '🙏', 2),
  ('sport',     '스포츠',   '💪', 3),
  ('deep',      '딥티슈',   '🔥', 4),
  ('hot_stone', '핫스톤',   '💎', 5),
  ('foot',      '발마사지', '🦶', 6),
  ('couple',    '커플',     '👫', 7),
  ('geonma',    '건마',     '💆', 8)
ON CONFLICT ("code") DO NOTHING;

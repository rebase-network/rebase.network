ALTER TABLE "geekdaily_episodes" ADD COLUMN "editors_json" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "geekdaily_episodes" ALTER COLUMN "editors_json" DROP DEFAULT;

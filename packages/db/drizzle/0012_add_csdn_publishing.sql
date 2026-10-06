ALTER TABLE "articles" ADD COLUMN "csdn_article_id" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "csdn_published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "csdn_article_id" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "csdn_published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "geekdaily_episodes" ADD COLUMN "csdn_article_id" text;--> statement-breakpoint
ALTER TABLE "geekdaily_episodes" ADD COLUMN "csdn_published_at" timestamp with time zone;
ALTER TABLE "articles" ADD COLUMN "infoq_article_uuid" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "infoq_article_uuid" text;--> statement-breakpoint
ALTER TABLE "geekdaily_episodes" ADD COLUMN "infoq_article_uuid" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "infoq_username" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "infoq_password_encrypted" text;
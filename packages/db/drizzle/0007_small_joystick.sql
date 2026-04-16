ALTER TABLE "articles" ADD COLUMN "public_number" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "public_number" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "public_number" serial NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "articles_public_number_idx" ON "articles" USING btree ("public_number");--> statement-breakpoint
CREATE UNIQUE INDEX "events_public_number_idx" ON "events" USING btree ("public_number");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_public_number_idx" ON "jobs" USING btree ("public_number");
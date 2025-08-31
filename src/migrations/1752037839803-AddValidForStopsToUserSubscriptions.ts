import { MigrationInterface, QueryRunner } from "typeorm";

export class AddValidForStopsToUserSubscriptions1752037839803 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add columns as nullable
        await queryRunner.query(`ALTER TABLE "user_subscriptions" ADD COLUMN "validForPickupStopId" uuid`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" ADD COLUMN "validForDropOffStopId" uuid`);

        // 2. Backfill with a real value from route_stops (replace with a real UUID!)
        // You MUST replace 'REPLACE_WITH_REAL_UUID' with a real id from your route_stops table before running
        const fallbackStopId = 'd69b2f31-41e4-4b1f-80c4-33aa4976986b';
        await queryRunner.query(`UPDATE "user_subscriptions" SET "validForPickupStopId" = '${fallbackStopId}' WHERE "validForPickupStopId" IS NULL`);
        await queryRunner.query(`UPDATE "user_subscriptions" SET "validForDropOffStopId" = '${fallbackStopId}' WHERE "validForDropOffStopId" IS NULL`);

        // 3. Set NOT NULL
        await queryRunner.query(`ALTER TABLE "user_subscriptions" ALTER COLUMN "validForPickupStopId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" ALTER COLUMN "validForDropOffStopId" SET NOT NULL`);

        // 4. Add foreign keys
        await queryRunner.query(`ALTER TABLE "user_subscriptions" ADD CONSTRAINT "fk_validForPickupStopId_route_stops" FOREIGN KEY ("validForPickupStopId") REFERENCES "route_stops"("id")`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" ADD CONSTRAINT "fk_validForDropOffStopId_route_stops" FOREIGN KEY ("validForDropOffStopId") REFERENCES "route_stops"("id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_subscriptions" DROP CONSTRAINT IF EXISTS "fk_validForPickupStopId_route_stops"`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" DROP CONSTRAINT IF EXISTS "fk_validForDropOffStopId_route_stops"`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" DROP COLUMN IF EXISTS "validForPickupStopId"`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" DROP COLUMN IF EXISTS "validForDropOffStopId"`);
    }
} 
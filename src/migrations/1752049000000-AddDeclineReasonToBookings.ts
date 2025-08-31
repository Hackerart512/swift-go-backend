// src/migrations/1752049000000-AddDeclineReasonToBookings.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeclineReasonToBookings1752049000000 implements MigrationInterface {
    name = 'AddDeclineReasonToBookings1752049000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // This is the smart way: Add the new enum value only IF IT DOES NOT already exist.
        // This makes the script safe to re-run.
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'declined_by_driver' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'bookings_status_enum')) THEN
                    ALTER TYPE "public"."bookings_status_enum" ADD VALUE 'declined_by_driver';
                END IF;
            END$$;
        `);
        
        // This part is unchanged: add the column to the bookings table.
        // It will fail if the column exists, but in our case, we know it's the enum that was the problem.
        await queryRunner.query(`ALTER TABLE "bookings" ADD "driverDeclineReason" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // This part is unchanged
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "driverDeclineReason"`);
    }
}
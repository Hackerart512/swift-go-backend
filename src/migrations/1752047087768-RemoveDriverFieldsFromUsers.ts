import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveDriverFieldsFromUsers1752047087768 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN IF EXISTS "driverStatus",
            DROP COLUMN IF EXISTS "driversLicenseUrl",
            DROP COLUMN IF EXISTS "vehicleRcUrl",
            DROP COLUMN IF EXISTS "vehicleInsuranceUrl",
            DROP COLUMN IF EXISTS "vehicleTypeInfo"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "driverStatus" varchar(50),
            ADD COLUMN "driversLicenseUrl" varchar(255),
            ADD COLUMN "vehicleRcUrl" varchar(255),
            ADD COLUMN "vehicleInsuranceUrl" varchar(255),
            ADD COLUMN "vehicleTypeInfo" varchar(255)
        `);
    }
} 
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUidToUsers1756925601614 implements MigrationInterface {
    name = 'AddUidToUsers1756925601614'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "uid" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_6e20ce1edf0678a09f1963f9587" UNIQUE ("uid")`);
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "crn" SET DEFAULT 'TEMP_CRN_' || uuid_generate_v4()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "crn" SET DEFAULT ('TEMP_CRN_'|| uuid_generate_v4())`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_6e20ce1edf0678a09f1963f9587"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "uid"`);
    }

}

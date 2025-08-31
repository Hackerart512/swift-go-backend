import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationToRouteStops1710000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "route_stops" ADD COLUMN "location" geometry(Point,4326)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "route_stops" DROP COLUMN "location"`);
    }
} 
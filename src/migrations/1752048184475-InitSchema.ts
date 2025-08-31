import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1752048184475 implements MigrationInterface {
    name = 'InitSchema1752048184475'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."favorite_locations_type_enum" AS ENUM('home', 'work', 'other')
        `);
        await queryRunner.query(`
            CREATE TABLE "favorite_locations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "address" character varying(255) NOT NULL,
                "latitude" numeric(10, 7) NOT NULL,
                "longitude" numeric(10, 7) NOT NULL,
                "type" "public"."favorite_locations_type_enum" NOT NULL,
                "name" character varying(100),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_b3a42d662b69e2b054e3c7e95d5" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."subscription_plans_durationunit_enum" AS ENUM('day', 'month', 'year')
        `);
        await queryRunner.query(`
            CREATE TABLE "subscription_plans" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "description" text,
                "price" numeric(10, 2) NOT NULL,
                "currency" character varying(10) NOT NULL DEFAULT 'INR',
                "durationValue" integer NOT NULL,
                "durationUnit" "public"."subscription_plans_durationunit_enum" NOT NULL,
                "ridesIncluded" integer,
                "trialDays" integer NOT NULL DEFAULT '0',
                "isActive" boolean NOT NULL DEFAULT true,
                "sortOrder" integer NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_ae18a0f6e0143f06474aa8cef1f" UNIQUE ("name"),
                CONSTRAINT "PK_9ab8fe6918451ab3d0a4fb6bb0c" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "vehicle_types" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "description" text,
                "passengerCapacity" integer NOT NULL,
                "simpleSeatIdentifiers" jsonb,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_521e89eb074cfce4a101397064f" UNIQUE ("name"),
                CONSTRAINT "PK_73d1e40f4add7f4f6947acad3a8" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_521e89eb074cfce4a101397064" ON "vehicle_types" ("name")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."vehicles_status_enum" AS ENUM('active', 'inactive', 'under_maintenance')
        `);
        await queryRunner.query(`
            CREATE TABLE "vehicles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "registrationNumber" character varying(20) NOT NULL,
                "modelName" character varying(100),
                "color" character varying(50),
                "vehicleTypeId" uuid NOT NULL,
                "actualPassengerCapacity" integer,
                "status" "public"."vehicles_status_enum" NOT NULL DEFAULT 'active',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_7efe158ba0ac7b54ffecbfe0a3a" UNIQUE ("registrationNumber"),
                CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7efe158ba0ac7b54ffecbfe0a3" ON "vehicles" ("registrationNumber")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."bookings_status_enum" AS ENUM(
                'pending_payment',
                'confirmed',
                'ongoing',
                'completed',
                'cancelled_by_user',
                'cancelled_by_admin',
                'no_show'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "bookings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "crn" character varying NOT NULL DEFAULT 'TEMP_CRN_' || uuid_generate_v4(),
                "currency" character varying(10) NOT NULL DEFAULT 'INR',
                "roundTripId" uuid,
                "userId" uuid NOT NULL,
                "scheduledTripId" uuid NOT NULL,
                "pickupStopId" uuid NOT NULL,
                "dropOffStopId" uuid NOT NULL,
                "bookedSeatIds" jsonb NOT NULL DEFAULT '[]',
                "numberOfSeatsBooked" integer NOT NULL DEFAULT '1',
                "baseFare" numeric(10, 2) NOT NULL DEFAULT '0',
                "discountAmount" numeric(10, 2) NOT NULL DEFAULT '0',
                "couponCodeApplied" character varying(100),
                "taxAmount" numeric(10, 2) NOT NULL DEFAULT '0',
                "totalFarePaid" numeric(10, 2) NOT NULL DEFAULT '0',
                "status" "public"."bookings_status_enum" NOT NULL DEFAULT 'pending_payment',
                "paymentDetails" jsonb,
                "rideType" character varying(255) NOT NULL DEFAULT 'One Way',
                "cancellationReason" text,
                "rating" integer,
                "feedbackComment" text,
                "tipAmount" numeric(10, 2),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "boardingOtp" character varying(6),
                "boardingOtpExpiresAt" TIMESTAMP WITH TIME ZONE,
                "tripDepartureDateTime" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_65d3c1674fea96fb714ff5967d" ON "bookings" ("roundTripId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ba6f849491fc9d196d31ebbf08" ON "bookings" ("tripDepartureDateTime")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_18ba3b5648e0fd8b94146ae7a9" ON "bookings" ("scheduledTripId", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_fd3f073724de789b58a095cea1" ON "bookings" ("userId", "status", "createdAt")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."scheduled_trips_status_enum" AS ENUM(
                'scheduled',
                'active',
                'completed',
                'cancelled',
                'full',
                'delayed'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "scheduled_trips" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "routeId" uuid NOT NULL,
                "vehicleId" uuid NOT NULL,
                "departureDateTime" TIMESTAMP WITH TIME ZONE NOT NULL,
                "estimatedArrivalDateTime" TIMESTAMP WITH TIME ZONE NOT NULL,
                "status" "public"."scheduled_trips_status_enum" NOT NULL DEFAULT 'scheduled',
                "initialAvailableSeats" integer NOT NULL,
                "currentAvailableSeats" integer NOT NULL,
                "pricePerSeat" numeric(10, 2) NOT NULL,
                "currency" character varying(10) NOT NULL DEFAULT 'INR',
                "isActive" boolean NOT NULL DEFAULT true,
                "adminNotes" text,
                "driverInstructions" text,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_73b7accc36e32269fc6ba7c9cd1" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_a24fb7bfd1c70e9c804c2ee715" ON "scheduled_trips" ("vehicleId", "departureDateTime", "status")
            WHERE status IN ('scheduled', 'active', 'delayed')
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_9f9296f09839d7b341513920a7" ON "scheduled_trips" ("routeId", "departureDateTime")
        `);
        await queryRunner.query(`
            CREATE TABLE "routes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "originAreaName" character varying(255) NOT NULL,
                "destinationAreaName" character varying(255) NOT NULL,
                "description" text,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_1c06ee6b2a818319f29934fd6ad" UNIQUE ("name"),
                CONSTRAINT "PK_76100511cdfa1d013c859f01d8b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1c06ee6b2a818319f29934fd6a" ON "routes" ("name")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."route_stops_type_enum" AS ENUM('pickup', 'dropoff', 'pickup_dropoff')
        `);
        await queryRunner.query(`
            CREATE TABLE "route_stops" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "routeId" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "addressDetails" text,
                "location" geometry(Point, 4326),
                "type" "public"."route_stops_type_enum" NOT NULL DEFAULT 'pickup_dropoff',
                "sequence" integer NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_22c09afc24c0a7a13644c629073" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_39e5b09e4edb32215a9d071881" ON "route_stops" USING GiST ("location")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_05e1f3fb006cb859635c7eccd4" ON "route_stops" ("routeId", "sequence")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."user_subscriptions_status_enum" AS ENUM(
                'active',
                'expired',
                'cancelled',
                'pending_payment',
                'trial'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."user_subscriptions_commutetype_enum" AS ENUM('morning', 'evening')
        `);
        await queryRunner.query(`
            CREATE TABLE "user_subscriptions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "planId" uuid NOT NULL,
                "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
                "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
                "trialEndDate" TIMESTAMP WITH TIME ZONE,
                "status" "public"."user_subscriptions_status_enum" NOT NULL DEFAULT 'pending_payment',
                "remainingRides" integer,
                "paymentDetails" jsonb,
                "nextBillingDate" TIMESTAMP WITH TIME ZONE,
                "autoRenew" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "validForPickupStopId" uuid NOT NULL,
                "validForDropOffStopId" uuid,
                "commuteType" "public"."user_subscriptions_commutetype_enum",
                CONSTRAINT "PK_9e928b0954e51705ab44988812c" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_565dbec603dc3f8c5b60aeda96" ON "user_subscriptions" ("userId", "status")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."users_commutepreference_enum" AS ENUM('morning', 'evening')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."users_gender_enum" AS ENUM('male', 'female', 'other', 'prefer_not_to_say')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."users_phoneverificationstatus_enum" AS ENUM('pending', 'verified')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."users_kycstatus_enum" AS ENUM('pending', 'verified', 'failed', 'skipped')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."users_role_enum" AS ENUM('passenger', 'admin')
        `);
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying(255),
                "password" character varying(255),
                "commutePreference" "public"."users_commutepreference_enum",
                "fullName" character varying(255),
                "preferredMorningRouteOrigin" character varying,
                "preferredMorningRouteDestination" character varying,
                "preferredMorningArrivalTime" character varying,
                "aadhaarNumber" character varying(12),
                "dateOfBirth" date,
                "gender" "public"."users_gender_enum",
                "address" text,
                "mobileNumber" character varying(20),
                "phoneVerificationStatus" "public"."users_phoneverificationstatus_enum" DEFAULT 'pending',
                "phoneOtp" character varying(10),
                "phoneOtpExpiresAt" TIMESTAMP WITH TIME ZONE,
                "kycStatus" "public"."users_kycstatus_enum" NOT NULL DEFAULT 'pending',
                "kycDetails" jsonb,
                "profilePhotoUrl" character varying(255),
                "residentialLocation" text,
                "workLocation" text,
                "preferredTiming" character varying(50),
                "walletBalance" numeric(10, 2) NOT NULL DEFAULT '0',
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "role" "public"."users_role_enum" NOT NULL DEFAULT 'passenger',
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "UQ_fc8f123130edbf231c8253ab44c" UNIQUE ("aadhaarNumber"),
                CONSTRAINT "UQ_61dc14c8c49c187f5d08047c985" UNIQUE ("mobileNumber"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."route_suggestions_ridetype_enum" AS ENUM('morning', 'evening')
        `);
        await queryRunner.query(`
            CREATE TABLE "route_suggestions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "startLocationAddress" text NOT NULL,
                "endLocationAddress" text NOT NULL,
                "rideType" "public"."route_suggestions_ridetype_enum" NOT NULL,
                "desiredArrivalTime" character varying(50) NOT NULL,
                "updateProfilePreferences" boolean NOT NULL DEFAULT false,
                "suggestionText" text,
                "status" character varying(50) NOT NULL DEFAULT 'pending',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_f2ec89386c083d47faee0dfef17" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "promotions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "imageUrl" character varying(500),
                "termsLink" character varying(500),
                "promoCode" character varying(50),
                "startDate" TIMESTAMP WITH TIME ZONE,
                "endDate" TIMESTAMP WITH TIME ZONE,
                "isActive" boolean NOT NULL DEFAULT false,
                "type" character varying(100),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_380cecbbe3ac11f0e5a7c452c34" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "faq_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "categoryId" uuid NOT NULL,
                "question" character varying(500) NOT NULL,
                "answer" text NOT NULL,
                "sortOrder" integer NOT NULL DEFAULT '0',
                "isActive" boolean NOT NULL DEFAULT true,
                "helpfulCount" integer NOT NULL DEFAULT '0',
                "notHelpfulCount" integer NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_72fbce3e53149fa821abbf674ea" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c5efd0e1901e5e86f1d59b09a6" ON "faq_items" ("question")
        `);
        await queryRunner.query(`
            CREATE TABLE "help_categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(100) NOT NULL,
                "iconName" character varying(100),
                "sortOrder" integer NOT NULL DEFAULT '0',
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_b0a51543a0320d6b7dcf2a59574" UNIQUE ("title"),
                CONSTRAINT "PK_2d31cc840b31187d146e61912f3" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b0a51543a0320d6b7dcf2a5957" ON "help_categories" ("title")
        `);
        await queryRunner.query(`
            ALTER TABLE "favorite_locations"
            ADD CONSTRAINT "FK_f0bc9b213e1eb075844ed7f52b7" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "vehicles"
            ADD CONSTRAINT "FK_72d0f0ecfc71ee89771f3de60dc" FOREIGN KEY ("vehicleTypeId") REFERENCES "vehicle_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "FK_38a69a58a323647f2e75eb994de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "FK_54d24dac44717ae883e528c1f57" FOREIGN KEY ("scheduledTripId") REFERENCES "scheduled_trips"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "FK_bb38008c70369eb9c31aa432538" FOREIGN KEY ("pickupStopId") REFERENCES "route_stops"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "FK_bf723eecf5d930c7282f5ab99be" FOREIGN KEY ("dropOffStopId") REFERENCES "route_stops"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "scheduled_trips"
            ADD CONSTRAINT "FK_793330297bea0520be61456dc96" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "scheduled_trips"
            ADD CONSTRAINT "FK_9d86cb24eff77d1744d8c17734e" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "route_stops"
            ADD CONSTRAINT "FK_352e45964a86c097a435f643004" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_subscriptions"
            ADD CONSTRAINT "FK_2dfab576863bc3f84d4f6962274" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_subscriptions"
            ADD CONSTRAINT "FK_55c9f77733123bd2ead29886017" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_subscriptions"
            ADD CONSTRAINT "FK_62aa83efe336ff292d3ff78e4d9" FOREIGN KEY ("validForPickupStopId") REFERENCES "route_stops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_subscriptions"
            ADD CONSTRAINT "FK_cf22d9d187317423bc8f4a32fa7" FOREIGN KEY ("validForDropOffStopId") REFERENCES "route_stops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "route_suggestions"
            ADD CONSTRAINT "FK_bb33f58bf2a0da427c7b7d68d8e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "faq_items"
            ADD CONSTRAINT "FK_c4b32b18606963931d4e5260aac" FOREIGN KEY ("categoryId") REFERENCES "help_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "faq_items" DROP CONSTRAINT "FK_c4b32b18606963931d4e5260aac"
        `);
        await queryRunner.query(`
            ALTER TABLE "route_suggestions" DROP CONSTRAINT "FK_bb33f58bf2a0da427c7b7d68d8e"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_cf22d9d187317423bc8f4a32fa7"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_62aa83efe336ff292d3ff78e4d9"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_55c9f77733123bd2ead29886017"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_2dfab576863bc3f84d4f6962274"
        `);
        await queryRunner.query(`
            ALTER TABLE "route_stops" DROP CONSTRAINT "FK_352e45964a86c097a435f643004"
        `);
        await queryRunner.query(`
            ALTER TABLE "scheduled_trips" DROP CONSTRAINT "FK_9d86cb24eff77d1744d8c17734e"
        `);
        await queryRunner.query(`
            ALTER TABLE "scheduled_trips" DROP CONSTRAINT "FK_793330297bea0520be61456dc96"
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "FK_bf723eecf5d930c7282f5ab99be"
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "FK_bb38008c70369eb9c31aa432538"
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "FK_54d24dac44717ae883e528c1f57"
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "FK_38a69a58a323647f2e75eb994de"
        `);
        await queryRunner.query(`
            ALTER TABLE "vehicles" DROP CONSTRAINT "FK_72d0f0ecfc71ee89771f3de60dc"
        `);
        await queryRunner.query(`
            ALTER TABLE "favorite_locations" DROP CONSTRAINT "FK_f0bc9b213e1eb075844ed7f52b7"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b0a51543a0320d6b7dcf2a5957"
        `);
        await queryRunner.query(`
            DROP TABLE "help_categories"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c5efd0e1901e5e86f1d59b09a6"
        `);
        await queryRunner.query(`
            DROP TABLE "faq_items"
        `);
        await queryRunner.query(`
            DROP TABLE "promotions"
        `);
        await queryRunner.query(`
            DROP TABLE "route_suggestions"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."route_suggestions_ridetype_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "users"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."users_role_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."users_kycstatus_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."users_phoneverificationstatus_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."users_gender_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."users_commutepreference_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_565dbec603dc3f8c5b60aeda96"
        `);
        await queryRunner.query(`
            DROP TABLE "user_subscriptions"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."user_subscriptions_commutetype_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."user_subscriptions_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_05e1f3fb006cb859635c7eccd4"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_39e5b09e4edb32215a9d071881"
        `);
        await queryRunner.query(`
            DROP TABLE "route_stops"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."route_stops_type_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1c06ee6b2a818319f29934fd6a"
        `);
        await queryRunner.query(`
            DROP TABLE "routes"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_9f9296f09839d7b341513920a7"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a24fb7bfd1c70e9c804c2ee715"
        `);
        await queryRunner.query(`
            DROP TABLE "scheduled_trips"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."scheduled_trips_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_fd3f073724de789b58a095cea1"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_18ba3b5648e0fd8b94146ae7a9"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ba6f849491fc9d196d31ebbf08"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_65d3c1674fea96fb714ff5967d"
        `);
        await queryRunner.query(`
            DROP TABLE "bookings"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."bookings_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7efe158ba0ac7b54ffecbfe0a3"
        `);
        await queryRunner.query(`
            DROP TABLE "vehicles"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."vehicles_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_521e89eb074cfce4a101397064"
        `);
        await queryRunner.query(`
            DROP TABLE "vehicle_types"
        `);
        await queryRunner.query(`
            DROP TABLE "subscription_plans"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."subscription_plans_durationunit_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "favorite_locations"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."favorite_locations_type_enum"
        `);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOtpEmailAndPurpose1767174521888 implements MigrationInterface {
    name = 'AddOtpEmailAndPurpose1767174521888'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otp_codes" ADD "email" character varying(255)`);
        await queryRunner.query(`CREATE TYPE "public"."otp_codes_purpose_enum" AS ENUM('login', 'signup', 'password_reset', 'phone_verification', 'email_verification')`);
        await queryRunner.query(`ALTER TABLE "otp_codes" ADD "purpose" "public"."otp_codes_purpose_enum" NOT NULL DEFAULT 'login'`);
        await queryRunner.query(`CREATE TYPE "public"."otp_codes_deliverymethod_enum" AS ENUM('email', 'sms')`);
        await queryRunner.query(`ALTER TABLE "otp_codes" ADD "deliveryMethod" "public"."otp_codes_deliverymethod_enum" NOT NULL DEFAULT 'email'`);
        await queryRunner.query(`ALTER TABLE "otp_codes" ALTER COLUMN "phone" DROP NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_9e85e1945c47dfb71042ae5d19" ON "otp_codes" ("email") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_9e85e1945c47dfb71042ae5d19"`);
        await queryRunner.query(`ALTER TABLE "otp_codes" ALTER COLUMN "phone" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "otp_codes" DROP COLUMN "deliveryMethod"`);
        await queryRunner.query(`DROP TYPE "public"."otp_codes_deliverymethod_enum"`);
        await queryRunner.query(`ALTER TABLE "otp_codes" DROP COLUMN "purpose"`);
        await queryRunner.query(`DROP TYPE "public"."otp_codes_purpose_enum"`);
        await queryRunner.query(`ALTER TABLE "otp_codes" DROP COLUMN "email"`);
    }

}

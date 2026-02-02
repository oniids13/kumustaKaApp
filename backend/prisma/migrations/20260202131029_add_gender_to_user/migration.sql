-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "gender" "Gender";

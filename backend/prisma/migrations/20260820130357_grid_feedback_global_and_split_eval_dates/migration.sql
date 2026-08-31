/*
  Warnings:

  - You are about to drop the column `date` on the `CriteriaAssessment` table. All the data in the column will be lost.
  - You are about to drop the column `commentEval` on the `GridFeedback` table. All the data in the column will be lost.
  - You are about to drop the column `commentFeedback` on the `GridFeedback` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `GridFeedback` table. All the data in the column will be lost.
  - Added the required column `status` to the `GridFeedback` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GridFeedbackStatus" AS ENUM ('PENDING', 'CORRECTION', 'PUBLISHED', 'SEEN');

-- DropForeignKey
ALTER TABLE "GridFeedback" DROP CONSTRAINT "GridFeedback_userId_fkey";

-- DropIndex
DROP INDEX "GridFeedback_userId_idx";

-- AlterTable
ALTER TABLE "CriteriaAssessment" DROP COLUMN "date",
ADD COLUMN     "dateEval" TIMESTAMP(3),
ADD COLUMN     "dateFeedback" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "GridFeedback" DROP COLUMN "commentEval",
DROP COLUMN "commentFeedback",
DROP COLUMN "userId",
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "date" TIMESTAMP(3),
ADD COLUMN     "status" "GridFeedbackStatus" NOT NULL;

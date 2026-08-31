/*
  Warnings:

  - The primary key for the `CriteriaAssessment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `commentEval` on the `CriteriaAssessment` table. All the data in the column will be lost.
  - You are about to drop the column `dateEval` on the `CriteriaAssessment` table. All the data in the column will be lost.
  - You are about to drop the column `dateFeedback` on the `CriteriaAssessment` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `CriteriaAssessment` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "CriteriaAssessment_criteriaId_idx";

-- DropIndex
DROP INDEX "CriteriaAssessment_criteriaId_teacherId_projectId_key";

-- AlterTable
ALTER TABLE "CriteriaAssessment" DROP CONSTRAINT "CriteriaAssessment_pkey",
DROP COLUMN "commentEval",
DROP COLUMN "dateEval",
DROP COLUMN "dateFeedback",
DROP COLUMN "id",
ADD COLUMN     "date" TIMESTAMP(3),
ADD CONSTRAINT "CriteriaAssessment_pkey" PRIMARY KEY ("criteriaId", "teacherId", "projectId");

-- CreateTable
CREATE TABLE "CriteriaDiscussion" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3),
    "comment" TEXT,
    "criteriaId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriteriaDiscussion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CriteriaDiscussion_criteriaId_projectId_idx" ON "CriteriaDiscussion"("criteriaId", "projectId");

-- CreateIndex
CREATE INDEX "CriteriaDiscussion_teacherId_idx" ON "CriteriaDiscussion"("teacherId");

-- AddForeignKey
ALTER TABLE "CriteriaDiscussion" ADD CONSTRAINT "CriteriaDiscussion_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "Criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriteriaDiscussion" ADD CONSTRAINT "CriteriaDiscussion_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriteriaDiscussion" ADD CONSTRAINT "CriteriaDiscussion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

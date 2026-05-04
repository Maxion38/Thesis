/*
  Warnings:

  - The values [USERVALIDATION,SUPERVISORVALIDATION,TOOLSUBMISSION] on the enum `ConditionMethod` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `courseModuleId` on the `Condition` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `FormSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `isRequired` on the `QuestionOption` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `QuestionOption` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserTrainingCourse` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `UserValidation` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserValidation` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `UserWorkSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Weighting` table. All the data in the column will be lost.
  - You are about to drop the `CourseModule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ModuleTool` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `moduleId` to the `Condition` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `FormSubmission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `trainingCourseId` to the `Module` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Question` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `order` to the `QuestionOption` table without a default value. This is not possible if the table is not empty.
  - Added the required column `moduleId` to the `Tool` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Tool` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ToolType" AS ENUM ('FORM', 'ACTIVITY', 'WORK', 'ASSESSMENT');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TEXT', 'NUMBER', 'RADIO', 'CHECKBOX');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('NOT_SUBMITED', 'SUBMITTED', 'APPROVED');

-- AlterEnum
BEGIN;
CREATE TYPE "ConditionMethod_new" AS ENUM ('USER_VALIDATION', 'SUPERVISOR_VALIDATION', 'TOOL_SUBMISSION', 'DATE');
ALTER TABLE "Condition" ALTER COLUMN "method" TYPE "ConditionMethod_new" USING ("method"::text::"ConditionMethod_new");
ALTER TYPE "ConditionMethod" RENAME TO "ConditionMethod_old";
ALTER TYPE "ConditionMethod_new" RENAME TO "ConditionMethod";
DROP TYPE "ConditionMethod_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Condition" DROP CONSTRAINT "Condition_courseModuleId_fkey";

-- DropForeignKey
ALTER TABLE "CourseModule" DROP CONSTRAINT "CourseModule_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "CourseModule" DROP CONSTRAINT "CourseModule_trainingCourseId_fkey";

-- DropForeignKey
ALTER TABLE "ModuleTool" DROP CONSTRAINT "ModuleTool_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "ModuleTool" DROP CONSTRAINT "ModuleTool_toolId_fkey";

-- AlterTable
ALTER TABLE "Assessment" ALTER COLUMN "grade" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Condition" DROP COLUMN "courseModuleId",
ADD COLUMN     "moduleId" INTEGER NOT NULL,
ALTER COLUMN "validationBySupervisor" SET DEFAULT false;

-- AlterTable
ALTER TABLE "FormSubmission" DROP COLUMN "date",
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" "SubmissionStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "trainingCourseId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Notebook" ALTER COLUMN "lastModified" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "dateTime" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "type",
ADD COLUMN     "type" "QuestionType" NOT NULL;

-- AlterTable
ALTER TABLE "QuestionOption" DROP COLUMN "isRequired",
DROP COLUMN "type",
ADD COLUMN     "order" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Tool" ADD COLUMN     "moduleId" INTEGER NOT NULL,
ADD COLUMN     "type" "ToolType" NOT NULL;

-- AlterTable
ALTER TABLE "UserTrainingCourse" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "UserValidation" DROP COLUMN "date",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "UserWorkSubmission" DROP COLUMN "date",
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Weighting" DROP COLUMN "updatedAt";

-- DropTable
DROP TABLE "CourseModule";

-- DropTable
DROP TABLE "ModuleTool";

-- CreateIndex
CREATE INDEX "Assessment_studentId_idx" ON "Assessment"("studentId");

-- CreateIndex
CREATE INDEX "Assessment_teacherId_idx" ON "Assessment"("teacherId");

-- CreateIndex
CREATE INDEX "Assessment_gridVersionId_idx" ON "Assessment"("gridVersionId");

-- CreateIndex
CREATE INDEX "Condition_moduleId_idx" ON "Condition"("moduleId");

-- CreateIndex
CREATE INDEX "Condition_toolId_idx" ON "Condition"("toolId");

-- CreateIndex
CREATE INDEX "Condition_validatorId_idx" ON "Condition"("validatorId");

-- CreateIndex
CREATE INDEX "Module_trainingCourseId_idx" ON "Module"("trainingCourseId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_trainingCourseId_idx" ON "Notification"("trainingCourseId");

-- CreateIndex
CREATE INDEX "Tool_moduleId_idx" ON "Tool"("moduleId");

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "TrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

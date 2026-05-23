/*
  Warnings:

  - You are about to drop the column `date` on the `Condition` table. All the data in the column will be lost.
  - You are about to drop the column `moduleId` on the `Condition` table. All the data in the column will be lost.
  - You are about to drop the column `operator` on the `Condition` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Condition` table. All the data in the column will be lost.
  - You are about to drop the column `validationBySupervisor` on the `Condition` table. All the data in the column will be lost.
  - You are about to drop the column `trainingCourseId` on the `Group` table. All the data in the column will be lost.
  - The primary key for the `Notebook` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `studentId` on the `Notebook` table. All the data in the column will be lost.
  - You are about to drop the column `teacherId` on the `Notebook` table. All the data in the column will be lost.
  - You are about to drop the column `trainingCourseId` on the `Notebook` table. All the data in the column will be lost.
  - You are about to drop the column `trainingCourseId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `supervisorPreferences` on the `User` table. All the data in the column will be lost.
  - The primary key for the `Weighting` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `Weighting` table. All the data in the column will be lost.
  - You are about to drop the `Assessment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserTrainingCourse` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `conditionsSubgroupId` to the `Condition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `FormSubmission` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `Invitation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `projectId` to the `Notebook` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Notebook` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `UserWorkSubmission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `Weighting` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('STUDENT', 'TEACHER', 'COORDINATOR', 'GUEST');

-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_criteriaId_fkey";

-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_gridVersionId_fkey";

-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "Condition" DROP CONSTRAINT "Condition_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_trainingCourseId_fkey";

-- DropForeignKey
ALTER TABLE "Notebook" DROP CONSTRAINT "Notebook_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Notebook" DROP CONSTRAINT "Notebook_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "Notebook" DROP CONSTRAINT "Notebook_trainingCourseId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_trainingCourseId_fkey";

-- DropForeignKey
ALTER TABLE "UserTrainingCourse" DROP CONSTRAINT "UserTrainingCourse_trainingCourseId_fkey";

-- DropForeignKey
ALTER TABLE "UserTrainingCourse" DROP CONSTRAINT "UserTrainingCourse_userId_fkey";

-- DropForeignKey
ALTER TABLE "Weighting" DROP CONSTRAINT "Weighting_userId_fkey";

-- DropIndex
DROP INDEX "Condition_moduleId_idx";

-- DropIndex
DROP INDEX "Notification_trainingCourseId_idx";

-- AlterTable
ALTER TABLE "Condition" DROP COLUMN "date",
DROP COLUMN "moduleId",
DROP COLUMN "operator",
DROP COLUMN "type",
DROP COLUMN "validationBySupervisor",
ADD COLUMN     "conditionsSubgroupId" INTEGER NOT NULL,
ADD COLUMN     "dateValue" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "FormSubmission" ADD COLUMN     "projectId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Group" DROP COLUMN "trainingCourseId";

-- AlterTable
ALTER TABLE "Invitation" DROP COLUMN "role",
ADD COLUMN     "role" "RoleType" NOT NULL;

-- AlterTable
ALTER TABLE "Notebook" DROP CONSTRAINT "Notebook_pkey",
DROP COLUMN "studentId",
DROP COLUMN "teacherId",
DROP COLUMN "trainingCourseId",
ADD COLUMN     "projectId" INTEGER NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "Notebook_pkey" PRIMARY KEY ("userId", "projectId");

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "trainingCourseId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
DROP COLUMN "supervisorPreferences";

-- AlterTable
ALTER TABLE "UserWorkSubmission" ADD COLUMN     "projectId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Weighting" DROP CONSTRAINT "Weighting_pkey",
DROP COLUMN "userId",
ADD COLUMN     "projectId" INTEGER NOT NULL,
ADD CONSTRAINT "Weighting_pkey" PRIMARY KEY ("criteriaId", "projectId");

-- DropTable
DROP TABLE "Assessment";

-- DropTable
DROP TABLE "UserTrainingCourse";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "role" "RoleType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "UserSupervisorPreference" (
    "userId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "UserSupervisorPreference_pkey" PRIMARY KEY ("userId","teacherId","projectId")
);

-- CreateTable
CREATE TABLE "CriteriaAssessment" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "comment" TEXT,
    "cellId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "criteriaId" INTEGER NOT NULL,
    "studentId" INTEGER,
    "teacherId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriteriaAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GridVersionFeedback" (
    "id" SERIAL NOT NULL,
    "comment" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "gridVersionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GridVersionFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "supervisorId" INTEGER,
    "trainingCourseId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("userId","projectId")
);

-- CreateTable
CREATE TABLE "ConditionsGroup" (
    "id" SERIAL NOT NULL,
    "type" "ConditionType" NOT NULL,
    "operator" "ConditionOperator" NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConditionsGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConditionsSubgroup" (
    "id" SERIAL NOT NULL,
    "operator" "ConditionOperator" NOT NULL,
    "conditionsGroupId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConditionsSubgroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_role_key" ON "Role"("role");

-- CreateIndex
CREATE INDEX "CriteriaAssessment_projectId_idx" ON "CriteriaAssessment"("projectId");

-- CreateIndex
CREATE INDEX "CriteriaAssessment_studentId_idx" ON "CriteriaAssessment"("studentId");

-- CreateIndex
CREATE INDEX "CriteriaAssessment_teacherId_idx" ON "CriteriaAssessment"("teacherId");

-- CreateIndex
CREATE INDEX "CriteriaAssessment_criteriaId_idx" ON "CriteriaAssessment"("criteriaId");

-- CreateIndex
CREATE INDEX "GridVersionFeedback_projectId_idx" ON "GridVersionFeedback"("projectId");

-- CreateIndex
CREATE INDEX "GridVersionFeedback_gridVersionId_idx" ON "GridVersionFeedback"("gridVersionId");

-- CreateIndex
CREATE INDEX "ProjectMember_projectId_idx" ON "ProjectMember"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

-- CreateIndex
CREATE INDEX "FormSubmission_projectId_idx" ON "FormSubmission"("projectId");

-- CreateIndex
CREATE INDEX "FormSubmission_userId_idx" ON "FormSubmission"("userId");

-- CreateIndex
CREATE INDEX "UserWorkSubmission_projectId_idx" ON "UserWorkSubmission"("projectId");

-- CreateIndex
CREATE INDEX "UserWorkSubmission_userId_idx" ON "UserWorkSubmission"("userId");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSupervisorPreference" ADD CONSTRAINT "UserSupervisorPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSupervisorPreference" ADD CONSTRAINT "UserSupervisorPreference_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSupervisorPreference" ADD CONSTRAINT "UserSupervisorPreference_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_conditionsSubgroupId_fkey" FOREIGN KEY ("conditionsSubgroupId") REFERENCES "ConditionsSubgroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWorkSubmission" ADD CONSTRAINT "UserWorkSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriteriaAssessment" ADD CONSTRAINT "CriteriaAssessment_cellId_fkey" FOREIGN KEY ("cellId") REFERENCES "Cell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriteriaAssessment" ADD CONSTRAINT "CriteriaAssessment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriteriaAssessment" ADD CONSTRAINT "CriteriaAssessment_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "Criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriteriaAssessment" ADD CONSTRAINT "CriteriaAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriteriaAssessment" ADD CONSTRAINT "CriteriaAssessment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weighting" ADD CONSTRAINT "Weighting_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GridVersionFeedback" ADD CONSTRAINT "GridVersionFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GridVersionFeedback" ADD CONSTRAINT "GridVersionFeedback_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GridVersionFeedback" ADD CONSTRAINT "GridVersionFeedback_gridVersionId_fkey" FOREIGN KEY ("gridVersionId") REFERENCES "GridVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "TrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionsGroup" ADD CONSTRAINT "ConditionsGroup_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionsSubgroup" ADD CONSTRAINT "ConditionsSubgroup_conditionsGroupId_fkey" FOREIGN KEY ("conditionsGroupId") REFERENCES "ConditionsGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notebook" ADD CONSTRAINT "Notebook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notebook" ADD CONSTRAINT "Notebook_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

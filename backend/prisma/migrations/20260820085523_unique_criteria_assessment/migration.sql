/*
  Warnings:

  - A unique constraint covering the columns `[criteriaId,teacherId,projectId]` on the table `CriteriaAssessment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CriteriaAssessment_criteriaId_teacherId_projectId_key" ON "CriteriaAssessment"("criteriaId", "teacherId", "projectId");

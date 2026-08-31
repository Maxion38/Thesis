/*
  Warnings:

  - A unique constraint covering the columns `[gridId,projectId]` on the table `GridFeedback` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "GridFeedback_gridId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "GridFeedback_gridId_projectId_key" ON "GridFeedback"("gridId", "projectId");

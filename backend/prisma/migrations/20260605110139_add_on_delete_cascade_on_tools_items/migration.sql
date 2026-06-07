-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_toolId_fkey";

-- DropForeignKey
ALTER TABLE "AssessmentGrid" DROP CONSTRAINT "AssessmentGrid_toolId_fkey";

-- DropForeignKey
ALTER TABLE "Form" DROP CONSTRAINT "Form_toolId_fkey";

-- DropForeignKey
ALTER TABLE "Work" DROP CONSTRAINT "Work_toolId_fkey";

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Work" ADD CONSTRAINT "Work_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentGrid" ADD CONSTRAINT "AssessmentGrid_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

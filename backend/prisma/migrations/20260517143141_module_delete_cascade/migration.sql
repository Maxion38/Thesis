-- DropForeignKey
ALTER TABLE "Module" DROP CONSTRAINT "Module_trainingCourseId_fkey";

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

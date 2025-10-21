/*
  Warnings:

  - A unique constraint covering the columns `[studentId,courseId,sessionId]` on the table `AcademicRecord` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[courseId,sessionId]` on the table `CourseOffering` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,offeringId]` on the table `Enrollment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[courseId,prerequisiteCourseId]` on the table `Prerequisite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[programName]` on the table `Program` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sessionName]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[firstName,lastName,startDate]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `startDate` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Student` ADD COLUMN `startDate` DATETIME(3) NOT NULL,
    MODIFY `email` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `AcademicRecord_studentId_courseId_sessionId_key` ON `AcademicRecord`(`studentId`, `courseId`, `sessionId`);

-- CreateIndex
CREATE INDEX `Course_courseCode_idx` ON `Course`(`courseCode`);

-- CreateIndex
CREATE UNIQUE INDEX `CourseOffering_courseId_sessionId_key` ON `CourseOffering`(`courseId`, `sessionId`);

-- CreateIndex
CREATE UNIQUE INDEX `Enrollment_studentId_offeringId_key` ON `Enrollment`(`studentId`, `offeringId`);

-- CreateIndex
CREATE UNIQUE INDEX `Prerequisite_courseId_prerequisiteCourseId_key` ON `Prerequisite`(`courseId`, `prerequisiteCourseId`);

-- CreateIndex
CREATE UNIQUE INDEX `Program_programName_key` ON `Program`(`programName`);

-- CreateIndex
CREATE UNIQUE INDEX `Session_sessionName_key` ON `Session`(`sessionName`);

-- CreateIndex
CREATE INDEX `Session_sessionName_idx` ON `Session`(`sessionName`);

-- CreateIndex
CREATE INDEX `Student_lastName_idx` ON `Student`(`lastName`);

-- CreateIndex
CREATE UNIQUE INDEX `Student_firstName_lastName_startDate_key` ON `Student`(`firstName`, `lastName`, `startDate`);

-- RenameIndex
ALTER TABLE `AcademicRecord` RENAME INDEX `AcademicRecord_courseId_fkey` TO `AcademicRecord_courseId_idx`;

-- RenameIndex
ALTER TABLE `AcademicRecord` RENAME INDEX `AcademicRecord_sessionId_fkey` TO `AcademicRecord_sessionId_idx`;

-- RenameIndex
ALTER TABLE `AcademicRecord` RENAME INDEX `AcademicRecord_studentId_fkey` TO `AcademicRecord_studentId_idx`;

-- RenameIndex
ALTER TABLE `Course` RENAME INDEX `Course_programId_fkey` TO `Course_programId_idx`;

-- RenameIndex
ALTER TABLE `CourseOffering` RENAME INDEX `CourseOffering_courseId_fkey` TO `CourseOffering_courseId_idx`;

-- RenameIndex
ALTER TABLE `CourseOffering` RENAME INDEX `CourseOffering_sessionId_fkey` TO `CourseOffering_sessionId_idx`;

-- RenameIndex
ALTER TABLE `Enrollment` RENAME INDEX `Enrollment_offeringId_fkey` TO `Enrollment_offeringId_idx`;

-- RenameIndex
ALTER TABLE `Enrollment` RENAME INDEX `Enrollment_studentId_fkey` TO `Enrollment_studentId_idx`;

-- RenameIndex
ALTER TABLE `Prerequisite` RENAME INDEX `Prerequisite_courseId_fkey` TO `Prerequisite_courseId_idx`;

-- RenameIndex
ALTER TABLE `Prerequisite` RENAME INDEX `Prerequisite_prerequisiteCourseId_fkey` TO `Prerequisite_prerequisiteCourseId_idx`;

-- RenameIndex
ALTER TABLE `Session` RENAME INDEX `Session_programId_fkey` TO `Session_programId_idx`;

-- RenameIndex
ALTER TABLE `Student` RENAME INDEX `Student_programId_fkey` TO `Student_programId_idx`;

-- RenameIndex
ALTER TABLE `Transfer` RENAME INDEX `Transfer_courseId_fkey` TO `Transfer_courseId_idx`;

-- RenameIndex
ALTER TABLE `Transfer` RENAME INDEX `Transfer_studentId_fkey` TO `Transfer_studentId_idx`;

-- CreateTable
CREATE TABLE `Program` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `programName` VARCHAR(191) NOT NULL,
    `programType` VARCHAR(191) NOT NULL,
    `totalCourses` INTEGER NOT NULL,
    `totalUnits` INTEGER NULL,

    UNIQUE INDEX `Program_programName_key`(`programName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Teacher` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherIdNumber` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `hireDate` DATETIME(3) NOT NULL,
    `department` VARCHAR(191) NULL,
    `specialization` VARCHAR(191) NULL,

    UNIQUE INDEX `Teacher_teacherIdNumber_key`(`teacherIdNumber`),
    UNIQUE INDEX `Teacher_email_key`(`email`),
    INDEX `Teacher_teacherIdNumber_idx`(`teacherIdNumber`),
    INDEX `Teacher_lastName_idx`(`lastName`),
    INDEX `Teacher_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Student` (
    `id` BIGINT NOT NULL,
    `studentIdNumber` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `middleName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `sdgkuEmail` VARCHAR(191) NULL,
    `rgmKey` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NOT NULL,
    `admissionDate` DATETIME(3) NULL,
    `enrollmentYear` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `modality` VARCHAR(191) NULL,
    `cohort` VARCHAR(191) NULL,
    `language` VARCHAR(191) NULL,
    `totalUnits` INTEGER NOT NULL DEFAULT 126,
    `transferredUnits` INTEGER NOT NULL DEFAULT 0,
    `unitQuantity` INTEGER NOT NULL DEFAULT 0,
    `totalUnitsEarned` INTEGER NOT NULL DEFAULT 0,
    `scheduledCompletionDate` DATETIME(3) NULL,
    `graduationDate` DATETIME(3) NULL,
    `programId` INTEGER NOT NULL,

    UNIQUE INDEX `Student_studentIdNumber_key`(`studentIdNumber`),
    UNIQUE INDEX `Student_email_key`(`email`),
    UNIQUE INDEX `Student_sdgkuEmail_key`(`sdgkuEmail`),
    UNIQUE INDEX `Student_rgmKey_key`(`rgmKey`),
    INDEX `Student_programId_idx`(`programId`),
    INDEX `Student_lastName_idx`(`lastName`),
    INDEX `Student_rgmKey_idx`(`rgmKey`),
    INDEX `Student_sdgkuEmail_idx`(`sdgkuEmail`),
    INDEX `Student_studentIdNumber_idx`(`studentIdNumber`),
    INDEX `Student_status_idx`(`status`),
    UNIQUE INDEX `Student_firstName_lastName_startDate_key`(`firstName`, `lastName`, `startDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseCode` VARCHAR(191) NOT NULL,
    `courseName` VARCHAR(191) NOT NULL,
    `credits` INTEGER NOT NULL DEFAULT 3,
    `language` VARCHAR(191) NULL,
    `isTransferable` BOOLEAN NOT NULL DEFAULT true,
    `maxCapacity` INTEGER NULL,
    `programId` INTEGER NOT NULL,

    UNIQUE INDEX `Course_courseCode_key`(`courseCode`),
    INDEX `Course_programId_idx`(`programId`),
    INDEX `Course_courseCode_idx`(`courseCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prerequisite` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `prerequisiteCourseId` INTEGER NOT NULL,

    INDEX `Prerequisite_courseId_idx`(`courseId`),
    INDEX `Prerequisite_prerequisiteCourseId_idx`(`prerequisiteCourseId`),
    UNIQUE INDEX `Prerequisite_courseId_prerequisiteCourseId_key`(`courseId`, `prerequisiteCourseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionName` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `year` INTEGER NOT NULL,
    `programId` INTEGER NOT NULL,

    UNIQUE INDEX `Session_sessionName_key`(`sessionName`),
    INDEX `Session_programId_idx`(`programId`),
    INDEX `Session_year_idx`(`year`),
    UNIQUE INDEX `Session_programId_year_sessionName_key`(`programId`, `year`, `sessionName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseOffering` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `sessionId` INTEGER NOT NULL,
    `teacherId` INTEGER NULL,
    `maxStudents` INTEGER NULL,

    INDEX `CourseOffering_courseId_idx`(`courseId`),
    INDEX `CourseOffering_sessionId_idx`(`sessionId`),
    INDEX `CourseOffering_teacherId_idx`(`teacherId`),
    UNIQUE INDEX `CourseOffering_courseId_sessionId_key`(`courseId`, `sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Enrollment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` BIGINT NOT NULL,
    `offeringId` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'enrolled',
    `grade` VARCHAR(191) NULL,
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Enrollment_studentId_idx`(`studentId`),
    INDEX `Enrollment_offeringId_idx`(`offeringId`),
    INDEX `Enrollment_status_idx`(`status`),
    UNIQUE INDEX `Enrollment_studentId_offeringId_key`(`studentId`, `offeringId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transfer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` BIGINT NOT NULL,
    `courseId` INTEGER NOT NULL,
    `transferType` VARCHAR(191) NULL,
    `approvalDate` DATETIME(3) NULL,

    INDEX `Transfer_studentId_idx`(`studentId`),
    INDEX `Transfer_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AcademicRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` BIGINT NOT NULL,
    `courseId` INTEGER NOT NULL,
    `sessionId` INTEGER NULL,
    `status` VARCHAR(191) NULL,
    `grade` VARCHAR(191) NULL,
    `isPayment` BOOLEAN NOT NULL DEFAULT false,
    `paymentInfo` VARCHAR(191) NULL,

    INDEX `AcademicRecord_studentId_idx`(`studentId`),
    INDEX `AcademicRecord_courseId_idx`(`courseId`),
    INDEX `AcademicRecord_sessionId_idx`(`sessionId`),
    UNIQUE INDEX `AcademicRecord_studentId_courseId_sessionId_key`(`studentId`, `courseId`, `sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` BIGINT NOT NULL,
    `amount` VARCHAR(191) NOT NULL,
    `paymentDate` DATETIME(3) NULL,
    `method` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `courseCode` VARCHAR(191) NULL,

    INDEX `Payment_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Login` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Login_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

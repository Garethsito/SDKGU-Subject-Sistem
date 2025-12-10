-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Dec 09, 2025 at 03:25 PM
-- Server version: 10.6.20-MariaDB-cll-lve
-- PHP Version: 8.2.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `glevanco_sdgku`
--

-- --------------------------------------------------------

--
-- Table structure for table `AcademicRecord`
--

CREATE TABLE `AcademicRecord` (
  `id` int(11) NOT NULL,
  `studentId` bigint(20) NOT NULL,
  `courseId` int(11) NOT NULL,
  `sessionId` int(11) DEFAULT NULL,
  `status` varchar(191) DEFAULT NULL,
  `grade` varchar(191) DEFAULT NULL,
  `isPayment` tinyint(1) NOT NULL DEFAULT 0,
  `paymentInfo` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `activity_log`
--

CREATE TABLE `activity_log` (
  `id` bigint(20) NOT NULL,
  `occurred_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `user_id` int(11) DEFAULT NULL,
  `entity_type_id` int(11) NOT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `activity_type_id` int(11) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `old_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_data`)),
  `new_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_data`)),
  `is_important` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `activity_type`
--

CREATE TABLE `activity_type` (
  `id` int(11) NOT NULL,
  `code` varchar(191) NOT NULL,
  `label` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Course`
--

CREATE TABLE `Course` (
  `id` int(11) NOT NULL,
  `courseCode` varchar(191) NOT NULL,
  `courseName` varchar(191) NOT NULL,
  `credits` int(11) NOT NULL DEFAULT 3,
  `language` varchar(191) DEFAULT NULL,
  `isTransferable` tinyint(1) NOT NULL DEFAULT 1,
  `maxCapacity` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `CourseOffering`
--

CREATE TABLE `CourseOffering` (
  `id` int(11) NOT NULL,
  `courseId` int(11) NOT NULL,
  `groupNumber` int(11) NOT NULL DEFAULT 1,
  `sessionId` int(11) NOT NULL,
  `teacherId` int(11) DEFAULT NULL,
  `maxStudents` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Enrollment`
--

CREATE TABLE `Enrollment` (
  `id` int(11) NOT NULL,
  `studentId` bigint(20) NOT NULL,
  `offeringId` int(11) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'enrolled',
  `grade` varchar(191) DEFAULT NULL,
  `enrolledAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `entity_type`
--

CREATE TABLE `entity_type` (
  `id` int(11) NOT NULL,
  `code` varchar(191) NOT NULL,
  `label` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Login`
--

CREATE TABLE `Login` (
  `id` int(11) NOT NULL,
  `username` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `firstName` varchar(191) DEFAULT NULL,
  `lastName` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `role` varchar(191) NOT NULL DEFAULT 'Admin',
  `status` varchar(191) NOT NULL DEFAULT 'Active',
  `activeToken` text DEFAULT NULL,
  `tokenIssuedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Payment`
--

CREATE TABLE `Payment` (
  `id` int(11) NOT NULL,
  `studentId` bigint(20) NOT NULL,
  `amount` varchar(191) NOT NULL,
  `paymentDate` datetime(3) DEFAULT NULL,
  `method` varchar(191) DEFAULT NULL,
  `description` varchar(191) DEFAULT NULL,
  `courseCode` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Prerequisite`
--

CREATE TABLE `Prerequisite` (
  `id` int(11) NOT NULL,
  `courseId` int(11) NOT NULL,
  `prerequisiteCourseId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Program`
--

CREATE TABLE `Program` (
  `id` int(11) NOT NULL,
  `programName` varchar(191) NOT NULL,
  `programType` varchar(191) NOT NULL,
  `totalCourses` int(11) NOT NULL,
  `totalUnits` int(11) DEFAULT NULL,
  `description` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ProgramCourse`
--

CREATE TABLE `ProgramCourse` (
  `programId` int(11) NOT NULL,
  `courseId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Session`
--

CREATE TABLE `Session` (
  `id` int(11) NOT NULL,
  `sessionName` varchar(191) NOT NULL,
  `startDate` datetime(3) NOT NULL,
  `endDate` datetime(3) NOT NULL,
  `year` int(11) NOT NULL,
  `programId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Student`
--

CREATE TABLE `Student` (
  `id` bigint(20) NOT NULL,
  `studentIdNumber` varchar(191) NOT NULL,
  `firstName` varchar(191) NOT NULL,
  `middleName` varchar(191) DEFAULT NULL,
  `lastName` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `sdgkuEmail` varchar(191) DEFAULT NULL,
  `rgmKey` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `startDate` datetime(3) NOT NULL,
  `admissionDate` datetime(3) DEFAULT NULL,
  `enrollmentYear` int(11) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'active',
  `modality` varchar(191) DEFAULT NULL,
  `cohort` varchar(191) DEFAULT NULL,
  `language` varchar(191) DEFAULT NULL,
  `totalUnits` int(11) NOT NULL DEFAULT 126,
  `transferredUnits` int(11) NOT NULL DEFAULT 0,
  `unitQuantity` int(11) NOT NULL DEFAULT 0,
  `totalUnitsEarned` int(11) NOT NULL DEFAULT 0,
  `scheduledCompletionDate` datetime(3) DEFAULT NULL,
  `graduationDate` datetime(3) DEFAULT NULL,
  `programId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Teacher`
--

CREATE TABLE `Teacher` (
  `id` int(11) NOT NULL,
  `teacherIdNumber` varchar(191) NOT NULL,
  `firstName` varchar(191) NOT NULL,
  `middleName` varchar(191) DEFAULT NULL,
  `lastName` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'active',
  `hireDate` datetime(3) NOT NULL,
  `department` varchar(191) DEFAULT NULL,
  `specialization` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Transfer`
--

CREATE TABLE `Transfer` (
  `id` int(11) NOT NULL,
  `studentId` bigint(20) NOT NULL,
  `courseId` int(11) NOT NULL,
  `transferType` varchar(191) DEFAULT NULL,
  `approvalDate` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `AcademicRecord`
--
ALTER TABLE `AcademicRecord`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `AcademicRecord_studentId_courseId_sessionId_key` (`studentId`,`courseId`,`sessionId`),
  ADD KEY `AcademicRecord_studentId_idx` (`studentId`),
  ADD KEY `AcademicRecord_courseId_idx` (`courseId`),
  ADD KEY `AcademicRecord_sessionId_idx` (`sessionId`);

--
-- Indexes for table `activity_log`
--
ALTER TABLE `activity_log`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `activity_type`
--
ALTER TABLE `activity_type`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `activity_type_code_key` (`code`);

--
-- Indexes for table `Course`
--
ALTER TABLE `Course`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Course_courseCode_key` (`courseCode`),
  ADD KEY `Course_courseCode_idx` (`courseCode`);

--
-- Indexes for table `CourseOffering`
--
ALTER TABLE `CourseOffering`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `CourseOffering_courseId_sessionId_groupNumber_key` (`courseId`,`sessionId`,`groupNumber`),
  ADD KEY `CourseOffering_courseId_idx` (`courseId`),
  ADD KEY `CourseOffering_sessionId_idx` (`sessionId`),
  ADD KEY `CourseOffering_teacherId_idx` (`teacherId`);

--
-- Indexes for table `Enrollment`
--
ALTER TABLE `Enrollment`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Enrollment_studentId_offeringId_key` (`studentId`,`offeringId`),
  ADD KEY `Enrollment_studentId_idx` (`studentId`),
  ADD KEY `Enrollment_offeringId_idx` (`offeringId`),
  ADD KEY `Enrollment_status_idx` (`status`);

--
-- Indexes for table `entity_type`
--
ALTER TABLE `entity_type`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `entity_type_code_key` (`code`);

--
-- Indexes for table `Login`
--
ALTER TABLE `Login`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Login_username_key` (`username`),
  ADD UNIQUE KEY `Login_email_key` (`email`);

--
-- Indexes for table `Payment`
--
ALTER TABLE `Payment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Payment_studentId_idx` (`studentId`);

--
-- Indexes for table `Prerequisite`
--
ALTER TABLE `Prerequisite`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Prerequisite_courseId_prerequisiteCourseId_key` (`courseId`,`prerequisiteCourseId`),
  ADD KEY `Prerequisite_courseId_idx` (`courseId`),
  ADD KEY `Prerequisite_prerequisiteCourseId_idx` (`prerequisiteCourseId`);

--
-- Indexes for table `Program`
--
ALTER TABLE `Program`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Program_programName_key` (`programName`);

--
-- Indexes for table `ProgramCourse`
--
ALTER TABLE `ProgramCourse`
  ADD PRIMARY KEY (`programId`,`courseId`),
  ADD KEY `ProgramCourse_courseId_idx` (`courseId`),
  ADD KEY `ProgramCourse_programId_idx` (`programId`);

--
-- Indexes for table `Session`
--
ALTER TABLE `Session`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Session_sessionName_key` (`sessionName`),
  ADD UNIQUE KEY `Session_programId_year_sessionName_key` (`programId`,`year`,`sessionName`),
  ADD KEY `Session_programId_idx` (`programId`),
  ADD KEY `Session_year_idx` (`year`);

--
-- Indexes for table `Student`
--
ALTER TABLE `Student`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Student_studentIdNumber_key` (`studentIdNumber`),
  ADD UNIQUE KEY `Student_firstName_lastName_startDate_key` (`firstName`,`lastName`,`startDate`),
  ADD UNIQUE KEY `Student_email_key` (`email`),
  ADD UNIQUE KEY `Student_sdgkuEmail_key` (`sdgkuEmail`),
  ADD UNIQUE KEY `Student_rgmKey_key` (`rgmKey`),
  ADD KEY `Student_programId_idx` (`programId`),
  ADD KEY `Student_lastName_idx` (`lastName`),
  ADD KEY `Student_rgmKey_idx` (`rgmKey`),
  ADD KEY `Student_sdgkuEmail_idx` (`sdgkuEmail`),
  ADD KEY `Student_studentIdNumber_idx` (`studentIdNumber`),
  ADD KEY `Student_status_idx` (`status`);

--
-- Indexes for table `Teacher`
--
ALTER TABLE `Teacher`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Teacher_teacherIdNumber_key` (`teacherIdNumber`),
  ADD UNIQUE KEY `Teacher_email_key` (`email`),
  ADD KEY `Teacher_teacherIdNumber_idx` (`teacherIdNumber`),
  ADD KEY `Teacher_lastName_idx` (`lastName`),
  ADD KEY `Teacher_status_idx` (`status`);

--
-- Indexes for table `Transfer`
--
ALTER TABLE `Transfer`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Transfer_studentId_idx` (`studentId`),
  ADD KEY `Transfer_courseId_idx` (`courseId`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `AcademicRecord`
--
ALTER TABLE `AcademicRecord`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `activity_log`
--
ALTER TABLE `activity_log`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `activity_type`
--
ALTER TABLE `activity_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Course`
--
ALTER TABLE `Course`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `CourseOffering`
--
ALTER TABLE `CourseOffering`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Enrollment`
--
ALTER TABLE `Enrollment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `entity_type`
--
ALTER TABLE `entity_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Login`
--
ALTER TABLE `Login`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Payment`
--
ALTER TABLE `Payment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Prerequisite`
--
ALTER TABLE `Prerequisite`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Program`
--
ALTER TABLE `Program`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Session`
--
ALTER TABLE `Session`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Teacher`
--
ALTER TABLE `Teacher`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Transfer`
--
ALTER TABLE `Transfer`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

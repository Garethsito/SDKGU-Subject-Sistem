import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding activity types...');

    // 1. EntityTypes
    const entityTypes = [
        { code: 'STUDENT', label: 'Student' },
        { code: 'TEACHER', label: 'Teacher' },
        { code: 'SESSION', label: 'Session' },
        { code: 'COURSE', label: 'Course' },
        { code: 'COURSE_OFFERING', label: 'Course Offering' },
        { code: 'ENROLLMENT', label: 'Enrollment' },
        { code: 'ACADEMIC_RECORD', label: 'Academic Record' },
        { code: 'PROGRAM', label: 'Program' },
        { code: 'IMPORT', label: 'Import' },
        { code: 'REPORT', label: 'Report' },
        { code: 'USER', label: 'User' },
        { code: 'SYSTEM', label: 'System' }
    ];

    for (const entity of entityTypes) {
        await prisma.entityType.upsert({
            where: { code: entity.code },
            update: {},
            create: entity
        });
    }

    console.log('EntityTypes created');

    // 2. ActivityTypes
    const activityTypes = [
        { code: 'CREATE', label: 'Create' },
        { code: 'UPDATE', label: 'Update' },
        { code: 'DELETE', label: 'Delete' },
        { code: 'LOGIN', label: 'Login' },
        { code: 'LOGIN_FAILED', label: 'Login Failed' },
        { code: 'LOGOUT', label: 'Logout' },
        { code: 'START_SESSION', label: 'Start Session' },
        { code: 'END_SESSION', label: 'End Session' },
        { code: 'ASSIGN_TEACHER', label: 'Assign Teacher' },
        { code: 'ENROLL_STUDENT', label: 'Enroll Student' },
        { code: 'DROP_STUDENT', label: 'Drop Student' },
        { code: 'GRADE_UPDATE', label: 'Grade Update' },
        { code: 'IMPORT', label: 'Import Data' },
        { code: 'REQUEST_REPORT', label: 'Request Report' },
        { code: 'EXPORT', label: 'Export Data' }
    ];

    for (const activity of activityTypes) {
        await prisma.activityType.upsert({
            where: { code: activity.code },
            update: {},
            create: activity
        });
    }

    console.log('ActivityTypes created');
    console.log('Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('Error seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';

const prisma = new PrismaClient();
const FILE_PATH = './Courses.xlsx';

async function processCourse(row, programs) {
  try {
    const courseCode = row['Course Code']?.trim();
    const courseName = row['Course Name']?.trim();
    const programName = row['Program']?.trim();
    const programId = programs[programName]?.id;
    const credits = row['Credits'] ? parseInt(row['Credits']) : 3;
    const maxCapacity = row['Max Capacity'] ? parseInt(row['Max Capacity']) : 50;
    const language = row['Language']?.trim() || 'English';
    const isTransferable = row['Transferable']?.toString().toLowerCase() === 'true';

    if (!courseCode || !courseName || !programId) {
      console.error(`Datos incompletos para curso: ${courseCode}`);
      return null;
    }

    // Upsert: actualizar si existe, crear si no
    const course = await prisma.course.upsert({
      where: { courseCode },
      update: {
        courseName,
        credits,
        maxCapacity,
        language,
        isTransferable,
        programId
      },
      create: {
        courseCode,
        courseName,
        credits,
        maxCapacity,
        language,
        isTransferable,
        programId
      }
    });

    console.log(`Curso procesado: ${courseCode} - ${courseName}`);
    return course;
  } catch (err) {
    console.error(`Error procesando curso: ${err.message}`);
    return null;
  }
}

async function main() {
  try {
    const workbook = XLSX.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    // Obtener programas existentes
    const programsList = await prisma.program.findMany();
    const programs = {};
    programsList.forEach(p => programs[p.programName] = p);

    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      const course = await processCourse(row, programs);
      if (course) successCount++;
      else errorCount++;
    }

    console.log('\nImportación de cursos completada!');
    console.log(`Exitosos: ${successCount}`);
    console.log(`Errores: ${errorCount}`);

  } catch (err) {
    console.error('Error fatal:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

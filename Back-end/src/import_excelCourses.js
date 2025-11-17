import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';

const prisma = new PrismaClient();
const FILE_PATH = './Courses.xlsx';

async function processCourse(row, programs) {
  try {
    const courseCode = row['Course Code']?.trim();
    const courseName = row['Course Name']?.trim();
    const programName = row['Program']?.trim();
    const credits = row['Credits'] ? parseInt(row['Credits']) : 3;
    const maxCapacity = row['Max Capacity'] ? parseInt(row['Max Capacity']) : 50;
    const language = row['Language']?.trim() || 'English';
    const isTransferable = row['Transferable']?.toString().toLowerCase() === 'true';

    if (!courseCode || !courseName) {
      console.error(`Datos incompletos para curso: ${courseCode}`);
      return null;
    }

    // Determinar programId: si es General Education, usar BSGM por defecto
    let programId;
    if (programName === 'General Education') {
      programId = programs['BSGM']?.id;
    } else {
      programId = programs[programName]?.id;
    }

    if (!programId) {
      console.error(`Programa no encontrado para: ${programName} (curso ${courseCode})`);
      return null;
    }

    // Crear o actualizar el curso SIN programId
    const course = await prisma.course.upsert({
      where: { courseCode },
      update: {
        courseName,
        credits,
        maxCapacity,
        language,
        isTransferable
      },
      create: {
        courseCode,
        courseName,
        credits,
        maxCapacity,
        language,
        isTransferable
      }
    });

    // Si es General Education, vincular a AMBOS programas
    if (programName === 'General Education') {
      const bsgm = programs['BSGM'];
      const assd = programs['ASSD'];

      // Vincular a BSGM
      await prisma.programCourse.upsert({
        where: {
          programId_courseId: {
            programId: bsgm.id,
            courseId: course.id
          }
        },
        create: {
          programId: bsgm.id,
          courseId: course.id
        },
        update: {}
      });

      // Vincular a ASSD
      await prisma.programCourse.upsert({
        where: {
          programId_courseId: {
            programId: assd.id,
            courseId: course.id
          }
        },
        create: {
          programId: assd.id,
          courseId: course.id
        },
        update: {}
      });

      console.log(`Curso Gen Ed procesado: ${courseCode} -> BSGM & ASSD`);
    } else {
      // Vincular solo al programa especificado
      await prisma.programCourse.upsert({
        where: {
          programId_courseId: {
            programId: programId,
            courseId: course.id
          }
        },
        create: {
          programId: programId,
          courseId: course.id
        },
        update: {}
      });

      console.log(`Curso procesado: ${courseCode} -> ${programName}`);
    }

    return course;
  } catch (err) {
    console.error(`Error procesando curso ${row['Course Code']}: ${err.message}`);
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

    console.log('Programas encontrados:', Object.keys(programs));
    console.log(`Total de cursos a procesar: ${rows.length}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      const course = await processCourse(row, programs);
      if (course) successCount++;
      else errorCount++;
    }

    console.log('\n=================================');
    console.log('Importacion de cursos completada!');
    console.log(`Exitosos: ${successCount}`);
    console.log(`Errores: ${errorCount}`);
    console.log('=================================\n');

    // Mostrar resumen de ProgramCourse
    const bsgmCount = await prisma.programCourse.count({ where: { programId: programs['BSGM'].id } });
    const assdCount = await prisma.programCourse.count({ where: { programId: programs['ASSD'].id } });
    
    console.log('Resumen de cursos por programa:');
    console.log(`BSGM: ${bsgmCount} cursos`);
    console.log(`ASSD: ${assdCount} cursos`);

  } catch (err) {
    console.error('Error fatal:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
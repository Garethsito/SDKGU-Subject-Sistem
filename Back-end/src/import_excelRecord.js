import XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FILE_PATH = "./Record_NEW.xlsx";

async function main() {
  console.log("🚀 Iniciando importación desde Excel transformado...\n");

  const workbook = XLSX.readFile(FILE_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  let inserted = 0;
  let duplicates = 0;
  let errors = 0;
  let studentsNotFound = new Set();
  let coursesNotFound = new Set();
  let studentsUpdated = 0; // --- LÍNEA NUEVA ---

  for (const row of rows) {
    const studentIdNumber = row["Students ID Number"]?.toString().trim();
    const courseCode = row["Course"]?.toString().trim().toUpperCase();
    const grade = row["Grade"]?.toString().trim();
    const status = row["Status"]?.toString().trim().toLowerCase();

    // --- LÍNEA NUEVA ---
    // Leemos el ID del programa desde el Excel
    const programIdFromExcel = row["Program"] ? parseInt(row["Program"], 10) : null;

    if (!studentIdNumber || !courseCode) continue;

    // Buscar estudiante
    const student = await prisma.student.findUnique({
      where: { studentIdNumber },
    });

    if (!student) {
      studentsNotFound.add(studentIdNumber);
      continue;
    }

    // --- BLOQUE NUEVO ---
    // Una vez que encontramos al estudiante, verificamos y actualizamos su programa si es necesario.
    // Usamos programIdFromExcel (asumiendo que 1 = BSGM, 2 = ASSD, etc.)
    if (programIdFromExcel && [1, 2].includes(programIdFromExcel)) { // Asegúrate de que 1 y 2 sean los IDs correctos
      if (student.programId !== programIdFromExcel) {
        try {
          await prisma.student.update({
            where: { id: student.id },
            data: { programId: programIdFromExcel },
          });
          console.log(`  🔄 Programa actualizado para ${studentIdNumber} a ID: ${programIdFromExcel}`);
          studentsUpdated++;
        } catch (updateError) {
          console.error(`  ❌ Error actualizando programa para ${studentIdNumber}: ${updateError.message}`);
        }
      }
    }
    // --- FIN BLOQUE NUEVO ---

    // Buscar curso
    const course = await prisma.course.findUnique({
      where: { courseCode },
    });

    if (!course) {
      coursesNotFound.add(courseCode);
      continue;
    }

    // Ver si ya existe
    const existing = await prisma.academicRecord.findFirst({
      where: {
        studentId: student.id,
        courseId: course.id,
      },
    });

    if (existing) {
      duplicates++;
      continue;
    }

    // Registrar transfer si aplica
    if (status === "transferred") {
      const existingTransfer = await prisma.transfer.findFirst({
        where: {
          studentId: student.id,
          courseId: course.id,
        },
      });

      if (!existingTransfer) {
        await prisma.transfer.create({
          data: {
            studentId: student.id,
            courseId: course.id,
            transferType: "external",
            approvalDate: new Date()
          }
        });

        console.log(`  🔄 Transfer registrado para ${studentIdNumber} - ${courseCode}`);
      }
    }

    // Insertar registro
    try {
      await prisma.academicRecord.create({
        data: {
          studentId: student.id,
          courseId: course.id,
          grade: grade || null,
          status, // viene tal cual del Excel
        },
      });

      inserted++;
    } catch (err) {
      console.error("❌ Error insertando registro:", err.message);
      errors++;
    }
  }

  console.log("\n🎉 IMPORTACIÓN COMPLETADA");
  console.log("-------------------------------");
  console.log(`   ✅ Registros insertados: ${inserted}`);
  console.log(`   🔄 Estudiantes actualizados (programa): ${studentsUpdated}`); // --- LÍNEA NUEVA ---
  console.log(`   🔁 Duplicados (registros): ${duplicates}`);
  console.log(`   ❌ Errores (registros): ${errors}`);
  console.log(`   🚫 Estudiantes no encontrados: ${studentsNotFound.size}`);
  console.log(`   📚 Cursos no encontrados: ${coursesNotFound.size}`);
  console.log("-------------------------------");

  if (studentsNotFound.size > 0) {
    console.log("\n⚠️ Estudiantes no encontrados:");
    studentsNotFound.forEach(s => console.log(`  - ${s}`));
  }

  if (coursesNotFound.size > 0) {
    console.log("\n⚠️ Cursos no encontrados:");
    coursesNotFound.forEach(c => console.log(`  - ${c}`));
  }

  await prisma.$disconnect();
}

main();
import XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Cargar variables de entorno desde .env
dotenv.config();

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
  let studentsUpdated = 0;
  let transfersFixed = 0; // ✅ NUEVO

  for (const row of rows) {
    const studentIdNumber = row["Students ID Number"]?.toString().trim();
    const courseCode = row["Course"]?.toString().trim().toUpperCase();
    let grade = row["Grade"]?.toString().trim(); // ✅ Cambié const por let
    let status = row["Status"]?.toString().trim().toLowerCase(); // ✅ Cambié const por let

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

    // Actualizar programa si es necesario
    if (programIdFromExcel && [1, 2].includes(programIdFromExcel)) {
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

    // Buscar curso
    const course = await prisma.course.findUnique({
      where: { courseCode },
    });

    if (!course) {
      coursesNotFound.add(courseCode);
      continue;
    }

    // ✅ NUEVO: Si es transferred, asignar grade = "T"
    if (status === "transferred") {
      grade = "T";
    }

    // ✅ NUEVO: Normalizar status "completed" a "passed"
    if (status === "completed") {
      status = "passed";
    }

    // Ver si ya existe
    const existing = await prisma.academicRecord.findFirst({
      where: {
        studentId: student.id,
        courseId: course.id,
      },
    });

    if (existing) {
      // ✅ NUEVO: Si ya existe y es transferred pero no tiene grade "T", actualizarlo
      if (status === "transferred" && (!existing.grade || existing.grade === '')) {
        try {
          await prisma.academicRecord.update({
            where: { id: existing.id },
            data: { grade: "T", status: "transferred" }
          });
          console.log(`  🔧 Transfer actualizado: ${studentIdNumber} - ${courseCode} (grade -> T)`);
          transfersFixed++;
        } catch (err) {
          console.error(`  ❌ Error actualizando transfer: ${err.message}`);
        }
      }
      
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
        try {
          await prisma.transfer.create({
            data: {
              studentId: student.id,
              courseId: course.id,
              transferType: "external",
              approvalDate: new Date()
            }
          });
          console.log(`  🔄 Transfer registrado para ${studentIdNumber} - ${courseCode}`);
        } catch (err) {
          console.error(`  ❌ Error registrando transfer: ${err.message}`);
        }
      }
    }

    // Insertar registro
    try {
      await prisma.academicRecord.create({
        data: {
          studentId: student.id,
          courseId: course.id,
          grade: grade || null,
          status,
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
  console.log(`   🔄 Estudiantes actualizados (programa): ${studentsUpdated}`);
  console.log(`   🔧 Transfers actualizados (grade -> T): ${transfersFixed}`); // ✅ NUEVO
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
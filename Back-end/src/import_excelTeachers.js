import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';

const prisma = new PrismaClient();
const FILE_PATH = './Teachers.xlsx';

async function processTeacher(row) {
  try {
    const firstName = row['First Name']?.trim() || 'Unknown';
    const middleName = row['Middle Name']?.trim() || null;
    const lastName = row['Last Name']?.trim() || 'Unknown';
    const email = row['Email']?.trim() || null;
    const status = row['Status']?.trim() || 'Active';
    const title = row['Title']?.trim() || null;

    // Usamos email como ID único si existe, si no un string con nombre
    const teacherIdNumber = email || `${firstName}.${lastName}`.toLowerCase();

    // Upsert: actualizar si existe, crear si no
    const teacher = await prisma.teacher.upsert({
      where: { teacherIdNumber },
      update: { firstName, middleName, lastName, email, status, specialization: title, hireDate: new Date() },
      create: { teacherIdNumber, firstName, middleName, lastName, email, status, specialization: title, hireDate: new Date() }
    });

    console.log(`Profesor procesado: ${firstName} ${lastName}`);
    return teacher;
  } catch (err) {
    console.error(`Error procesando profesor: ${err.message}`);
    return null;
  }
}

async function main() {
  try {
    const workbook = XLSX.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      const teacher = await processTeacher(row);
      if (teacher) successCount++;
      else errorCount++;
    }

    console.log('\nImportación de profesores completada!');
    console.log(`Exitosos: ${successCount}`);
    console.log(`Errores: ${errorCount}`);

  } catch (err) {
    console.error('Error fatal:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

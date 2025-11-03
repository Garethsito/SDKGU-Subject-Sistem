import { PrismaClient } from '../generated/prisma/index.js';
import XLSX from 'xlsx';

const prisma = new PrismaClient();
const FILE_PATH = './BSGM_ASSD.xlsx';

// Parsear fecha de Excel
function parseExcelDate(value) {
  if (!value) return null;
  
  if (typeof value === 'number') {
    return new Date((value - 25569) * 86400 * 1000);
  } else if (typeof value === 'string' && value.trim() !== '') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

// Función para parsear el nombre completo
function parseFullName(fullName) {
  if (!fullName) return { firstName: 'Unknown', middleName: null, lastName: 'Unknown' };
  
  const parts = fullName.trim().split(' ').filter(p => p);
  
  if (parts.length === 0) {
    return { firstName: 'Unknown', middleName: null, lastName: 'Unknown' };
  } else if (parts.length === 1) {
    return { firstName: parts[0], middleName: null, lastName: 'Unknown' };
  } else if (parts.length === 2) {
    return { firstName: parts[0], middleName: null, lastName: parts[1] };
  } else {
    // Más de 2 partes: primer nombre, nombre(s) del medio, apellido(s)
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    const middleName = parts.slice(1, -1).join(' ');
    return { firstName, middleName, lastName };
  }
}

// Procesar estudiante
async function processStudent(row, program) {
  try {
    // Parsear nombre completo
    const fullName = row['Full Name'] || '';
    const { firstName, middleName, lastName } = parseFullName(fullName);
    
    // Extraer datos
    const studentIdNumber = row['Students ID Number'] ? String(row['Students ID Number']).trim() : null;
    const rgmKey = row['RGM#'] ? String(row['RGM#']).trim() : null;
    const email = row['Email'] ? String(row['Email']).trim() : null;
    const sdgkuEmail = row['SDGKU EMAIL'] ? String(row['SDGKU EMAIL']).trim() : null;
    const status = row['Status'] ? String(row['Status']).trim() : 'Active';
    const programName = row['Program'] ? String(row['Program']).trim() : 'BSGM';
    const modality = row['Modality'] ? String(row['Modality']).trim() : null;
    const cohort = row['Cohort'] ? String(row['Cohort']).trim() : null;
    const language = row['Language'] ? String(row['Language']).trim() : null;
    
    // Unidades
    const totalUnits = row['Total Units'] ? parseInt(row['Total Units']) : 0;
    const transferredUnits = row['Transfered Units'] ? parseInt(row['Transfered Units']) : 0;
    const unitQuantity = row['Unit Quantity'] ? parseInt(row['Unit Quantity']) : 0;
    const totalUnitsEarned = row['Total Units Earned'] ? parseInt(row['Total Units Earned']) : 0;
    
    // Fechas
    const startDate = parseExcelDate(row['Start Date']) || new Date();
    const scheduledCompletionDate = parseExcelDate(row['Scheduled Completion Date']);
    const graduationDate = parseExcelDate(row['Graduation Date']);
    
    const enrollmentYear = startDate.getFullYear();
    
    // Buscar si el estudiante ya existe por RGM Key o email
    let student = null;
    
    if (rgmKey) {
      student = await prisma.student.findUnique({
        where: { rgmKey }
      });
    }
    
    if (!student && sdgkuEmail) {
      student = await prisma.student.findUnique({
        where: { sdgkuEmail }
      });
    }
    
    if (!student && email) {
      student = await prisma.student.findUnique({
        where: { email }
      });
    }
    
    // Si no existe, buscar por nombre completo y fecha
    if (!student) {
      student = await prisma.student.findFirst({
        where: {
          firstName,
          lastName,
          startDate
        }
      });
    }
    
    const studentData = {
      firstName,
      lastName,
      email,
      sdgkuEmail,
      rgmKey,
      startDate,
      enrollmentYear,
      status: status.toLowerCase(),
      modality,
      cohort,
      language,
      transferredUnits,
      unitQuantity,
      totalUnitsEarned,
      scheduledCompletionDate,
      graduationDate,
      programId: program.id
    };
    
    if (student) {
      // Actualizar estudiante existente
      student = await prisma.student.update({
        where: { id: student.id },
        data: studentData
      });
      console.log(`   ✏️  Actualizado: ${firstName} ${lastName}`);
    } else {
      // Crear nuevo estudiante
      student = await prisma.student.create({
        data: studentData
      });
      console.log(`   ✅ Creado: ${firstName} ${lastName}`);
    }
    
    return student;
  } catch (err) {
    console.error(`   ❌ Error procesando ${row['Full Name']}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Iniciando importación de estudiantes...\n');
  
  try {
    // Leer el archivo Excel
    const workbook = XLSX.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames[0]; // Primera hoja
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`📄 Hoja: ${sheetName}`);
    console.log(`📊 Total de filas: ${rows.length}\n`);
    
    // Buscar o crear programa BSGM
    let program = await prisma.program.findUnique({
      where: { programName: 'BSGM' }
    });
    
    if (!program) {
      program = await prisma.program.create({
        data: {
          programName: 'BSGM',
          programType: 'Bachelor',
          totalCourses: 40,
          totalUnits: 126 // Según los datos del Excel
        }
      });
      console.log('✅ Programa BSGM creado\n');
    }
    
    // Procesar cada fila
    let successCount = 0;
    let errorCount = 0;
    
    for (const row of rows) {
      const student = await processStudent(row, program);
      if (student) {
        successCount++;
      } else {
        errorCount++;
      }
    }
    
    console.log('\n🎉 Importación completada!');
    console.log(`\n📊 Resultados:`);
    console.log(`   ✅ Exitosos: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📝 Total procesados: ${rows.length}`);
    
    // Estadísticas finales
    const totalStudents = await prisma.student.count();
    console.log(`\n👥 Total de estudiantes en la base de datos: ${totalStudents}`);
    
  } catch (err) {
    console.error('❌ Error fatal:', err);
    throw err;
  }
}

main()
  .catch((err) => {
    console.error('❌ Error en main:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
import { PrismaClient } from '@prisma/client';
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

// Función para convertir Students ID Number a BigInt
function parseStudentId(value) {
  if (!value) return null;
  
  // Remover cualquier caracter no numérico
  const cleaned = String(value).replace(/[^\d]/g, '');
  
  if (!cleaned || cleaned === '') return null;
  
  try {
    return BigInt(cleaned);
  } catch (err) {
    console.error(`Error parseando ID: ${value}`);
    return null;
  }
}

// Procesar estudiante
async function processStudent(row, programs) {
  try {
    // ✅ Extraer nombres directamente de las columnas del Excel
    const firstName = row['First Name'] ? String(row['First Name']).trim() : 'Unknown';
    const middleName = row['Middle Name'] ? String(row['Middle Name']).trim() : null;
    const lastName = row['Last Name'] ? String(row['Last Name']).trim() : null;
    const fullName = `${firstName} ${middleName || ''} ${lastName || ''}`.trim();
    
    // Extraer ID del estudiante
    const studentIdNumber = row['Students ID Number'] ? String(row['Students ID Number']).trim() : null;
    const studentId = parseStudentId(studentIdNumber);
    
    if (!studentId) {
      console.error(`   ❌ ID inválido para ${fullName}: ${studentIdNumber}`);
      return null;
    }
    
    // ✅ Extraer datos (incluyendo phone)
    const rgmKey = row['RGM#'] ? String(row['RGM#']).trim() : null;
    const phone = row['Phone #'] ? String(row['Phone #']).trim() : null;
    const email = row['Email'] ? String(row['Email']).trim() : null;
    const sdgkuEmail = row['SDGKU EMAIL'] ? String(row['SDGKU EMAIL']).trim() : null;
    const status = row['Status'] ? String(row['Status']).trim() : 'Active';
    const programName = row['Program'] ? String(row['Program']).trim() : 'BSGM';
    const modality = row['Modality'] ? String(row['Modality']).trim() : null;
    const cohort = row['Cohort'] ? String(row['Cohort']).trim() : null;
    const language = row['Language'] ? String(row['Language']).trim() : null;
    
    // Obtener el programa correcto
    const program = programs[programName];
    if (!program) {
      console.error(`   ❌ Programa no encontrado: ${programName} para ${fullName}`);
      return null;
    }
    
    // Unidades
    const totalUnits = row['Total Units'] ? parseInt(row['Total Units']) : 126;
    const transferredUnits = row['Transfered Units'] ? parseInt(row['Transfered Units']) : 0;
    const unitQuantity = row['Unit Quantity'] ? parseInt(row['Unit Quantity']) : 0;
    const totalUnitsEarned = row['Total Units Earned'] ? parseInt(row['Total Units Earned']) : 0;
    
    // Fechas
    const startDate = parseExcelDate(row['Start Date']) || new Date();
    const scheduledCompletionDate = parseExcelDate(row['Scheduled Completion Date']);
    const graduationDate = parseExcelDate(row['Graduation Date']);
    
    const enrollmentYear = startDate.getFullYear();
    
    // Verificar si el estudiante ya existe
    let student = await prisma.student.findUnique({
      where: { id: studentId }
    }).catch(() => null);
    
    // ✅ Objeto studentData con todos los campos actualizados
    const studentData = {
      id: studentId,
      studentIdNumber,
      firstName,
      middleName,
      lastName,
      phone,
      email,
      sdgkuEmail,
      rgmKey,
      startDate,
      enrollmentYear,
      status: status.toLowerCase(),
      modality,
      cohort,
      language,
      totalUnits,
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
        where: { id: studentId },
        data: studentData
      });
      console.log(`   ✏️  Actualizado: ${firstName} ${middleName || ''} ${lastName || ''} (${programName}) - ID: ${studentId}`);
    } else {
      // Crear nuevo estudiante
      student = await prisma.student.create({
        data: studentData
      });
      console.log(`   ✅ Creado: ${firstName} ${middleName || ''} ${lastName || ''} (${programName}) - ID: ${studentId}`);
    }
    
    return student;
  } catch (err) {
    console.error(`   ❌ Error procesando ${row['Full Name']}: ${err.message}`);
    console.error(`      Stack: ${err.stack}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Iniciando importación de estudiantes...\n');
  
  try {
    // Leer el archivo Excel
    console.log('📁 Intentando leer archivo:', FILE_PATH);
    const workbook = XLSX.readFile(FILE_PATH);
    console.log('✅ Archivo leído correctamente');
    
    const sheetName = workbook.SheetNames[0];
    console.log('📄 Nombre de la hoja:', sheetName);
    
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`📊 Total de filas: ${rows.length}`);
    
    // Mostrar las columnas del Excel
    if (rows.length > 0) {
      console.log('📋 Columnas encontradas:', Object.keys(rows[0]));
    }
    console.log('');
    
    // Crear o buscar ambos programas
    const programs = {};
    
    // Programa BSGM
    let bsgmProgram = await prisma.program.findUnique({
      where: { programName: 'BSGM' }
    });
    
    if (!bsgmProgram) {
      bsgmProgram = await prisma.program.create({
        data: {
          programName: 'BSGM',
          programType: 'Bachelor',
          totalCourses: 40,
          totalUnits: 126
        }
      });
      console.log('✅ Programa BSGM creado');
    } else {
      console.log('✅ Programa BSGM encontrado');
    }
    programs['BSGM'] = bsgmProgram;
    
    // Programa ASSD
    let assdProgram = await prisma.program.findUnique({
      where: { programName: 'ASSD' }
    });
    
    if (!assdProgram) {
      assdProgram = await prisma.program.create({
        data: {
          programName: 'ASSD',
          programType: 'Associate',
          totalCourses: 20,
          totalUnits: 60
        }
      });
      console.log('✅ Programa ASSD creado');
    } else {
      console.log('✅ Programa ASSD encontrado');
    }
    programs['ASSD'] = assdProgram;
    
    console.log('');
    
    // Procesar cada fila
    let successCount = 0;
    let errorCount = 0;
    const programStats = { BSGM: 0, ASSD: 0 };
    
    for (const row of rows) {
      const student = await processStudent(row, programs);
      if (student) {
        successCount++;
        const programName = row['Program'] ? String(row['Program']).trim() : 'BSGM';
        programStats[programName] = (programStats[programName] || 0) + 1;
      } else {
        errorCount++;
      }
    }
    
    console.log('\n🎉 Importación completada!');
    console.log(`\n📊 Resultados:`);
    console.log(`   ✅ Exitosos: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📝 Total procesados: ${rows.length}`);
    console.log(`\n📚 Por programa:`);
    console.log(`   🎓 BSGM: ${programStats.BSGM || 0} estudiantes`);
    console.log(`   🎓 ASSD: ${programStats.ASSD || 0} estudiantes`);
    
    const totalStudents = await prisma.student.count();
    console.log(`\n👥 Total de estudiantes en la base de datos: ${totalStudents}`);
    
  } catch (err) {
    console.error('❌ Error fatal:', err);
    console.error('Stack trace:', err.stack);
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
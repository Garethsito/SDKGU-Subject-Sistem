import { PrismaClient } from '../generated/prisma/index.js';
import XLSX from 'xlsx';

const prisma = new PrismaClient();
const FILE_PATH = './excel.xlsx';

// Columnas que no son cursos
const EXCLUDED_COLUMNS = [
  'Student Name',
  'START DATE',
  'Program',
  'Admission date',
  'RGM KEY'
];

// Parsear fecha de Excel
function parseExcelDate(value) {
  if (typeof value === 'number') {
    return new Date((value - 25569) * 86400 * 1000);
  } else if (typeof value === 'string' && value.trim() !== '') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  return new Date();
}

// Extraer información de sesión del valor de celda
function extractSessionInfo(value) {
  const str = String(value).trim();
  
  // Detectar si es un pago (contiene $)
  if (str.includes('$') || str.toLowerCase().includes('bank') || 
      str.toLowerCase().includes('paypal') || str.toLowerCase().includes('pp')) {
    return {
      isPayment: true,
      paymentInfo: str,
      grade: null,
      sessionName: null
    };
  }
  
  // Detectar sesión (S1 2025, S7 2025, etc.)
  const sessionMatch = str.match(/S\s*(\d+)\s*(\d{4})/i);
  if (sessionMatch) {
    return {
      isPayment: false,
      paymentInfo: null,
      grade: str,
      sessionName: `S${sessionMatch[1]} ${sessionMatch[2]}`
    };
  }
  
  // Es una calificación normal
  return {
    isPayment: false,
    paymentInfo: null,
    grade: str,
    sessionName: null
  };
}

// Encontrar o crear estudiante
async function findOrCreateStudent(row, programId, sheetName) {
  const fullName = (row['Student Name'] || '').trim();
  if (!fullName) return null;
  
  const [firstName, ...rest] = fullName.split(' ');
  const lastName = rest.join(' ') || 'Unknown';
  
  // Buscar fecha de inicio
  let startDate;
  if (row['START DATE']) {
    startDate = parseExcelDate(row['START DATE']);
  } else if (row['Admission date']) {
    startDate = parseExcelDate(row['Admission date']);
  } else {
    startDate = new Date();
  }
  
  const rgmKey = row['RGM KEY'] ? String(row['RGM KEY']).trim() : null;
  const programName = row['Program'] ? String(row['Program']).trim() : 'Default Program';
  
  // Buscar si el estudiante ya existe (por nombre y fecha)
  let student = await prisma.student.findFirst({
    where: {
      firstName,
      lastName,
      startDate
    }
  });
  
  if (!student) {
    // Crear nuevo estudiante
    student = await prisma.student.create({
      data: {
        firstName,
        lastName,
        rgmKey,
        startDate,
        admissionDate: row['Admission date'] ? parseExcelDate(row['Admission date']) : null,
        enrollmentYear: startDate.getFullYear(),
        programId,
        status: 'active'
      }
    });
    console.log(`✅ Nuevo estudiante: ${firstName} ${lastName} (${sheetName})`);
  } else {
    // Actualizar RGM KEY si no lo tenía
    if (rgmKey && !student.rgmKey) {
      await prisma.student.update({
        where: { id: student.id },
        data: { rgmKey }
      });
    }
  }
  
  return student;
}

// Encontrar o crear curso
async function findOrCreateCourse(courseCode, programId) {
  let course = await prisma.course.findUnique({
    where: { courseCode }
  });
  
  if (!course) {
    course = await prisma.course.create({
      data: {
        courseCode,
        courseName: courseCode,
        programId
      }
    });
  }
  
  return course;
}

// Encontrar o crear sesión
async function findOrCreateSession(sessionName, programId) {
  if (!sessionName) {
    sessionName = 'Default Session';
  }
  
  let session = await prisma.session.findUnique({
    where: { sessionName }
  });
  
  if (!session) {
    session = await prisma.session.create({
      data: {
        sessionName,
        startDate: new Date(),
        endDate: new Date(),
        programId
      }
    });
  }
  
  return session;
}

// Procesar una pestaña
async function processSheet(sheetName, sheet, program) {
  console.log(`\n📄 Procesando pestaña: ${sheetName}`);
  
  const rows = XLSX.utils.sheet_to_json(sheet);
  console.log(`   ${rows.length} filas encontradas`);
  
  for (const row of rows) {
    try {
      // Crear o encontrar estudiante
      const student = await findOrCreateStudent(row, program.id, sheetName);
      if (!student) continue;
      
      // Procesar cada columna (curso)
      for (const [key, value] of Object.entries(row)) {
        if (EXCLUDED_COLUMNS.includes(key) || !value) continue;
        
        const courseCode = key.trim();
        if (!courseCode) continue;
        
        // Encontrar o crear curso
        const course = await findOrCreateCourse(courseCode, program.id);
        
        // Extraer información de la celda
        const info = extractSessionInfo(value);
        
        if (info.isPayment) {
          // Registrar pago
          await prisma.payment.create({
            data: {
              studentId: student.id,
              amount: info.paymentInfo,
              courseCode,
              description: `${courseCode} - ${sheetName}`
            }
          }).catch(() => {}); // Ignorar duplicados
        } else {
          // Registrar calificación/estado académico
          const session = await findOrCreateSession(
            info.sessionName || `${sheetName} Session`,
            program.id
          );
          
          // Verificar si ya existe el registro
          const existing = await prisma.academicRecord.findUnique({
            where: {
              studentId_courseId_sessionId: {
                studentId: student.id,
                courseId: course.id,
                sessionId: session.id
              }
            }
          });
          
          if (!existing) {
            await prisma.academicRecord.create({
              data: {
                studentId: student.id,
                courseId: course.id,
                sessionId: session.id,
                grade: info.grade,
                status: info.grade?.includes('LOA') ? 'loa' : 
                       info.grade?.includes('F') ? 'failed' :
                       info.grade?.includes('R') ? 'repeat' : 'completed'
              }
            });
          }
        }
      }
    } catch (err) {
      console.error(`   ❌ Error con ${row['Student Name']}: ${err.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Iniciando importación de todas las pestañas...\n');
  
  // Leer el archivo Excel
  const workbook = XLSX.readFile(FILE_PATH);
  
  // Crear programa por defecto
  let program = await prisma.program.findUnique({
    where: { programName: 'BSGM' }
  });
  
  if (!program) {
    program = await prisma.program.create({
      data: {
        programName: 'BSGM',
        programType: 'Bachelor',
        totalCourses: 40
      }
    });
    console.log('✅ Programa BSGM creado\n');
  }
  
  // Procesar cada pestaña
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    await processSheet(sheetName, sheet, program);
  }
  
  console.log('\n🎉 Importación completa de todas las pestañas!');
  
  // Mostrar estadísticas
  const studentCount = await prisma.student.count();
  const courseCount = await prisma.course.count();
  const recordCount = await prisma.academicRecord.count();
  const paymentCount = await prisma.payment.count();
  
  console.log(`\n📊 Estadísticas:`);
  console.log(`   Estudiantes: ${studentCount}`);
  console.log(`   Cursos: ${courseCount}`);
  console.log(`   Registros académicos: ${recordCount}`);
  console.log(`   Pagos: ${paymentCount}`);
}

main()
  .catch((err) => console.error('❌ Error fatal:', err))
  .finally(async () => {
    await prisma.$disconnect();
  });
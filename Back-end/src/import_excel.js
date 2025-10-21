import { PrismaClient } from '../generated/prisma/index.js';

import XLSX from 'xlsx';

const prisma = new PrismaClient()

// === Configura tu archivo Excel ===
const FILE_PATH = './excel.xlsx' // Ruta al archivo Excel

async function main() {
  // Leer el Excel
  const workbook = XLSX.readFile(FILE_PATH)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet)

  console.log(`📊 Leyendo ${rows.length} filas desde el Excel...`)

  for (const row of rows) {
    try {
      const fullName = (row['Student Name'] || '').trim()
      const [firstName, ...rest] = fullName.split(' ')
      const lastName = rest.join(' ')
    let startDate
    const excelDate = row['START DATE']

    if (typeof excelDate === 'number') {
    // Excel date number to JS Date
    startDate = new Date((excelDate - 25569) * 86400 * 1000)
    } else if (typeof excelDate === 'string' && excelDate.trim() !== '') {
    // Try parsing normal date string
    startDate = new Date(excelDate)
    } else {
    startDate = new Date() // fallback if empty
    }

      const programName = (row['Program'] || '').trim()

      // Verificar si el programa ya existe
      let program = await prisma.program.findUnique({
        where: { programName },
      })

      if (!program) {
        program = await prisma.program.create({
          data: {
            programName,
            programType: 'default',
            totalCourses: Object.keys(row).length - 3, // columnas de cursos
          },
        })
        console.log(`🆕 Programa creado: ${program.programName}`)
      }

      // Crear estudiante
      const student = await prisma.student.create({
        data: {
          firstName,
          lastName,
          startDate,
          enrollmentYear: startDate.getFullYear(),
          programId: program.id,
          status: 'active',
        },
      })

      console.log(`✅ Estudiante agregado: ${firstName} ${lastName}`)

      // Insertar registros académicos
      for (const [key, value] of Object.entries(row)) {
        if (['Student Name', 'START DATE', 'Program'].includes(key)) continue
        if (!value) continue

        // Buscar o crear el curso
        let course = await prisma.course.findUnique({
          where: { courseCode: key },
        })

        if (!course) {
          course = await prisma.course.create({
            data: {
              courseCode: key,
              courseName: key,
              programId: program.id,
            },
          })
        }

        // Crear o buscar una sesión genérica
        const sessionName = 'Default Session'
        let session = await prisma.session.findUnique({
          where: { sessionName },
        })

        if (!session) {
          session = await prisma.session.create({
            data: {
              sessionName,
              startDate: new Date(),
              endDate: new Date(),
              programId: program.id,
            },
          })
        }

        // Crear registro académico
        await prisma.academicRecord.create({
          data: {
            studentId: student.id,
            courseId: course.id,
            sessionId: session.id,
            status: 'completed',
            grade: String(value).trim(),
          },
        })
      }
    } catch (err) {
      console.error(`❌ Error con la fila ${row['Student Name']}:`, err.message)
    }
  }

  console.log('🎉 Importación completa.')
}

main()
  .catch((err) => console.error(err))
  .finally(async () => {
    await prisma.$disconnect()
  })

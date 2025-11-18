import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PREREQUISITES = {
  // Bachelor of Science in Global Management (BSGM)
  BSGM: [
    // Matemáticas
    { course: 'MATH 202', prerequisite: 'MATH 201' },
    { course: 'MATH 203', prerequisite: 'MATH 202' },
    
    // Inglés
    { course: 'ENGL 202', prerequisite: 'ENGL 201' },
    
    // Global Business (GBUS)
    { course: 'GBUS 302', prerequisite: 'GBUS 301' },
    { course: 'GBUS 303', prerequisite: 'GBUS 302' },
    { course: 'GBUS 304', prerequisite: 'GBUS 303' },
    { course: 'GBUS 401', prerequisite: 'GBUS 304' },
    { course: 'GBUS 402', prerequisite: 'GBUS 401' },
    { course: 'GBUS 403', prerequisite: 'GBUS 402' },
    { course: 'GBUS 405', prerequisite: 'GBUS 404' },
    
    // Global Systems (GSYS)
    { course: 'GSYS 302', prerequisite: 'GSYS 301' },
    { course: 'GSYS 303', prerequisite: 'GSYS 302' },
    { course: 'GSYS 401', prerequisite: 'GSYS 303' },
    { course: 'GSYS 402', prerequisite: 'GSYS 401' },
    { course: 'GSYS 403', prerequisite: 'GSYS 402' },
    
    // Management (MGMT)
    { course: 'MGMT 302', prerequisite: 'MGMT 301' },
    { course: 'MGMT 303', prerequisite: 'MGMT 302' },
    { course: 'MGMT 401', prerequisite: 'MGMT 303' },
    { course: 'MGMT 402', prerequisite: 'MGMT 401' },
    { course: 'MGMT 403', prerequisite: 'MGMT 402' },
    { course: 'MGMT 404', prerequisite: 'MGMT 403' },
    
    // Entrepreneurship (ENTR)
    { course: 'ENTR 401', prerequisite: 'ENTR 301' },
    { course: 'ENTR 402', prerequisite: 'ENTR 401' },
    
    // Marketing (MARK)
    { course: 'MARK 302', prerequisite: 'MARK 301' },
    { course: 'MARK 401', prerequisite: 'MARK 302' },
    
    // Practicum (PRAC)
    { course: 'PRAC 402', prerequisite: 'PRAC 401' }
  ],
  
  // Associate of Science in Software Development (ASSD)
  ASSD: [
    // HTML & CSS
    { course: 'FSDI 102', prerequisite: 'FSDI 101' },
    
    // Programming Fundamentals
    { course: 'FSDI 104', prerequisite: 'FSDI 103' },
    
    // JavaScript & jQuery
    { course: 'FSDI 105', prerequisite: 'FSDI 104' },
    { course: 'FSDI 106', prerequisite: 'FSDI 105' },
    { course: 'FSDI 107', prerequisite: 'FSDI 106' },
    { course: 'FSDI 109', prerequisite: 'FSDI 107' },
    
    // Python
    { course: 'FSDI 110', prerequisite: 'FSDI 108' },
    { course: 'FSDI 111', prerequisite: 'FSDI 110' },
    { course: 'FSDI 112', prerequisite: 'FSDI 111' },
    { course: 'FSDI 113', prerequisite: 'FSDI 112' },
    
    // Software Architecture & Capstone
    { course: 'FSDI 116', prerequisite: 'FSDI 115' },
    { course: 'FSDI 117', prerequisite: 'FSDI 116' },
    { course: 'FSDI 118', prerequisite: 'FSDI 117' },
    { course: 'FSDI 119', prerequisite: 'FSDI 118' }
  ]
};

async function processPrerequisite(courseCode, prerequisiteCode) {
  try {
    // Buscar el curso principal
    const course = await prisma.course.findUnique({
      where: { courseCode }
    });

    if (!course) {
      console.log(`⚠️  Curso no encontrado: ${courseCode}`);
      return { success: false, reason: 'course_not_found' };
    }

    // Buscar el prerrequisito
    const prerequisiteCourse = await prisma.course.findUnique({
      where: { courseCode: prerequisiteCode }
    });

    if (!prerequisiteCourse) {
      console.log(`⚠️  Prerrequisito no encontrado: ${prerequisiteCode}`);
      return { success: false, reason: 'prerequisite_not_found' };
    }

    // Verificar si ya existe la relación
    const existing = await prisma.prerequisite.findFirst({
      where: {
        courseId: course.id,
        prerequisiteCourseId: prerequisiteCourse.id
      }
    });

    if (existing) {
      console.log(`ℹ️  Ya existe: ${courseCode} → ${prerequisiteCode}`);
      return { success: true, reason: 'already_exists' };
    }

    // Crear el prerrequisito
    await prisma.prerequisite.create({
      data: {
        courseId: course.id,
        prerequisiteCourseId: prerequisiteCourse.id
      }
    });

    console.log(`✅ Creado: ${courseCode} → ${prerequisiteCode}`);
    return { success: true, reason: 'created' };

  } catch (err) {
    console.error(`❌ Error procesando ${courseCode} → ${prerequisiteCode}: ${err.message}`);
    return { success: false, reason: 'error', error: err.message };
  }
}

async function main() {

  const stats = {
    created: 0,
    alreadyExists: 0,
    courseNotFound: 0,
    prerequisiteNotFound: 0,
    errors: 0
  };

  try {
    // Procesar prerrequisitos de BSGM
    console.log('📚 Procesando prerrequisitos de BSGM...\n');
    
    for (const { course, prerequisite } of PREREQUISITES.BSGM) {
      const result = await processPrerequisite(course, prerequisite);
      
      if (result.success) {
        if (result.reason === 'created') stats.created++;
        if (result.reason === 'already_exists') stats.alreadyExists++;
      } else {
        if (result.reason === 'course_not_found') stats.courseNotFound++;
        if (result.reason === 'prerequisite_not_found') stats.prerequisiteNotFound++;
        if (result.reason === 'error') stats.errors++;
      }
    }

    console.log('\n📚 Procesando prerrequisitos de ASSD...\n');
    
    // Procesar prerrequisitos de ASSD
    for (const { course, prerequisite } of PREREQUISITES.ASSD) {
      const result = await processPrerequisite(course, prerequisite);
      
      if (result.success) {
        if (result.reason === 'created') stats.created++;
        if (result.reason === 'already_exists') stats.alreadyExists++;
      } else {
        if (result.reason === 'course_not_found') stats.courseNotFound++;
        if (result.reason === 'prerequisite_not_found') stats.prerequisiteNotFound++;
        if (result.reason === 'error') stats.errors++;
      }
    }

    // Resumen final
    console.log(`✅ Prerrequisitos creados:          ${stats.created}`);
    console.log(`ℹ️  Ya existían:                    ${stats.alreadyExists}`);
    console.log(`⚠️  Cursos no encontrados:          ${stats.courseNotFound}`);
    console.log(`⚠️  Prerrequisitos no encontrados:  ${stats.prerequisiteNotFound}`);
    console.log(`❌ Errores:                         ${stats.errors}`);

    const total = stats.created + stats.alreadyExists;
    console.log(`Total de prerrequisitos en el sistema: ${total}`);

    // Mostrar advertencias si hay cursos faltantes
    if (stats.courseNotFound > 0 || stats.prerequisiteNotFound > 0) {
      console.log('\n⚠️  ADVERTENCIA: Algunos cursos no se encontraron en la base de datos.');
      console.log('   Asegúrate de que todos los cursos estén cargados antes de ejecutar este script.');
    }

  } catch (err) {
    console.error('\n❌ Error fatal:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
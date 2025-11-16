function reports() {
  return {
    activeReport: 'general',
    searchQuery: '',
    selectedStudent: null,
    opcionesGeneral: {
      totalAlumnos: false,
      listaAlumnos: false,
      CantidaddeSesiones: false,
      DescripcionSesion: false,
      All: false
    },
    filters: { program: 'all', session: 'all', occupancy: 'all' },
    clearFilters() {
      this.filters = { program: 'all', session: 'all', occupancy: 'all' };
    },
    applyFilters() {
      console.log('Applying filters:', this.filters);
    },
    verSeleccionados() {
    console.log(this.opcionesGeneral);
    // Obtener solo las seleccionadas
    const seleccionadas = Object.keys(this.opcionesGeneral).filter(key => this.opcionesGeneral[key]);
    console.log('Seleccionadas:', seleccionadas);
  },
  watchAll() {
  if (this.opcionesGeneral.All) {
    Object.keys(this.opcionesGeneral).forEach(key => {
      this.opcionesGeneral[key] = true;

    });
  }else {
      Object.keys(this.opcionesGeneral).forEach(key => {
        this.opcionesGeneral[key] = false;
});
    }
  },
subjects: [
    { id: 1, name: 'Mathematics', units: 4 },
    { id: 2, name: 'Science', units: 3 },
    { id: 3, name: 'History', units: 3 },
    { id: 4, name: 'Art', units: 2 },
    { id: 5, name: 'Physical Education', units: 1 },
    { id: 6, name: 'Biology', units: 4 },
    { id: 7, name: 'Chemistry', units: 4 },
    { id: 8, name: 'Literature', units: 3 },
    { id: 9, name: 'Computer Science', units: 4 },
    { id: 10, name: 'Economics', units: 3 },
    { id: 11, name: 'Psychology', units: 3 },
    { id: 12, name: 'Sociology', units: 3 }
],
students: [
          // (Los datos de los estudiantes permanecen igual)
          { 
            id: 1, 
            name: 'John Anderson', 
            studentId: 'SDGKU-2024-001',
            firstName: 'John',
            middleName: 'Michael',
            lastName: 'Anderson',
            phone: '+1 (619) 555-0123',
            emailPersonal: 'john.anderson@email.com',
            emailSDGKU: 'j.anderson@sdgku.edu',
            status: 'Active',
            program: "Bachelor's in Computer Science", 
            modality: 'Online',
            cohort: 'Fall 2024',
            language: 'English',
            totalUnits: 120,
            transferredUnits: 15,
            unitsEarned: 45,
            startDate: 'Aug 15, 2024',
            scheduledCompletion: 'May 15, 2028',
            graduationDate: 'TBD',
            progress: {} ,
            completedSubjects: [1, 2, 3], // Ya completó Mathematics, Science, History
        requiredSubjects: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Necesita estas para Computer Science
        grades: {
    1: { grade: 95, letter: 'A', status: 'Completed' },
    2: { grade: 88, letter: 'B+', status: 'Completed' },
    3: { grade: 92, letter: 'A-', status: 'Completed' },
    4: { grade: 85, letter: 'B', status: 'In Progress' },
    5: { grade: null, letter: '-', status: 'Not Started' },
    6: { grade: null, letter: '-', status: 'Not Started' },
    7: { grade: null, letter: '-', status: 'Not Started' },
    8: { grade: null, letter: '-', status: 'Not Started' },
    9: { grade: null, letter: '-', status: 'Not Started' },
    10: { grade: null, letter: '-', status: 'Not Started' },
    11: { grade: null, letter: '-', status: 'Not Started' },
    12: { grade: null, letter: '-', status: 'Not Started' }
  }
          },
          { 
            id: 2, 
            name: 'Sarah Williams', 
            studentId: 'SDGKU-2024-002',
            firstName: 'Sarah',
            middleName: 'Elizabeth',
            lastName: 'Williams',
            phone: '+1 (619) 555-0124',
            emailPersonal: 'sarah.w@email.com',
            emailSDGKU: 's.williams@sdgku.edu',
            status: 'Active',
            program: 'Associate in Business', 
            modality: 'Hybrid',
            cohort: 'Spring 2024',
            language: 'English',
            totalUnits: 60,
            transferredUnits: 0,
            unitsEarned: 30,
            startDate: 'Jan 10, 2024',
            scheduledCompletion: 'Dec 20, 2025',
            graduationDate: 'TBD',
            progress: {},
            completedSubjects: [1, 10], // Mathematics, Economics
        requiredSubjects: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] ,// Para Business
        grades: {
    1: { grade: 95, letter: 'A', status: 'Completed' },
    2: { grade: 88, letter: '-', status: 'In Progress' },
    3: { grade: 92, letter: '-', status: 'Completed' },
    4: { grade: 85, letter: '-', status: 'In Progress' },
    5: { grade: null, letter: '-', status: 'Not Started' },
    6: { grade: null, letter: '-', status: 'Not Started' },
    7: { grade: null, letter: '-', status: 'Not Started' },
    8: { grade: null, letter: '-', status: 'Not Started' },
    9: { grade: null, letter: '-', status: 'Not Started' },
    10: { grade: null, letter: 'B+', status: 'Completed' },
    11: { grade: null, letter: '-', status: 'Not Started' },
    12: { grade: null, letter: '-', status: 'Not Started' }
  } 
          },
          { 
            id: 3, 
            name: 'Michael Brown', 
            studentId: 'SDGKU-2023-089',
            firstName: 'Michael',
            middleName: 'James',
            lastName: 'Brown',
            phone: '+1 (619) 555-0125',
            emailPersonal: 'm.brown@email.com',
            emailSDGKU: 'm.brown@sdgku.edu',
            status: 'Active',
            program: "Bachelor's in Data Science", 
            modality: 'Online',
            cohort: 'Fall 2023',
            language: 'English',
            totalUnits: 120,
            transferredUnits: 20,
            unitsEarned: 75,
            startDate: 'Aug 20, 2023',
            scheduledCompletion: 'May 15, 2027',
            graduationDate: 'TBD',
            progress: {},
            completedSubjects: [1, 2, 6, 9], // Mathematics, Science, Biology, Computer Science
        requiredSubjects: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Para Data Science
        grades: {
    1: { grade: 95, letter: 'A', status: 'Completed' },
    2: { grade: 88, letter: 'B-', status: 'Completed' },
    3: { grade: 92, letter: 'B+', status: 'Completed' },
    4: { grade: null, letter: '-', status: 'In Progress' },
    5: { grade: null, letter: '-', status: 'Not Started' },
    6: { grade: 85, letter: 'B-', status: 'Completed' },
    7: { grade: null, letter: '-', status: 'Not Started' },
    8: { grade: null, letter: '-', status: 'Not Started' },
    9: { grade: 90, letter: 'B+', status: 'Completed' },
    10: { grade: 91, letter: 'B+', status: 'Completed' },
    11: { grade: null, letter: '-', status: 'Not Started' },
    12: { grade: null, letter: '-', status: 'Not Started' }
  } 

          },
          { 
            id: 4, 
            name: 'Emily Davis', 
            studentId: 'SDGKU-2024-015',
            firstName: 'Emily',
            middleName: 'Rose',
            lastName: 'Davis',
            phone: '+1 (619) 555-0126',
            emailPersonal: 'emily.davis@email.com',
            emailSDGKU: 'e.davis@sdgku.edu',
            status: 'Active',
            program: "Bachelor's in Psychology", 
            modality: 'On-Campus',
            cohort: 'Fall 2024',
            language: 'English',
            totalUnits: 120,
            transferredUnits: 10,
            unitsEarned: 40,
            startDate: 'Aug 18, 2024',
            scheduledCompletion: 'May 20, 2028',
            graduationDate: 'TBD',
            progress: {},
            completedSubjects: [1, 11], // Mathematics, Psychology
        requiredSubjects: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Para Psychology
        grades: {
  1: { grade: 90, letter: 'A-', status: 'Completed' },
  2: { grade: 85, letter: 'B', status: 'In Progress' },
  3: { grade: null, letter: '-', status: 'Not Started' },
  4: { grade: null, letter: '-', status: 'Not Started' },
  5: { grade: null, letter: '-', status: 'Not Started' },
  6: { grade: null, letter: '-', status: 'Not Started' },
  7: { grade: null, letter: '-', status: 'Not Started' },
  8: { grade: null, letter: '-', status: 'Not Started' },
  9: { grade: null, letter: '-', status: 'Not Started' },
  10: { grade: null, letter: '-', status: 'Not Started' },
  11: { grade: 93, letter: 'A', status: 'Completed' },
  12: { grade: null, letter: '-', status: 'Not Started' }
} 
          },
          { 
            id: 5, 
            name: 'James Wilson', 
            studentId: 'SDGKU-2024-032',
            firstName: 'James',
            middleName: 'Robert',
            lastName: 'Wilson',
            phone: '+1 (619) 555-0127',
            emailPersonal: 'james.w@email.com',
            emailSDGKU: 'j.wilson@sdgku.edu',
            status: 'Active',
            program: 'Associate in IT', 
            modality: 'Online',
            cohort: 'Spring 2024',
            language: 'English',
            totalUnits: 60,
            transferredUnits: 5,
            unitsEarned: 25,
            startDate: 'Jan 15, 2024',
            scheduledCompletion: 'Dec 15, 2025',
            graduationDate: 'TBD',
            progress: {},
            completedSubjects: [1, 9], // Mathematics, Computer Science
        requiredSubjects: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Para IT
        grades: {
  1: { grade: 87, letter: 'B+', status: 'Completed' },
  2: { grade: 80, letter: 'B-', status: 'In Progress' },
  3: { grade: null, letter: '-', status: 'Not Started' },
  4: { grade: null, letter: '-', status: 'Not Started' },
  5: { grade: null, letter: '-', status: 'Not Started' },
  6: { grade: null, letter: '-', status: 'Not Started' },
  7: { grade: null, letter: '-', status: 'Not Started' },
  8: { grade: null, letter: '-', status: 'Not Started' },
  9: { grade: 91, letter: 'A-', status: 'Completed' },
  10: { grade: null, letter: '-', status: 'Not Started' },
  11: { grade: null, letter: '-', status: 'Not Started' },
  12: { grade: null, letter: '-', status: 'Not Started' }
} 
          },
          { 
            id: 6, 
            name: 'Jessica Martinez', 
            studentId: 'SDGKU-2023-054',
            firstName: 'Jessica',
            middleName: 'Marie',
            lastName: 'Martinez',
            phone: '+1 (619) 555-0128',
            emailPersonal: 'j.martinez@email.com',
            emailSDGKU: 'j.martinez@sdgku.edu',
            status: 'Active',
            program: "Bachelor's in Nursing", 
            modality: 'Hybrid',
            cohort: 'Fall 2023',
            language: 'Bilingual (EN/ES)',
            totalUnits: 128,
            transferredUnits: 25,
            unitsEarned: 90,
            startDate: 'Aug 22, 2023',
            scheduledCompletion: 'May 10, 2027',
            graduationDate: 'TBD',
            progress: {},
            completedSubjects: [1, 2, 6, 7], // Mathematics, Science, Biology, Chemistry
        requiredSubjects: [1, 2, 3, 4, 5, 6, 7], // Para Nursing 
        // Estudiante 6 - Jessica Martinez (Nursing)
grades: {
  1: { grade: 94, letter: 'A', status: 'Completed' },
  2: { grade: 89, letter: 'B+', status: 'Completed' },
  3: { grade: null, letter: '-', status: 'Not Started' },
  4: { grade: null, letter: '-', status: 'Not Started' },
  5: { grade: null, letter: '-', status: 'Not Started' },
  6: { grade: 92, letter: 'A-', status: 'Completed' },
  7: { grade: 88, letter: 'B+', status: 'Completed' },
  8: { grade: null, letter: '-', status: 'Not Started' },
  9: { grade: null, letter: '-', status: 'Not Started' },
  10: { grade: null, letter: '-', status: 'Not Started' },
  11: { grade: null, letter: '-', status: 'Not Started' },
  12: { grade: null, letter: '-', status: 'Not Started' }
}
          },
          { 
            id: 7, 
            name: 'David Garcia', 
            studentId: 'SDGKU-2024-041',
            firstName: 'David',
            middleName: 'Luis',
            lastName: 'Garcia',
            phone: '+1 (619) 555-0129',
            emailPersonal: 'david.g@email.com',
            emailSDGKU: 'd.garcia@sdgku.edu',
            status: 'On Leave',
            program: 'Associate in Arts', 
            modality: 'Online',
            cohort: 'Spring 2024',
            language: 'Spanish',
            totalUnits: 60,
            transferredUnits: 0,
            unitsEarned: 18,
            startDate: 'Jan 12, 2024',
            scheduledCompletion: 'Dec 18, 2025',
            graduationDate: 'TBD',
            progress: {},
            completedSubjects: [3, 4, 1], // History, Art, Literature
        requiredSubjects: [1, 2, 3, 4, 5, 6, 7], // Para Arts 
        grades: {
  1: { grade: 75, letter: 'C', status: 'Completed' },
  2: { grade: null, letter: '-', status: 'Not Started' },
  3: { grade: 82, letter: 'B-', status: 'Completed' },
  4: { grade: 88, letter: 'B+', status: 'Completed' },
  5: { grade: null, letter: '-', status: 'Not Started' },
  6: { grade: null, letter: '-', status: 'Not Started' },
  7: { grade: null, letter: '-', status: 'Not Started' },
  8: { grade: null, letter: '-', status: 'Not Started' },
  9: { grade: null, letter: '-', status: 'Not Started' },
  10: { grade: null, letter: '-', status: 'Not Started' },
  11: { grade: null, letter: '-', status: 'Not Started' },
  12: { grade: null, letter: '-', status: 'Not Started' }
}

          },
          { 
            id: 8, 
            name: 'Ashley Rodriguez', 
            studentId: 'SDGKU-2023-072',
            firstName: 'Ashley',
            middleName: 'Nicole',
            lastName: 'Rodriguez',
            phone: '+1 (619) 555-0130',
            emailPersonal: 'ashley.r@email.com',
            emailSDGKU: 'a.rodriguez@sdgku.edu',
            status: 'Active',
            program: "Bachelor's in Marketing", 
            modality: 'On-Campus',
            cohort: 'Fall 2023',
            language: 'English',
            totalUnits: 120,
            transferredUnits: 12,
            unitsEarned: 80,
            startDate: 'Aug 25, 2023',
            scheduledCompletion: 'May 12, 2027',
            graduationDate: 'TBD',
            progress: {},
            completedSubjects: [1, 2, 3], // Mathematics, Economics, Psychology
        requiredSubjects: [1, 2, 3, 4, 5, 6, 7], // Para Marketing 
        grades: {
  1: { grade: 96, letter: 'A', status: 'Completed' },
  2: { grade: 91, letter: 'A-', status: 'Completed' },
  3: { grade: 89, letter: 'B+', status: 'Completed' },
  4: { grade: null, letter: '-', status: 'Not Started' },
  5: { grade: null, letter: '-', status: 'Not Started' },
  6: { grade: null, letter: '-', status: 'Not Started' },
  7: { grade: null, letter: '-', status: 'Not Started' },
  8: { grade: null, letter: '-', status: 'Not Started' },
  9: { grade: null, letter: '-', status: 'Not Started' },
  10: { grade: null, letter: '-', status: 'Not Started' },
  11: { grade: null, letter: '-', status: 'Not Started' },
  12: { grade: null, letter: '-', status: 'Not Started' }
}
          },
          { 
            id: 9, 
            name: 'Daniel Lee', 
            studentId: 'SDGKU-2024-008',
            firstName: 'Daniel',
            middleName: 'William',
            lastName: 'Lee',
            phone: '+1 (619) 555-0131',
            emailPersonal: 'daniel.lee@email.com',
            emailSDGKU: 'd.lee@sdgku.edu',
            status: 'Active',
            program: "Bachelor's in Engineering", 
            modality: 'Hybrid',
            cohort: 'Fall 2024',
            language: 'English',
            totalUnits: 132,
            transferredUnits: 18,
            unitsEarned: 50,
            startDate: 'Aug 16, 2024',
            scheduledCompletion: 'May 25, 2028',
            graduationDate: 'TBD',
            progress: {},
            completedSubjects: [1, 2, 7], // Mathematics, Science, Chemistry
        requiredSubjects: [1, 2, 3, 4, 5, 6, 7], // Para Engineering
        grades: {
  1: { grade: 98, letter: 'A', status: 'Completed' },
  2: { grade: 94, letter: 'A', status: 'Completed' },
  3: { grade: null, letter: '-', status: 'Not Started' },
  4: { grade: null, letter: '-', status: 'Not Started' },
  5: { grade: null, letter: '-', status: 'Not Started' },
  6: { grade: null, letter: '-', status: 'Not Started' },
  7: { grade: 93, letter: 'A', status: 'Completed' },
  8: { grade: null, letter: '-', status: 'Not Started' },
  9: { grade: null, letter: '-', status: 'Not Started' },
  10: { grade: null, letter: '-', status: 'Not Started' },
  11: { grade: null, letter: '-', status: 'Not Started' },
  12: { grade: null, letter: '-', status: 'Not Started' }
} 
          },
          { 
            id: 10, 
            name: 'Amanda Taylor', 
            studentId: 'SDGKU-2024-023',
            firstName: 'Amanda',
            middleName: 'Grace',
            lastName: 'Taylor',
            phone: '+1 (619) 555-0132',
            emailPersonal: 'amanda.t@email.com',
            emailSDGKU: 'a.taylor@sdgku.edu',
            status: 'Active',
            program: 'Associate in Healthcare', 
            modality: 'Online',
            cohort: 'Spring 2024',
            language: 'English',
            totalUnits: 60,
            transferredUnits: 8,
            unitsEarned: 35,
            startDate: 'Jan 18, 2024',
            scheduledCompletion: 'Dec 22, 2025',
            graduationDate: 'TBD',
            progress: {},
            completedSubjects: [2, 6], // Science, Biology
        requiredSubjects: [1, 2, 3, 4, 5, 6, 7], // Para Healthcare 
        grades: {
  1: { grade: null, letter: '-', status: 'Not Started' },
  2: { grade: 86, letter: 'B', status: 'Completed' },
  3: { grade: null, letter: '-', status: 'Not Started' },
  4: { grade: null, letter: '-', status: 'Not Started' },
  5: { grade: null, letter: '-', status: 'Not Started' },
  6: { grade: 90, letter: 'A-', status: 'Completed' },
  7: { grade: 84, letter: 'B', status: 'In Progress' },
  8: { grade: null, letter: '-', status: 'Not Started' },
  9: { grade: null, letter: '-', status: 'Not Started' },
  10: { grade: null, letter: '-', status: 'Not Started' },
  11: { grade: null, letter: '-', status: 'Not Started' },
  12: { grade: null, letter: '-', status: 'Not Started' }
}
          }
        ],
sessionData: [
    {
    id: 1,
    NumberofSessions: 1,
    date: '2024-03-01',
    program: "Bachelor's",
    cantidadAlumnos: 30,
    Materias: [1,2,3],
    listAlumns:[1,3,4,9]
},
{
    id: 2,
    NumberofSessions: 1,
    date: '2024-6-01',
    program: "Associate's",
    cantidadAlumnos: 20,
    Materias: [1,2,3,4,5],
    listAlumns:[2,5,7,10]
},
{
    id: 3,
    NumberofSessions: 2,
    date: '2024-09-01',
    program: "Bachelor's",
    cantidadAlumnos: 39,
    Materias: [1,2,4,5],
    listAlumns:[1,4,8,9]
},
{
    id: 4,
    NumberofSessions: 2,
    date: '2024-12-01',
    program: "Associate's",
    cantidadAlumnos: 55,
    Materias: [1],
    listAlumns:[1,2,5,6,7,10]
},
{
    id: 5,
    NumberofSessions: 3,
    date: '2025-01-01',
    program: "Bachelor's",
    cantidadAlumnos: 8,
    Materias: [1,2,3,4,5,6,7],
    listAlumns:[2,3,4,6,8,9]
}
    
],
// Obtener el total de estudiantes
  totalStudents() {
    return this.students.length;
  },
  
  // Obtener total de sesiones
  totalSessions() {
    return this.sessionData.length;
  },
getStudentsInSession(sessionId) {
    const session = this.sessionData.find(s => s.id === sessionId);
    if (!session) return [];
    
    // Retorna los objetos completos de los estudiantes
    return session.listAlumns.map(studentId => 
      this.students.find(student => student.id === studentId)
    ).filter(student => student !== undefined);
  },
  // Obtener nombre de materia por ID
getSubjectName(subjectId) {
    const subject = this.subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Unknown';
},

// Obtener nombres de materias de una sesión
getSessionSubjects(sessionId) {
    const session = this.sessionData.find(s => s.id === sessionId);
    if (!session) return [];
    return session.Materias.map(id => this.getSubjectName(id));
},

// Obtener materias faltantes de un estudiante
getMissingSubjects(studentId) {
    const student = this.students.find(s => s.id === studentId);
    if (!student) return [];
    
    const missing = student.requiredSubjects.filter(
        subjectId => !student.completedSubjects.includes(subjectId)
    );
    
    return missing;
},

// Generar recomendaciones automáticas
generateRecommendations() {
    const recommendations = {};
    
    this.students.forEach(student => {
        const missingIds = this.getMissingSubjects(student.id);
        
        missingIds.forEach(subjectId => {
            const subjectName = this.getSubjectName(subjectId);
            
            if (!recommendations[subjectName]) {
                recommendations[subjectName] = {
                    subjectId: subjectId,
                    students: [],
                    count: 0
                };
            }
            
            recommendations[subjectName].students.push(student.name);
            recommendations[subjectName].count++;
        });
    });
    
    return recommendations;
},

// Formatear recomendaciones para mostrar
getFormattedRecommendations() {
    const recs = this.generateRecommendations();
    const result = [];
    
    Object.keys(recs).forEach(subject => {
        result.push({
            subject: subject,
            subjectId: recs[subject].subjectId,
            studentCount: recs[subject].count,
            students: recs[subject].students
        });
    });
    
    return result.sort((a, b) => b.studentCount - a.studentCount);
},
// Computed property para filtrar estudiantes
    // Computed property para filtrar estudiantes
    get filteredStudents() {
      if (!this.searchQuery || this.searchQuery.trim() === '') {
        return this.students;
      }
      
      const query = this.searchQuery.toLowerCase().trim();
      
      return this.students.filter(student => {
        return (
          student.name.toLowerCase().includes(query) ||
          student.studentId.toLowerCase().includes(query) ||
          student.program.toLowerCase().includes(query) ||
          student.emailPersonal.toLowerCase().includes(query) || // ⭐ CORREGIDO
          student.emailSDGKU.toLowerCase().includes(query) // ⭐ CORREGIDO
        );
      });
    },
    
    filterStudents() {
      console.log('Buscando:', this.searchQuery);
    },

    // Agregar este método en tu función reports()
getStudentGPA(studentId) {
  const student = this.students.find(s => s.id === studentId);
  if (!student || !student.grades) return 'N/A';
  
  const completedGrades = Object.values(student.grades)
    .filter(g => g.status === 'Completed' && g.grade !== null);
  
  if (completedGrades.length === 0) return 'N/A';
  
  const sum = completedGrades.reduce((acc, g) => acc + g.grade, 0);
  return (sum / completedGrades.length).toFixed(2);
},

// Método para obtener letra de calificación según el número
getLetterGrade(numericGrade) {
  if (numericGrade >= 93) return 'A';
  if (numericGrade >= 90) return 'A-';
  if (numericGrade >= 87) return 'B+';
  if (numericGrade >= 83) return 'B';
  if (numericGrade >= 80) return 'B-';
  if (numericGrade >= 77) return 'C+';
  if (numericGrade >= 73) return 'C';
  if (numericGrade >= 70) return 'C-';
  if (numericGrade >= 67) return 'D+';
  if (numericGrade >= 63) return 'D';
  if (numericGrade >= 60) return 'D-';
  return 'F';
},

// Obtener materias con calificaciones del estudiante
getStudentSubjectsWithGrades(studentId) {
  const student = this.students.find(s => s.id === studentId);
  if (!student) return [];
  
  return student.requiredSubjects.map(subjectId => {
    const subject = this.subjects.find(s => s.id === subjectId);
    const gradeInfo = student.grades ? student.grades[subjectId] : null;
    
    return {
      id: subjectId,
      name: subject ? subject.name : 'Unknown',
      units: subject ? subject.units : 0,
      grade: gradeInfo?.grade || null,
      letter: gradeInfo?.letter || '-',
      status: gradeInfo?.status || 'Not Started'
    };
  });
}

  };
}

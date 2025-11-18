function reports() {
  return {
    activeReport: 'general',
    searchQuery: '',
    selectedStudent: null,
    
    // 🆕 NUEVAS VARIABLES PARA EDICIÓN DE CALIFICACIONES
    editingGrades: false,
    courseSearchQuery: '',
    coursesForEditing: [],
    modifiedCourses: [],
    savingGrades: false,
    saveStatus: { type: '', message: '' },
    editingStudentId: null, // 🆕 Guardar el ID del estudiante siendo editado
    
    opcionesGeneral: {
      totalAlumnos: false,
      listaAlumnos: false,
      CantidaddeSesiones: false,
      DescripcionSesion: false,
      All: false
    },
    filters: { program: 'all', session: 'all', occupancy: 'all' },
    
    // Variables para datos de BD
    students: [],
    sessionData: [],
    subjects: [],
    programs: [],
    loading: true,
    error: null,
    
    // URL de tu API
    apiUrl: 'http://localhost:3000/api',
    
    // Inicialización
    async init() {
      console.log('🚀 Iniciando carga de datos de reportes...');
      await this.loadAllData();
      await this.loadRecommendations();
    },
    
    // Cargar todos los datos
    async loadAllData() {
      this.loading = true;
      this.error = null;
      
      try {
        await Promise.all([
          this.loadPrograms(),
          this.loadCourses(),
          this.loadStudents(),
          this.loadSessions()
        ]);
        
        console.log('✅ Datos cargados correctamente:', {
          programs: this.programs.length,
          courses: this.subjects.length,
          students: this.students.length,
          sessions: this.sessionData.length
        });
      } catch (error) {
        console.error('❌ Error cargando datos:', error);
        this.error = 'Error al cargar datos. Verifica que el servidor esté corriendo.';
      } finally {
        this.loading = false;
      }
    },
    
    // Cargar programas
    async loadPrograms() {
      try {
        const response = await fetch(`${this.apiUrl}/programs`);
        if (!response.ok) throw new Error('Error loading programs');
        this.programs = await response.json();
        console.log('📚 Programas cargados:', this.programs.length);
      } catch (error) {
        console.error('Error loading programs:', error);
        throw error;
      }
    },
    
    // Cargar cursos
    async loadCourses() {
      try {
        const response = await fetch(`${this.apiUrl}/courses`);
        if (!response.ok) throw new Error('Error loading courses');
        const courses = await response.json();
        
        // Adaptar formato
        this.subjects = courses.map(course => ({
          id: parseInt(course.id),
          name: course.name,
          code: course.code,
          units: 3
        }));
        
        console.log('📖 Cursos cargados:', this.subjects.length);
      } catch (error) {
        console.error('Error loading courses:', error);
        throw error;
      }
    },
    
    // Cargar estudiantes
    async loadStudents() {
      try {
        const response = await fetch(`${this.apiUrl}/students`);
        if (!response.ok) throw new Error('Error loading students');
        const studentsData = await response.json();
        
        this.students = studentsData.map(student => ({
          id: student.id,
          studentId: student.studentId,
          name: student.name,
          firstName: student.firstName,
          middleName: student.middleName,
          lastName: student.lastName,
          phone: student.phone,
          emailPersonal: student.emailPersonal,
          emailSDGKU: student.emailSDGKU,
          status: student.status,
          program: student.program,
          modality: student.modality,
          cohort: student.cohort,
          language: student.language,
          totalUnits: student.totalUnits,
          transferredUnits: student.transferredUnits,
          unitsEarned: student.unitsEarned,
          startDate: student.startDate,
          scheduledCompletion: student.scheduledCompletion,
          graduationDate: student.graduationDate,
          completedSubjects: student.completedSubjects || [],
          requiredSubjects: student.requiredSubjects || [],
          grades: student.grades || {},
          progress: {}
        }));
        
        console.log('👥 Estudiantes cargados:', this.students.length);
      } catch (error) {
        console.error('Error loading students:', error);
        throw error;
      }
    },
    
    // Cargar sesiones
    async loadSessions() {
      try {
        const response = await fetch(`${this.apiUrl}/sessions`);
        if (!response.ok) throw new Error('Error loading sessions');
        const sessions = await response.json();
        
        this.sessionData = await Promise.all(sessions.map(async (session) => {
          const coursesResponse = await fetch(`${this.apiUrl}/sessions/${session.id}/courses`);
          const coursesData = await coursesResponse.json();
          
          const studentIds = new Set();
          coursesData.forEach(course => {
            course.students.forEach(student => {
              studentIds.add(parseInt(student.id));
            });
          });
          
          const materiaIds = coursesData.map(c => {
            const subject = this.subjects.find(s => s.code === c.code);
            return subject ? subject.id : null;
          }).filter(id => id !== null);
          
          return {
            id: session.id,
            NumberofSessions: session.number || session.id,
            date: session.startDate,
            program: session.program,
            cantidadAlumnos: coursesData.reduce((sum, c) => sum + c.currentEnrollment, 0),
            Materias: materiaIds,
            listAlumns: Array.from(studentIds)
          };
        }));
        
        console.log('📅 Sesiones cargadas:', this.sessionData.length);
      } catch (error) {
        console.error('Error loading sessions:', error);
        throw error;
      }
    },

    // ========================================
    // 🆕 NUEVAS FUNCIONES PARA EDITAR CALIFICACIONES
    // ========================================
    
    // Abrir modal de edición de calificaciones
    async openGradesEditor(student) {
      this.selectedStudent = student;
      this.editingStudentId = student.id; // 🆕 Guardar el ID
      this.editingGrades = true;
      this.courseSearchQuery = '';
      this.modifiedCourses = [];
      this.saveStatus = { type: '', message: '' };
      
      await this.loadCoursesForEditing(student.id);
    },
    
    // Cargar cursos para editar
    async loadCoursesForEditing(studentId) {
      try {
        const gradesResponse = await fetch(`${this.apiUrl}/students/${studentId}/grades`);
        const existingGrades = await gradesResponse.json();
        
        const gradesMap = {};
        existingGrades.forEach(record => {
          gradesMap[record.course.courseCode] = {
            grade: record.grade || '--',
            sessionId: record.sessionId
          };
        });
        
        this.coursesForEditing = this.subjects.map(subject => ({
          code: subject.code,
          name: subject.name,
          grade: gradesMap[subject.code]?.grade || '--',
          sessionId: gradesMap[subject.code]?.sessionId || null,
          modified: false
        }));
        
        console.log('📝 Cursos cargados para edición:', this.coursesForEditing.length);
      } catch (error) {
        console.error('Error loading courses for editing:', error);
        this.saveStatus = {
          type: 'error',
          message: 'Error al cargar los cursos'
        };
      }
    },
    
    // Filtrar cursos para mostrar en el editor
    get filteredCoursesForEditing() {
      if (!this.courseSearchQuery || this.courseSearchQuery.trim() === '') {
        return this.coursesForEditing;
      }
      
      const query = this.courseSearchQuery.toLowerCase().trim();
      return this.coursesForEditing.filter(course => 
        course.code.toLowerCase().includes(query) || 
        course.name.toLowerCase().includes(query)
      );
    },
    
    // Marcar curso como modificado
    markAsModified(courseCode) {
      const course = this.coursesForEditing.find(c => c.code === courseCode);
      if (course) {
        course.modified = true;
        if (!this.modifiedCourses.includes(courseCode)) {
          this.modifiedCourses.push(courseCode);
        }
      }
    },
    
    // Obtener texto de status
    getStatusText(grade) {
      if (grade === '--') return 'Not Taken';
      if (grade === 'IP') return 'In Progress';
      return 'Completed';
    },
    
    // Resetear cambios
    resetGrades() {
      if (confirm('¿Estás seguro de resetear todos los cambios?')) {
        this.loadCoursesForEditing(this.editingStudentId); // 🆕 Usar editingStudentId
        this.modifiedCourses = [];
        this.saveStatus = { type: '', message: '' };
      }
    },
    
    // Guardar calificaciones
    async saveGrades() {
      if (this.modifiedCourses.length === 0) return;
      
      // 🆕 Verificar que tengamos el ID
      if (!this.editingStudentId) {
        this.saveStatus = {
          type: 'error',
          message: 'Error: No se encontró el ID del estudiante'
        };
        return;
      }
      
      this.savingGrades = true;
      this.saveStatus = { type: 'info', message: 'Saving changes...' };
      
      try {
        const gradesToSave = this.coursesForEditing
          .filter(course => course.modified)
          .map(course => ({
            courseCode: course.code,
            grade: course.grade,
            sessionId: course.sessionId
          }));
        
        console.log('💾 Guardando calificaciones:', gradesToSave);
        
        const response = await fetch(
          `${this.apiUrl}/students/${this.editingStudentId}/grades/batch`, // 🆕 Usar editingStudentId
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grades: gradesToSave })
          }
        );
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          this.saveStatus = {
            type: 'success',
            message: `✅ ${result.successful} calificaciones guardadas exitosamente`
          };
          
          this.modifiedCourses = [];
          this.coursesForEditing.forEach(course => course.modified = false);
          
          await this.loadStudents();
          
          setTimeout(() => {
            this.editingGrades = false;
            this.saveStatus = { type: '', message: '' };
          }, 2000);
          
        } else {
          throw new Error(result.error || 'Error al guardar');
        }
        
      } catch (error) {
        console.error('❌ Error guardando calificaciones:', error);
        this.saveStatus = {
          type: 'error',
          message: `Error: ${error.message}`
        };
      } finally {
        this.savingGrades = false;
      }
    },

    // ========================================
    // FUNCIONES ORIGINALES
    // ========================================
    
    clearFilters() {
      this.filters = { program: 'all', session: 'all', occupancy: 'all' };
    },
    
    applyFilters() {
      console.log('Applying filters:', this.filters);
    },
    
    verSeleccionados() {
      console.log(this.opcionesGeneral);
      const seleccionadas = Object.keys(this.opcionesGeneral).filter(key => this.opcionesGeneral[key]);
      console.log('Seleccionadas:', seleccionadas);
    },
    
    watchAll() {
      if (this.opcionesGeneral.All) {
        Object.keys(this.opcionesGeneral).forEach(key => {
          this.opcionesGeneral[key] = true;
        });
      } else {
        Object.keys(this.opcionesGeneral).forEach(key => {
          this.opcionesGeneral[key] = false;
        });
      }
    },
    
    totalStudents() {
      return this.students.length;
    },
    
    totalSessions() {
      return this.sessionData.length;
    },
    
    getStudentsInSession(sessionId) {
      const session = this.sessionData.find(s => s.id === sessionId);
      if (!session) return [];
      
      return session.listAlumns.map(studentId => 
        this.students.find(student => student.id === studentId)
      ).filter(student => student !== undefined);
    },
    
    getSubjectName(subjectId) {
      const subject = this.subjects.find(s => s.id === subjectId);
      return subject ? subject.name : 'Unknown';
    },
    
    getSessionSubjects(sessionId) {
      const session = this.sessionData.find(s => s.id === sessionId);
      if (!session) return [];
      return session.Materias.map(id => this.getSubjectName(id));
    },
    
    getMissingSubjects(studentId) {
      const student = this.students.find(s => s.id === studentId);
      if (!student) return [];
      
      if (!student.requiredSubjects || student.requiredSubjects.length === 0) {
        return this.subjects
          .map(s => s.id)
          .filter(id => !student.completedSubjects.includes(id));
      }
      
      const missing = student.requiredSubjects.filter(
        subjectId => !student.completedSubjects.includes(subjectId)
      );
      
      return missing;
    },
    
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
          (student.emailPersonal && student.emailPersonal.toLowerCase().includes(query)) ||
          (student.emailSDGKU && student.emailSDGKU.toLowerCase().includes(query))
        );
      });
    },
    
    filterStudents() {
      console.log('Buscando:', this.searchQuery);
    },
    
    getStudentGPA(studentId) {
      const student = this.students.find(s => s.id === studentId);
      if (!student || !student.grades) return 'N/A';
      
      const completedGrades = Object.values(student.grades)
        .filter(g => g.status === 'Completed' && g.grade !== null);
      
      if (completedGrades.length === 0) return 'N/A';
      
      const sum = completedGrades.reduce((acc, g) => acc + g.grade, 0);
      return (sum / completedGrades.length).toFixed(2);
    },
    
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
    
    getStudentSubjectsWithGrades(studentId) {
      const student = this.students.find(s => s.id === studentId);
      if (!student) return [];
      
      const subjectsToShow = student.requiredSubjects && student.requiredSubjects.length > 0
        ? student.requiredSubjects
        : this.subjects.map(s => s.id);
      
      return subjectsToShow.map(subjectId => {
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
    },
    async loadRecommendations() {
  try {
    const response = await fetch(`${this.apiUrl}/recommendations`);
    if (!response.ok) throw new Error('Error loading recommendations');

    const data = await response.json();

    // ⚡ Asegúrate de que sea un array
    this.recommendations = Array.isArray(data) ? data : (data.missingSubjects || []);

    console.log('📊 Recomendaciones cargadas:', this.recommendations);
  } catch (error) {
    console.error('❌ Error cargando recomendaciones:', error);
    this.recommendations = [];
  }
},
getFormattedRecommendations() {
  if (!this.recommendations || this.recommendations.length === 0) return [];

  return this.recommendations.map(course => ({
    subject: course.courseName,
    subjectId: course.courseId,
    studentCount: course.missingCount,
    students: course.students.map(s => s.fullName)
  }));
}
  };

}
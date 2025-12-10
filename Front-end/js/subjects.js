function coursesData() {
  return {
    open: false,
    message: '',
    showFilters: false,
    selectedCourse: null,
    searchQuery: '',
    totalActiveStudents: 0,
    allPrograms: [],
    allTeachers: [],
    validationError: '',

    showSelectSessionModal: false,
    selectedCourseForSession: null,
    isCreatingNewGroup: false,
    availableSessions: [],
    loadingSessions: false,

    showTeacherAssignmentModal: false,
    selectedGroupForTeacher: null,
    selectedTeacherId: '',

    filters: {
      program: 'all',
      session: 'all',
      occupancy: 'all',
      prerequisites: 'all'
    },

    modalStudentFilter: 'current',

    showCreateSessionModal: false,
    newSessionTemplate: null,
    newSession: { number: null, startDate: '', endDate: '', status: 'Planning', courses: [] },
    newSessionCoursesInput: '',
    tempSubject: '',

    toast: { show: false, message: '', type: 'success' },

    programConfig: {
      'ASSD': { label: 'ASSD', color: 'B34B20' },
      'BGSM': { label: 'BSGM', color: 'D41736' },
      'BSGM & ASSD': { label: 'EDU-GEN', color: '4D4E4E' }
    },

    allCourses: [],
    courses: [],
    availablePrograms: [],
    availableSessions: [],

    async init() {
      await this.loadPrograms();
      await this.loadTeachers();
      await this.fetchCourses();
      this.courses = [...this.allCourses];

      // Extract unique programs and sessions for filters
      this.availablePrograms = [...new Set(this.allCourses.map(c => c.program))];
      this.availableSessions = [...new Set(this.allCourses.map(c => c.session))];

      // Get total active students
      try {
        const studentsRes = await fetch('http://localhost:3000/api/students/count');
        const result = await studentsRes.json();
        this.totalActiveStudents = result.total;
      } catch (error) {
        console.error('❌ Error getting students:', error);
      }
    },

    async loadPrograms() {
      try {
        const response = await fetch('http://localhost:3000/api/programs');
        if (!response.ok) throw new Error('Failed to load programs');
        this.allPrograms = await response.json();
        console.log('Programs loaded:', this.allPrograms);
      } catch (error) {
        console.error('Error loading programs:', error);
      }
    },

    async loadTeachers() {
      try {
        const response = await fetch('http://localhost:3000/teachers');
        if (!response.ok) throw new Error('Failed to load teachers');
        this.allTeachers = await response.json();
        console.log('Teachers loaded:', this.allTeachers);
      } catch (error) {
        console.error('Error loading teachers:', error);
      }
    },

    getAvailableSubjectsForNewSession() {
      if (!this.newSession.programId) {
        return [];
      }

      const coursesForProgram = this.allCourses.filter(course => {
        // Filtrar por programa seleccionado
        const programMatch = course.program &&
          course.program.toLowerCase().includes(
            this.allPrograms.find(p => p.id == this.newSession.programId)?.programName.toLowerCase() || ''
          );
        return programMatch;
      });

      // Eliminar duplicados por courseCode
      const uniqueCourses = [];
      const seenCodes = new Set();

      for (const course of coursesForProgram) {
        if (!seenCodes.has(course.code)) {
          seenCodes.add(course.code);
          uniqueCourses.push({
            code: course.code,
            id: parseInt(course.id),
            name: course.name || course.courseName
          });
        }
      }

      // Filtrar los que ya están agregados
      const assignedCodes = (this.newSession.coursesWithTeachers || []).map(
        item => item.courseCode
      );

      return uniqueCourses.filter(
        course => !assignedCodes.includes(course.code)
      );
    },

    addCourseWithTeacher() {
      if (!this.tempSubject) return;

      if (!this.newSession.coursesWithTeachers) {
        this.newSession.coursesWithTeachers = [];
      }

      // Verificar que no exista ya
      const exists = this.newSession.coursesWithTeachers.some(
        item => item.courseCode === this.tempSubject
      );

      if (!exists) {
        // Buscar el curso en allCourses
        const course = this.allCourses.find(c => c.code === this.tempSubject);

        this.newSession.coursesWithTeachers.push({
          courseId: course ? parseInt(course.id) : null,
          courseCode: this.tempSubject,
          teacherId: '',
          teacherName: ''
        });
      }

      this.tempSubject = '';
    },

    removeCourseWithTeacher(index) {
      if (this.newSession.coursesWithTeachers) {
        this.newSession.coursesWithTeachers.splice(index, 1);
      }
    },

    validateNewSession() {
      this.validationError = '';

      if (!this.newSession.programId) {
        this.validationError = 'Please select a program';
        return false;
      }

      if (!this.newSession.startDate) {
        this.validationError = 'Please select a start date';
        return false;
      }

      if (!this.newSession.endDate) {
        this.validationError = 'Please select an end date';
        return false;
      }

      if (!this.newSession.coursesWithTeachers || this.newSession.coursesWithTeachers.length === 0) {
        this.validationError = 'Please select at least one subject';
        return false;
      }

      // Validar que todas las materias tengan profesor
      const missingTeacher = this.newSession.coursesWithTeachers.some(
        item => !item.teacherId
      );

      if (missingTeacher) {
        this.validationError = 'All subjects must have an assigned professor';
        return false;
      }

      return true;
    },

    async fetchCourses() {
      try {
        const res = await fetch('http://localhost:3000/api/courses');
        const data = await res.json();

        if (!Array.isArray(data)) {
          console.error('❌ Expected array but got:', data);
          this.allCourses = [];
          return;
        }

        // Get total active students in the system
        const studentsRes = await fetch('http://localhost:3000/api/students/count');
        const result = await studentsRes.json();
        const totalActiveStudents = result.total;

        this.allCourses = data.map(c => {
          const missingCount = c.courseData?.missingStudents?.length || 0;
          const missingPercent = totalActiveStudents > 0
            ? Math.round((missingCount / totalActiveStudents) * 100)
            : 0;

          return {
            ...c,
            occupancy: c.maxStudents ? Math.round((c.students.length / c.maxStudents) * 100) : 0,
            missingCount: missingCount,
            missingPercent: missingPercent
          };
        });

        console.log('✅ Loaded courses:', this.allCourses);
      } catch (error) {
        console.error('❌ Error loading courses from backend:', error);
        this.allCourses = [];
      }
    },

    getProgramConfig(program) {
      return this.programConfig[program] || { label: program, color: 'A6192E' };
    },

    getCardBg(occupancy) {
      if (occupancy >= 70) return 'rgba(255, 255, 255, 0.6)';
      if (occupancy >= 40) return 'rgba(255, 255, 255, 0.4)';
      return 'rgba(255, 194, 194, 0.4)';
    },

    showStudents(course) {
      this.selectedCourse = course;
      this.modalStudentFilter = 'current';
    },

    recalculateMetrics(course) {
      this.allCourses.forEach(c => {
        if (c.code === course.code) {
          const missing = c.courseData?.missingStudents?.length || 0;

          c.missingCount = missing;
          c.missingPercent = this.totalActiveStudents > 0
            ? Math.round((missing / this.totalActiveStudents) * 100)
            : 0;
          c.occupancy = c.maxStudents ? Math.round((c.students.length / c.maxStudents) * 100) : 0;
        }
      });
    },

    enrollStudent(student) {
      if (!this.selectedCourse) return;

      this.selectedCourse.courseData.missingStudents = this.selectedCourse.courseData.missingStudents.filter(s => s.id !== student.id);
      this.selectedCourse.students.push(student);
      this.recalculateMetrics(this.selectedCourse);
    },

    removeStudent(studentId) {
      if (!this.selectedCourse) return;

      const student = this.selectedCourse.students.find(s => s.id === studentId);
      if (!student) return;

      this.selectedCourse.students = this.selectedCourse.students.filter(s => s.id !== studentId);
      this.selectedCourse.courseData.missingStudents.push(student);
      this.recalculateMetrics(this.selectedCourse);
    },

    openCreateSessionModal() {
      const today = new Date();
      const fiveWeeksLater = new Date(today);
      fiveWeeksLater.setDate(fiveWeeksLater.getDate() + 35);

      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      this.newSession = {
        number: null,
        startDate: formatDate(today),
        endDate: formatDate(fiveWeeksLater),
        programId: '',
        coursesWithTeachers: this.newSessionTemplate ? [{
          courseId: this.newSessionTemplate.id,
          courseCode: this.newSessionTemplate.code,
          teacherId: '',
          teacherName: ''
        }] : []
      };

      this.tempSubject = '';
      this.validationError = '';
      this.showCreateSessionModal = true;
    },

    updateNewSessionCoursesArray() {
      this.newSession.courses = this.newSessionCoursesInput.split(',').map(s => s.trim()).filter(Boolean);
    },

    async saveNewSession() {
      if (!this.validateNewSession()) {
        this.showToast(this.validationError, 'error');
        return;
      }

      try {
        const sessionData = {
          sessionName: `Session ${this.newSession.number}`,
          startDate: new Date(this.newSession.startDate).toISOString().split('T')[0],
          endDate: new Date(this.newSession.endDate).toISOString().split('T')[0],
          programId: parseInt(this.newSession.programId),
          courses: (this.newSession.coursesWithTeachers || []).map(item => {
            if (!item.courseId) {
              throw new Error(`Course ${item.courseCode} not found`);
            }
            return {
              courseId: parseInt(item.courseId),
              teacherId: item.teacherId ? parseInt(item.teacherId) : null
            };
          })
        };

        console.log('Creating session with data:', sessionData);

        const response = await fetch('http://localhost:3000/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create session: ${errorText}`);
        }

        this.showToast(`Session ${this.newSession.number} created successfully!`, 'success');
        this.showCreateSessionModal = false;

        // Reset form
        this.newSession = {
          number: null,
          startDate: '',
          endDate: '',
          programId: '',
          coursesWithTeachers: []
        };
        this.tempSubject = '';
        this.validationError = '';

      } catch (error) {
        console.error('Error creating session:', error);
        this.showToast(error.message || 'Failed to create session', 'error');
      }
    },

    showToast(message, type = 'success') {
      this.toast.message = message;
      this.toast.type = type;
      this.toast.show = true;
      setTimeout(() => { this.toast.show = false; }, 3000);
    },

    async addToActiveSession(subject) {
      if (!subject || !subject.id) {
        this.showToast('Invalid course selected', 'error');
        return;
      }

      // SIEMPRE abrir modal de selección de sesión
      await this.openSessionSelectionModal(subject, false);
    },

    async createGroupTwo(subject, programId) {
      // Cerrar el modal de "missing students" si está abierto
      this.selectedCourse = null;

      // Abrir modal de selección de sesión
      await this.openSessionSelectionModal(subject, true); // true = crear nuevo grupo
    },

    clearFilters() {
      this.filters = { program: 'all', session: 'all', occupancy: 'all', prerequisites: 'all' };
      this.courses = [...this.allCourses];
      this.message = '';
    },

    applyFilters() {
      let filtered = [...this.allCourses];

      // Filter by Program (exact match with real program names)
      if (this.filters.program !== 'all') {
        filtered = filtered.filter(c => c.program === this.filters.program);
      }

      // Filter by Session (exact match with real session names)
      if (this.filters.session !== 'all') {
        filtered = filtered.filter(c => c.session === this.filters.session);
      }

      // Filter by Occupancy/Demand Level (based on missingPercent)
      if (this.filters.occupancy !== 'all') {
        filtered = filtered.filter(c => {
          const perc = c.missingPercent;
          switch (this.filters.occupancy) {
            case 'critical': return perc >= 75;
            case 'low': return perc >= 40 && perc < 75;
            case 'optimal': return perc >= 10 && perc < 40;
            case 'full': return perc < 10;
            default: return true;
          }
        });
      }

      // Filter by Prerequisites
      if (this.filters.prerequisites !== 'all') {
        filtered = filtered.filter(c => {
          const hasPrereqs = c.prerequisites && c.prerequisites.length > 0;
          return (this.filters.prerequisites === 'yes') ? hasPrereqs : !hasPrereqs;
        });
      }

      this.courses = filtered;
      this.showFilters = false;
      this.message = `${filtered.length} course${filtered.length !== 1 ? 's' : ''} found`;

      console.log('🔍 Applied filters:', this.filters);
      console.log('📊 Filtered results:', filtered.length);
    },

    // Método para formatear fechas
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    },

    // Método para abrir modal de selección de sesión
    async openSessionSelectionModal(subject, isCreatingNewGroup = false) {
      this.selectedCourseForSession = subject;
      this.isCreatingNewGroup = isCreatingNewGroup;
      this.showSelectSessionModal = true;
      this.loadingSessions = true;

      try {
        // Obtener el programId del curso
        const programId = subject.programIds && subject.programIds.length > 0
          ? subject.programIds[0]
          : null;

        if (!programId) {
          this.showToast('Course has no associated program', 'error');
          this.loadingSessions = false;
          return;
        }

        // Obtener sesiones activas del mismo programa
        const response = await fetch(`http://localhost:3000/api/sessions`);
        const allSessions = await response.json();

        // Filtrar sesiones activas del mismo programa
        const now = new Date();
        this.availableSessions = allSessions
          .filter(s =>
            s.programId === programId &&
            new Date(s.endDate) > now
          )
          .map(s => ({
            ...s,
            courseCount: s.subjects ? s.subjects.length : 0
          }));

        console.log('Available sessions:', this.availableSessions);

      } catch (error) {
        console.error('Error loading sessions:', error);
        this.showToast('Failed to load sessions', 'error');
      } finally {
        this.loadingSessions = false;
      }
    },

    // Método para seleccionar sesión y agregar curso
    async selectSessionForCourse(session) {
      if (!this.selectedCourseForSession) return;

      try {
        let response;

        if (this.isCreatingNewGroup) {
          // Crear un nuevo grupo
          response = await fetch(
            'http://localhost:3000/api/enrollment-automation/add-to-session',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                courseId: parseInt(this.selectedCourseForSession.id),
                programId: session.programId,
                createNewGroup: true
              })
            }
          );

          const result = await response.json();

          if (response.ok && result.success) {
            // Cerrar modal de selección de sesión
            this.showSelectSessionModal = false;

            // Guardar información del grupo para asignar profesor
            this.selectedGroupForTeacher = {
              offeringId: result.offeringId,
              sessionId: result.sessionId,
              sessionName: session.sessionName,
              courseCode: this.selectedCourseForSession.code,
              groupNumber: result.groupNumber
            };

            // Abrir modal de asignación de profesor
            this.selectedTeacherId = '';
            this.showTeacherAssignmentModal = true;
          } else {
            throw new Error(result.message || 'Failed to create group');
          }
        } else {
          // Agregar curso a la sesión (primer grupo) - MOSTRAR MODAL DE PROFESOR
          response = await fetch(
            `http://localhost:3000/api/sessions/${session.id}/courses`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                courseId: parseInt(this.selectedCourseForSession.id),
                maxStudents: 50
              })
            }
          );
          const result = await response.json();
          if (response.ok) {
            // Cerrar modal de selección
            this.showSelectSessionModal = false;
            // Preparar datos para modal de profesor
            this.selectedGroupForTeacher = {
              offeringId: result.offeringId || result.id,
              sessionId: session.id,
              sessionName: session.sessionName,
              courseCode: this.selectedCourseForSession.code,
              groupNumber: 1  // Primer grupo
            };
            // Abrir modal de asignación de profesor
            this.selectedTeacherId = '';
            this.showTeacherAssignmentModal = true;
          } else {
            throw new Error(result.message || 'Failed to add course');
          }
        }

      } catch (error) {
        console.error('Error:', error);
        this.showToast(error.message || 'Failed to process request', 'error');
      }
    },

    // Método para crear nueva sesión desde el modal
    async createNewSessionForCourse() {
      this.showSelectSessionModal = false;

      // Preparar template con el curso seleccionado
      this.newSessionTemplate = {
        id: this.selectedCourseForSession.id,
        code: this.selectedCourseForSession.code,
        name: this.selectedCourseForSession.name
      };

      this.openCreateSessionModal();
    },

    // Método para asignar profesor al grupo recién creado
    async assignTeacherToGroup() {
      if (!this.selectedTeacherId) {
        this.showToast('Please select a teacher', 'error');
        return;
      }

      if (!this.selectedGroupForTeacher) {
        this.showToast('No group information available', 'error');
        return;
      }

      try {
        // Actualizar el offering con el teacherId
        const response = await fetch(
          `http://localhost:3000/api/sessions/${this.selectedGroupForTeacher.sessionId}/offerings/${this.selectedGroupForTeacher.offeringId}/teacher`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teacherId: parseInt(this.selectedTeacherId)
            })
          }
        );

        if (response.ok) {
          const groupName = this.selectedGroupForTeacher.groupNumber > 1
            ? `${this.selectedGroupForTeacher.courseCode}-${this.selectedGroupForTeacher.groupNumber}`
            : this.selectedGroupForTeacher.courseCode;

          this.showToast(
            `Group ${groupName} created and teacher assigned successfully!`,
            'success'
          );

          // Cerrar modal
          this.showTeacherAssignmentModal = false;
          this.selectedGroupForTeacher = null;
          this.selectedTeacherId = '';
          this.isCreatingNewGroup = false;
          this.selectedCourse = null;

          // Recargar cursos
          await this.fetchCourses();
          this.courses = [...this.allCourses];
        } else {
          const error = await response.json();
          throw new Error(error.message || 'Failed to assign teacher');
        }
      } catch (error) {
        console.error('Error assigning teacher:', error);
        this.showToast(error.message || 'Failed to assign teacher', 'error');
      }
    },


  }
}
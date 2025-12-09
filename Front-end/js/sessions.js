/////////////////////////////////////////////////////
// Apartado de Sesiones - CRUD Completo con Backend

function dashboard() {
  return {
    open: false,
    showFilters: false,
    currentSessionId: null,
    showTeacherAssignmentModal: false,
    selectedGroupForTeacher: null,
    selectedTeacherId: '',
    showEnrollmentOptionsModal: false,
    enrollmentOption: 'current', // 'current', 'all', 'distribute'
    pendingEnrollmentData: null,
    searchQuery: '',
    message: '',
    openModalFlag: false,
    modalType: '',
    selectedSession: {},
    validationError: '',
    editWarning: '',
    isEditLocked: false,
    notifications: [],
    showDeleteModal: false,
    showSubjectsModal: false,
    tempSubject: '',
    showAddStudentModal: false,
    availableStudents: [],
    loadingStudents: false,
    studentSearchTerm: '',
    subjectsView: 'list',
    selectedSubject: null,
    subjectSearchTerm: '',
    availableCourses: [],
    allPrograms: [],
    allTeachers: [],
    showAutoEnrollModalFlag: false,
    autoEnrollData: null,

    getTeacherName(teacherId) {
      if (!teacherId) return 'TBD';
      const teacher = this.allTeachers.find(t => t.id === parseInt(teacherId));
      return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'TBD';
    },

    get filteredSubjectNames() {
      if (!this.selectedSession.programId) {
        return [];
      }

      const coursesForProgram = this.availableCourses
        .filter(course => {
          if (course.programIds && Array.isArray(course.programIds)) {
            return course.programIds.includes(parseInt(this.selectedSession.programId));
          }
          return false;
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
            name: course.name
          });
        }
      }

      return uniqueCourses;
    },

    get availableSubjects() {
      if (!this.selectedSession.coursesWithTeachers) {
        return this.filteredSubjectNames;
      }

      const assignedCodes = this.selectedSession.coursesWithTeachers.map(
        item => item.courseCode
      );

      return this.filteredSubjectNames.filter(
        course => !assignedCodes.includes(course.code)
      );
    },

    get filteredAvailableStudents() {
      if (!this.studentSearchTerm) return this.availableStudents;
      const term = this.studentSearchTerm.toLowerCase();
      return this.availableStudents.filter(student =>
        student.name.toLowerCase().includes(term) ||
        student.matricula.toLowerCase().includes(term) ||
        (student.email && student.email.toLowerCase().includes(term))
      );
    },

    get filteredSubjects() {
      if (!this.subjectSearchTerm) return this.allSubjects;
      const term = this.subjectSearchTerm.toLowerCase();
      return this.allSubjects.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.code.toLowerCase().includes(term) ||
        s.teacher.toLowerCase().includes(term)
      );
    },

    get filteredStudents() {
      if (!this.selectedSubject) return [];
      if (!this.subjectSearchTerm) return this.selectedSubject.students;
      const term = this.subjectSearchTerm.toLowerCase();
      return this.selectedSubject.students.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.matricula.toLowerCase().includes(term)
      );
    },

    allSubjects: [],

    filters: {
      program: 'all',
      session: 'all',
      month: 'all',
      occupancy: 'all',
      subject: 'all',
      activeSessions: false,
      lowEnrollment: false
    },

    allSessions: [],
    sessions: [],

    async loadTeachers() {
      try {
        const response = await fetch('http://localhost:3000/teachers');
        if (!response.ok) throw new Error('Failed to load teachers');
        this.allTeachers = await response.json();
        console.log('Teachers loaded:', this.allTeachers);
      } catch (error) {
        console.error('Error loading teachers:', error);
        this.showNotification('error', 'Error', 'Failed to load teachers');
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
        this.showNotification('error', 'Error', 'Failed to load programs');
      }
    },

    async loadAllCourses() {
      try {
        const response = await fetch('http://localhost:3000/api/courses');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const courses = await response.json();
        this.availableCourses = courses;
        console.log('Courses loaded successfully:', this.availableCourses);
      } catch (error) {
        console.error('Error loading courses:', error);
        this.showNotification('error', 'Error', `Failed to load courses: ${error.message}`);
        this.availableCourses = [];
      }
    },

    async loadSessions() {
      try {
        const response = await fetch('http://localhost:3000/api/sessions');
        if (!response.ok) throw new Error('Failed to load sessions');
        const sessionsData = await response.json();

        this.allSessions = sessionsData.map(session => ({
          ...session,
          chartId: `chart-${session.id}`,
          subject: session.subjects && session.subjects.length > 0 ? session.subjects.join(', ') : 'No courses assigned'
        }));
        this.sessions = [...this.allSessions];

        console.log('Sessions loaded:', this.sessions);

        this.$nextTick(() => {
          this.sessions.forEach(session => {
            this.initChart(document, session.progress || session.occupancy || 0, session.chartId);
          });
        });
      } catch (error) {
        console.error('Error loading sessions:', error);
        this.showNotification('error', 'Error', 'Failed to load sessions');
      }
    },

    async loadSessionCourses(sessionId) {
      try {
        const response = await fetch(`http://localhost:3000/api/sessions/${sessionId}/courses`);
        if (!response.ok) throw new Error('Failed to load session courses');
        this.allSubjects = await response.json();
        console.log('Session courses loaded:', this.allSubjects);
      } catch (error) {
        console.error('Error loading session courses:', error);
        this.showNotification('error', 'Error', 'Failed to load session courses');
      }
    },

    showNotification(type, title, message) {
      const id = Date.now();
      const notification = { id, type, title, message, show: true };
      this.notifications.push(notification);
      setTimeout(() => this.removeNotification(id), 5000);
    },

    removeNotification(id) {
      const index = this.notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        this.notifications[index].show = false;
        setTimeout(() => this.notifications.splice(index, 1), 300);
      }
    },

    validateSession() {
      this.validationError = '';

      if (!this.selectedSession.programId) {
        this.validationError = 'Please select a program';
        return false;
      }

      if (!this.selectedSession.startDate) {
        this.validationError = 'Please select a start date';
        return false;
      }

      if (!this.selectedSession.endDate) {
        this.validationError = 'Please select an end date';
        return false;
      }

      if (!this.selectedSession.coursesWithTeachers || this.selectedSession.coursesWithTeachers.length === 0) {
        this.validationError = 'Please select at least one subject';
        return false;
      }

      // Validar que todas las materias tengan profesor
      const missingTeacher = this.selectedSession.coursesWithTeachers.some(
        item => !item.teacherId
      );

      if (missingTeacher) {
        this.validationError = 'All subjects must have an assigned professor';
        return false;
      }

      return true;
    },

    checkEditLock(sessionDate) {
      if (!sessionDate) return false;

      // Obtener fecha de hoy en tu zona horaria local
      const today = new Date();
      const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Parsear la fecha de la sesión como YYYY-MM-DD local (no UTC)
      const [year, month, day] = sessionDate.split('-').map(Number);
      const sessionDateLocal = new Date(year, month - 1, day); // mes es 0-indexed

      // Calcular diferencia en días
      const diffTime = sessionDateLocal.getTime() - todayLocal.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      console.log('Edit lock check:', {
        today: `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`,
        sessionDate: sessionDate,
        todayTimestamp: todayLocal.getTime(),
        sessionTimestamp: sessionDateLocal.getTime(),
        diffDays: diffDays,
        isLocked: diffDays < 7
      });

      // Bloquear si la sesión empieza en menos de 7 días
      return diffDays < 7;
    },

    clearFilters() {
      this.filters = {
        program: 'all',
        session: 'all',
        month: 'all',
        occupancy: 'all',
        subject: 'all',
        activeSessions: false,
        lowEnrollment: false
      };
      this.sessions = [...this.allSessions];
      this.message = '';
    },

    applyFilters() {
      let filtered = [...this.allSessions];

      if (this.filters.program !== 'all') {
        const programName = this.filters.program === 'bachelor' ? "Bachelor's" : 'Associate';
        filtered = filtered.filter(s => s.program === programName);
      }

      if (this.filters.month !== 'all') {
        filtered = filtered.filter(s => s.month === this.filters.month);
      }

      if (this.filters.occupancy !== 'all') {
        filtered = filtered.filter(s => {
          switch (this.filters.occupancy) {
            case 'critical': return s.occupancy < 40;
            case 'low': return s.occupancy >= 40 && s.occupancy < 60;
            case 'optimal': return s.occupancy >= 60 && s.occupancy < 90;
            case 'full': return s.occupancy >= 90;
            default: return true;
          }
        });
      }

      if (this.filters.subject !== 'all') {
        filtered = filtered.filter(s => s.subject.includes(this.filters.subject));
      }

      if (this.filters.session !== 'all') {
        const sessionNumber = parseInt(this.filters.session.replace('session', ''));
        filtered = filtered.filter(s => s.number === sessionNumber);
      }

      this.sessions = filtered;
      this.showFilters = false;

      const activeFilters = [];
      if (this.filters.program !== 'all') activeFilters.push('Program');
      if (this.filters.month !== 'all') activeFilters.push('Month');
      if (this.filters.occupancy !== 'all') activeFilters.push('Occupancy');
      if (this.filters.subject !== 'all') activeFilters.push('Subject');
      if (this.filters.session !== 'all') activeFilters.push('Session');

      if (activeFilters.length > 0) {
        this.message = `Filters applied: ${activeFilters.join(', ')} | Showing ${this.sessions.length} session(s)`;
      } else {
        this.message = '';
      }
    },

    async init() {
      console.log('Session.js init() called');

      try {
        await this.loadPrograms();
        console.log('Programs loaded:', this.allPrograms.length);

        await this.loadAllCourses();
        console.log('Courses loaded:', this.availableCourses.length);

        await this.loadTeachers();
        console.log('Teachers loaded:', this.allTeachers.length);

        await this.loadSessions();
        console.log('Sessions loaded:', this.sessions.length);

        console.log('Init completed successfully');
      } catch (error) {
        console.error('Error during initialization:', error);
        this.showNotification('error', 'Error', 'Failed to initialize dashboard');
      }
    },

    async openModal(session = {}, type = 'add') {
      this.modalType = type;
      this.validationError = '';
      this.editWarning = '';
      this.isEditLocked = false;

      if (type === 'add') {
        const today = new Date();
        const fiveWeeksLater = new Date(today);
        fiveWeeksLater.setDate(fiveWeeksLater.getDate() + 35);

        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const nextNumber = this.allSessions.length > 0
          ? Math.max(...this.allSessions.map(s => s.number || 0)) + 1
          : 1;

        this.selectedSession = {
          id: 'Auto-generated',
          number: nextNumber,
          sessionName: `Session ${nextNumber}`,
          startDate: formatDate(today),
          endDate: formatDate(fiveWeeksLater),
          programId: '',
          program: '',
          coursesWithTeachers: []
        };

        this.openModalFlag = true;
      } else {
        try {
          console.log('Loading session details for ID:', session.id);

          const response = await fetch(`http://localhost:3000/api/sessions/${session.id}`);
          if (!response.ok) throw new Error('Failed to load session details');

          const sessionData = await response.json();
          console.log('Session data from backend:', sessionData);

          // Cargar offerings con sus profesores y groupNumber
          const coursesWithTeachers = sessionData.offerings
            ? sessionData.offerings.map(off => ({
              courseId: off.courseId,
              courseCode: off.courseCode,
              groupNumber: off.groupNumber || 1,
              displayCode: off.groupNumber > 1
                ? `${off.courseCode}-${off.groupNumber}`
                : off.courseCode,
              teacherId: off.teacherId ? off.teacherId.toString() : '',
              teacherName: off.teacher ? `${off.teacher.firstName} ${off.teacher.lastName}` : 'TBD'
            }))
            : [];

          this.selectedSession = {
            id: sessionData.id,
            number: session.number,
            sessionName: sessionData.sessionName,
            startDate: sessionData.startDate,
            endDate: sessionData.endDate,
            programId: sessionData.programId.toString(),
            program: sessionData.program,
            coursesWithTeachers: coursesWithTeachers
          };

          console.log('Selected session prepared:', this.selectedSession);

          // Cargar los cursos de la sesión
          if (type !== 'add') {
            await this.loadSessionCourses(session.id);
          }

          // Verificar bloqueo de edición SOLO si es modo EDIT
          if (type === 'edit') {
            console.log('Checking edit lock for date:', this.selectedSession.startDate);
            const isLocked = this.checkEditLock(this.selectedSession.startDate);

            if (isLocked) {
              this.isEditLocked = true;
              this.editWarning = 'This session starts in less than 7 days and cannot be edited';
            }
          }

          this.openModalFlag = true;

        } catch (error) {
          console.error('Error loading session:', error);
          this.showNotification('error', 'Error', 'Failed to load session details');
          return;
        }
      }
    },

    async saveSession() {
      if (!this.validateSession()) {
        this.showNotification('error', 'Validation Error', this.validationError);
        return;
      }

      console.log('Validating data:', {
        coursesWithTeachers: this.selectedSession.coursesWithTeachers,
        programId: this.selectedSession.programId
      });

      try {
        const sessionData = {
          sessionName: this.selectedSession.sessionName || `Session ${this.selectedSession.number}`,
          startDate: new Date(this.selectedSession.startDate).toISOString().split('T')[0],
          endDate: new Date(this.selectedSession.endDate).toISOString().split('T')[0],
          programId: parseInt(this.selectedSession.programId),
          courses: (this.selectedSession.coursesWithTeachers || []).map(item => {
            if (!item.courseId) {
              throw new Error(`Course ${item.courseCode} not found`);
            }
            return {
              courseId: parseInt(item.courseId),
              teacherId: item.teacherId ? parseInt(item.teacherId) : null
            };
          })
        };

        console.log('Saving session with data:', sessionData);

        let response;
        if (this.modalType === 'add') {
          response = await fetch('http://localhost:3000/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionData)
          });
        } else {
          response = await fetch(`http://localhost:3000/api/sessions/${this.selectedSession.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionData)
          });
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save session: ${errorText}`);
        }

        this.showNotification('success',
          this.modalType === 'add' ? 'Session Created' : 'Session Updated',
          `Session has been ${this.modalType === 'add' ? 'created' : 'updated'} successfully`
        );

        this.closeModal();
        await this.loadSessions();

      } catch (error) {
        console.error('Error saving session:', error);
        this.showNotification('error', 'Error', error.message || 'Failed to save session');
      }
    },

    requestDelete() {
      this.showDeleteModal = true;
    },

    async confirmDelete() {
      try {
        const response = await fetch(`http://localhost:3000/api/sessions/${this.selectedSession.id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to delete session');
        }

        const result = await response.json();

        // Mostrar notificación con información de estudiantes removidos
        if (result.studentsRemoved > 0) {
          this.showNotification('success', 'Session Deleted',
            `Session ${this.selectedSession.number} and ${result.studentsRemoved} student enrollment(s) have been deleted successfully`);
        } else {
          this.showNotification('success', 'Session Deleted',
            `Session ${this.selectedSession.number} has been deleted successfully`);
        }

        this.closeModal();
        await this.loadSessions();

      } catch (error) {
        console.error('Error deleting session:', error);
        this.showNotification('error', 'Error', error.message || 'Failed to delete session');
        this.showDeleteModal = false;
      }
    },

    async requestDelete() {
      // Verificar si hay estudiantes inscritos
      try {
        const response = await fetch(`http://localhost:3000/api/sessions/${this.selectedSession.id}/courses`);
        if (response.ok) {
          const courses = await response.json();
          const totalStudents = courses.reduce((sum, course) => sum + course.currentEnrollment, 0);

          if (totalStudents > 0) {
            // Hay estudiantes, mostrar advertencia especial
            if (!confirm(`⚠️ WARNING: This session has ${totalStudents} student(s) enrolled.\n\nDeleting this session will also remove ALL student enrollments.\n\nAre you sure you want to continue?`)) {
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error checking enrollments:', error);
      }

      this.showDeleteModal = true;
    },

    closeModal() {
      this.openModalFlag = false;
      this.showDeleteModal = false;
      this.validationError = '';
      this.editWarning = '';
      this.isEditLocked = false;
      this.selectedSession = {};
    },

    initChart(el, progress, id) {
      setTimeout(() => {
        const ctx = document.getElementById(id);
        if (ctx) {
          let chartColor;
          if (progress < 40) {
            chartColor = '#252121';
          } else if (progress >= 40 && progress < 60) {
            chartColor = '#F69A1C';
          } else if (progress >= 60 && progress < 90) {
            chartColor = '#A6192E';
          } else {
            chartColor = '#D41736';
          }

          if (ctx.chart) {
            ctx.chart.destroy();
          }

          ctx.chart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
              datasets: [{
                data: [progress, 100 - progress],
                backgroundColor: [chartColor, '#e5e7eb'],
                borderWidth: 0,
                borderRadius: 6,
                cutout: '75%'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: { legend: { display: false }, tooltip: { enabled: false } },
              animation: { animateRotate: true, duration: 1000, easing: 'easeOutQuart' }
            }
          });
        }
      }, 100);
    },

    async openSubjectsModal() {
      if (this.selectedSession.id && this.selectedSession.id !== 'Auto-generated') {
        this.currentSessionId = this.selectedSession.id;
        await this.loadSessionCourses(this.currentSessionId);
      }
      this.showSubjectsModal = true;
      this.subjectsView = 'list';
      this.selectedSubject = null;
      this.subjectSearchTerm = '';
    },

    closeSubjectsModal() {
      this.showSubjectsModal = false;
      this.subjectsView = 'list';
      this.selectedSubject = null;
      this.subjectSearchTerm = '';
    },

    viewStudents(subject) {
      this.selectedSubject = subject;
      this.subjectsView = 'students';
      this.subjectSearchTerm = '';
      this.currentOfferingId = subject.offeringId;
    },

    backToSubjects() {
      this.subjectsView = 'list';
      this.selectedSubject = null;
      this.subjectSearchTerm = '';
    },

    async autoEnrollStudents(subject) {
      if (!subject || !subject.id) {
        this.showNotification('error', 'Invalid Subject', 'Please select a valid course');
        return;
      }

      if (!this.currentSessionId) {
        this.showNotification('error', 'No Session Selected', 'Please open a session first');
        return;
      }

      const courseId = parseInt(subject.id);
      const sessionId = this.currentSessionId;
      const groupNumber = subject.groupNumber || 1;
      const offeringId = subject.offeringId;

      try {
        // 1. Obtener TODOS los grupos de este curso en esta sesión
        const allGroupsRes = await fetch(`http://localhost:3000/api/sessions/${sessionId}/courses`);
        const allCourses = await allGroupsRes.json();
        const allGroupsForCourse = allCourses.filter(c => c.id === courseId);

        // 2. Obtener IDs de TODOS los estudiantes ya inscritos en CUALQUIER grupo
        const enrolledStudentIds = new Set();
        allGroupsForCourse.forEach(group => {
          group.students.forEach(s => enrolledStudentIds.add(s.id.toString()));
        });

        // 3. Obtener análisis de demanda TOTAL
        const analysisRes = await fetch('http://localhost:3000/api/enrollment-automation/analyze');
        if (!analysisRes.ok) {
          throw new Error('Failed to get enrollment preview');
        }

        const allAnalyses = await analysisRes.json();
        const courseAnalysis = allAnalyses.find(a => a.courseId === courseId);

        // 4. Filtrar estudiantes que NO están inscritos en NINGÚN grupo
        let eligibleStudents = [];
        if (courseAnalysis && courseAnalysis.eligibleStudents) {
          eligibleStudents = courseAnalysis.eligibleStudents.filter(
            student => !enrolledStudentIds.has(student.studentId.toString())
          );
        }

        // 5. Verificar capacidad SOLO del grupo actual
        const currentEnrolled = subject.students?.length || 0;
        const maxCapacity = parseInt(subject.maxStudents) || 50;
        const availableSeats = Math.max(0, maxCapacity - currentEnrolled);

        console.log('Auto-enroll metrics:', {
          courseId,
          groupNumber,
          totalEligible: eligibleStudents.length,
          enrolledInAllGroups: enrolledStudentIds.size,
          currentGroupEnrolled: currentEnrolled,
          currentGroupCapacity: maxCapacity,
          currentGroupAvailable: availableSeats
        });

        if (availableSeats <= 0) {
          this.showNotification('error', 'Course Full', 'This group is at maximum capacity. Please create another group.');
          return;
        }

        // 6. Determinar cuántos estudiantes inscribir en ESTE grupo
        const studentsToEnroll = Math.min(eligibleStudents.length, availableSeats);

        // 7. Obtener lista de estudiantes que serán inscritos
        const studentsPreview = eligibleStudents.slice(0, studentsToEnroll);

        // 8. Mostrar modal con información correcta
        this.showAutoEnrollModal(subject, studentsPreview, {
          totalEligible: eligibleStudents.length, // Estudiantes que AÚN no están en ningún grupo
          availableSeats: availableSeats, // Capacidad solo de este grupo
          toEnroll: studentsToEnroll, // Cantidad a inscribir en este grupo
          sessionId: sessionId,
          courseId: courseId,
          groupNumber: groupNumber,
          offeringId: offeringId,
          currentEnrolled: currentEnrolled, // Inscritos en este grupo
          maxCapacity: maxCapacity, // Capacidad de este grupo
          totalEnrolledAllGroups: enrolledStudentIds.size, // Total inscritos en todos los grupos
          allGroups: allGroupsForCourse // Todos los grupos disponibles
        });

      } catch (error) {
        console.error('Error in auto-enrollment:', error);
        this.showNotification('error', 'Auto-Enrollment Error', error.message || 'Failed to load enrollment preview');
      }
    },

    async createGroupTwoForCourse(subject) {
      // Aquí puedes redirigir a subjects o crear el grupo directamente
      this.showNotification('info', 'Coming Soon', 'Group 2 creation will redirect to Subjects page');
      // TODO: Implementar creación de Grupo 2
    },

    async deleteStudent(enrollmentId) {
      if (!confirm('Are you sure you want to remove this student from the course?')) {
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/api/sessions/enrollments/${enrollmentId}`,
          { method: 'DELETE' }
        );

        if (!response.ok) throw new Error('Failed to remove student');

        this.showNotification('success', 'Student Removed', 'Student removed successfully');

        if (this.currentSessionId) {
          await this.loadSessionCourses(this.currentSessionId);

          const updatedSubject = this.allSubjects.find(s => s.offeringId === this.currentOfferingId);
          if (updatedSubject) {
            this.selectedSubject = updatedSubject;
          }
        }
        // Recargar sesiones para actualizar el porcentaje
        await this.loadSessions();

      } catch (error) {
        console.error('Error removing student:', error);
        this.showNotification('error', 'Error', 'Failed to remove student');
      }
    },

    addCourseWithTeacher() {
      if (!this.tempSubject) return;

      if (!this.selectedSession.coursesWithTeachers) {
        this.selectedSession.coursesWithTeachers = [];
      }

      // Verificar que no exista ya
      const exists = this.selectedSession.coursesWithTeachers.some(
        item => item.courseCode === this.tempSubject
      );

      if (!exists) {
        // Buscar el curso en availableCourses
        const course = this.availableCourses.find(c => c.code === this.tempSubject);

        this.selectedSession.coursesWithTeachers.push({
          courseId: course ? parseInt(course.id) : null,
          courseCode: this.tempSubject,
          teacherId: '',
          teacherName: ''
        });
      }

      this.tempSubject = '';
    },

    removeCourseWithTeacher(index) {
      if (this.selectedSession.coursesWithTeachers) {
        this.selectedSession.coursesWithTeachers.splice(index, 1);
      }
    },

    async openAddStudentModal() {
      if (!this.currentSessionId) {
        this.showNotification('error', 'Error', 'No session selected');
        return;
      }

      if (!this.selectedSubject || !this.selectedSubject.id) {
        this.showNotification('error', 'Error', 'No subject selected');
        return;
      }

      console.log('Opening add student modal for:', {
        sessionId: this.currentSessionId,
        courseId: this.selectedSubject.id,
        subject: this.selectedSubject
      });

      this.showAddStudentModal = true;
      this.studentSearchTerm = '';
      this.loadingStudents = true;

      try {
        const response = await fetch(
          `http://localhost:3000/api/sessions/${this.currentSessionId}/courses/${this.selectedSubject.id}/available-students`
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', errorText);
          throw new Error(`Failed to fetch available students: ${errorText}`);
        }

        this.availableStudents = await response.json();
        console.log('Available students loaded:', this.availableStudents);
      } catch (error) {
        console.error('Error loading available students:', error);
        this.showNotification('error', 'Error', 'Failed to load available students');
        this.availableStudents = [];
      } finally {
        this.loadingStudents = false;
      }
    },

    closeAddStudentModal() {
      this.showAddStudentModal = false;
      this.availableStudents = [];
      this.studentSearchTerm = '';
    },

    async addStudentToCourse(studentId) {
      try {
        const response = await fetch(
          `http://localhost:3000/api/sessions/${this.currentSessionId}/courses/${this.selectedSubject.id}/students`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: studentId })
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to add student');
        }

        this.showNotification('success', 'Success', 'Student added successfully');

        await this.loadSessionCourses(this.currentSessionId);

        const updatedSubject = this.allSubjects.find(s => s.offeringId === this.currentOfferingId);
        if (updatedSubject) {
          this.selectedSubject = updatedSubject;
        }

        this.availableStudents = this.availableStudents.filter(s => s.id !== studentId);
        // Recargar sesiones para actualizar el porcentaje
        await this.loadSessions();

      } catch (error) {
        console.error('Error adding student:', error);
        this.showNotification('error', 'Error', error.message);
      }
    },

    async sendNotifications(sessionId) {
      if (!confirm('Send enrollment notifications to all students in this session?')) {
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/api/sessions/${sessionId}/send-notifications`,
          { method: 'POST' }
        );

        if (!response.ok) throw new Error('Failed to send notifications');

        const result = await response.json();

        this.showNotification('success', 'Notifications Sent',
          `Successfully sent ${result.emailsSent} email(s)`);
      } catch (error) {
        console.error('Error sending notifications:', error);
        this.showNotification('error', 'Error', 'Failed to send notifications');
      }
    },

    showAutoEnrollModal(subject, students, metadata) {
      this.autoEnrollData = {
        subject: subject,
        students: students,
        metadata: metadata,
        searchTerm: ''
      };
      this.showAutoEnrollModalFlag = true;
    },

    closeAutoEnrollModal() {
      this.showAutoEnrollModalFlag = false;
      this.autoEnrollData = null;
    },

    get filteredAutoEnrollStudents() {
      if (!this.autoEnrollData || !this.autoEnrollData.searchTerm) {
        return this.autoEnrollData?.students || [];
      }
      const term = this.autoEnrollData.searchTerm.toLowerCase();
      return this.autoEnrollData.students.filter(s =>
        s.studentFirstName.toLowerCase().includes(term) ||
        s.studentLastName.toLowerCase().includes(term) ||
        s.studentNumber.toLowerCase().includes(term) ||
        s.reason.toLowerCase().includes(term)
      );
    },

    async executeAutoEnroll(option) {
      if (!this.pendingEnrollmentData && !this.autoEnrollData) {
        this.showNotification('error', 'Error', 'No enrollment data available');
        return;
      }

      const enrollData = this.pendingEnrollmentData || this.autoEnrollData;
      const { sessionId, courseId, toEnroll, offeringId, groupNumber } = enrollData.metadata;

      this.showNotification('info', 'Processing...', `Enrolling students. Please wait...`);

      // Cerrar modales
      this.showEnrollmentOptionsModal = false;
      this.closeAutoEnrollModal();

      try {
        let result;

        switch (option) {
          case 'current':
            // Opción 1: Llenar solo el grupo actual
            result = await this.enrollInCurrentGroup(enrollData);
            break;

          case 'all':
            // Opción 2: Llenar todos los grupos disponibles
            result = await this.enrollInAllGroups(enrollData);
            break;

          case 'distribute':
            // Opción 3: Distribuir equitativamente
            result = await this.enrollDistributed(enrollData);
            break;
        }

        if (result.success) {
          this.showNotification(
            'success',
            'Auto-Enrollment Complete',
            `Successfully enrolled ${result.enrolled} student(s)`
          );

          // Recargar y mantener el modal del grupo correcto
          setTimeout(async () => {
            try {
              await this.loadSessionCourses(this.currentSessionId);

              // Si estábamos en un grupo específico, mantener ese modal abierto
              if (offeringId && this.selectedSubject) {
                const updatedSubject = this.allSubjects.find(s => s.offeringId === offeringId);
                if (updatedSubject) {
                  this.selectedSubject = updatedSubject;
                  // Mantener la vista de estudiantes abierta
                  this.subjectsView = 'students';
                }
              }

              await this.loadSessions();
            } catch (error) {
              console.error('Error reloading data after enrollment:', error);
            }
          }, 1000);

          if (result.remaining > 0) {
            setTimeout(() => {
              this.showNotification(
                'warning',
                'Additional Capacity Needed',
                `${result.remaining} students still need this course. Consider creating another group.`
              );
            }, 2000);
          }
        } else {
          this.showNotification('error', 'Enrollment Failed', result.message || 'Unknown error');
        }

      } catch (error) {
        console.error('Error executing auto-enrollment:', error);
        this.showNotification('error', 'Auto-Enrollment Error', error.message || 'Failed to auto-enroll students');
      } finally {
        this.pendingEnrollmentData = null;
      }
    },

    async enrollInCurrentGroup(enrollData) {
      const { sessionId, courseId, offeringId, groupNumber, toEnroll } = enrollData.metadata;

      const response = await fetch('http://localhost:3000/api/enrollment-automation/auto-enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          courseId: courseId,
          offeringId: offeringId,
          groupNumber: groupNumber,
          maxStudents: toEnroll
        })
      });

      if (!response.ok) throw new Error('Failed to auto-enroll students');

      return await response.json();
    },

    async enrollInAllGroups(enrollData) {
      const { sessionId, courseId, totalEligible } = enrollData.metadata;

      try {
        // Obtener todos los grupos
        const coursesRes = await fetch(`http://localhost:3000/api/sessions/${sessionId}/courses`);
        const courses = await coursesRes.json();
        const existingGroups = courses.filter(c => c.id === parseInt(courseId));

        // Calcular capacidad total disponible
        let totalCapacity = 0;
        const groupsWithCapacity = [];

        for (const group of existingGroups) {
          const available = group.maxStudents - group.currentEnrollment;
          if (available > 0) {
            totalCapacity += available;
            groupsWithCapacity.push({
              offeringId: group.offeringId,
              groupNumber: group.groupNumber,
              availableSeats: available
            });
          }
        }

        const studentsToEnroll = Math.min(totalEligible, totalCapacity);

        console.log('Fill all groups:', {
          totalEligible,
          totalCapacity,
          studentsToEnroll,
          groups: groupsWithCapacity.length
        });

        // Llenar grupos secuencialmente
        let totalEnrolled = 0;
        let remainingStudents = studentsToEnroll;

        for (const group of groupsWithCapacity) {
          if (remainingStudents <= 0) break;

          const studentsForThisGroup = Math.min(remainingStudents, group.availableSeats);

          console.log(`Filling group ${group.groupNumber} with ${studentsForThisGroup} students`);

          const response = await fetch('http://localhost:3000/api/enrollment-automation/auto-enroll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sessionId,
              courseId: courseId,
              offeringId: group.offeringId,
              groupNumber: group.groupNumber,
              maxStudents: studentsForThisGroup
            })
          });

          if (!response.ok) {
            console.error(`Failed to enroll in group ${group.groupNumber}`);
            continue;
          }

          const result = await response.json();
          totalEnrolled += result.enrolled || 0;
          remainingStudents -= result.enrolled || 0;

          console.log(`Enrolled ${result.enrolled} in group ${group.groupNumber}, ${remainingStudents} remaining`);
        }

        return {
          success: true,
          enrolled: totalEnrolled,
          remaining: totalEligible - totalEnrolled
        };

      } catch (error) {
        console.error('Error filling all groups:', error);
        throw error;
      }
    },

    async enrollDistributed(enrollData) {
      const { sessionId, courseId, totalEligible } = enrollData.metadata;

      try {
        // 1. Obtener todos los grupos con capacidad disponible
        const coursesRes = await fetch(`http://localhost:3000/api/sessions/${sessionId}/courses`);
        const courses = await coursesRes.json();
        const existingGroups = courses.filter(c => c.id === parseInt(courseId));

        if (existingGroups.length === 0) {
          throw new Error('No groups found for this course');
        }

        // 2. Calcular capacidad disponible por grupo
        const groupsWithCapacity = existingGroups.map(group => ({
          offeringId: group.offeringId,
          groupNumber: group.groupNumber,
          currentEnrollment: group.currentEnrollment,
          maxStudents: group.maxStudents || 50,
          availableSeats: (group.maxStudents || 50) - group.currentEnrollment
        })).filter(g => g.availableSeats > 0);

        if (groupsWithCapacity.length === 0) {
          throw new Error('All groups are at full capacity');
        }

        console.log('Distribution plan:', {
          totalStudents: totalEligible,
          availableGroups: groupsWithCapacity.length,
          groupCapacities: groupsWithCapacity
        });

        // 3. Calcular distribución equitativa basada en TOTAL DE ESTUDIANTES ELEGIBLES
        const totalCapacity = groupsWithCapacity.reduce((sum, g) => sum + g.availableSeats, 0);
        const studentsToDistribute = Math.min(totalEligible, totalCapacity);

        // Dividir equitativamente entre grupos
        const baseStudentsPerGroup = Math.floor(studentsToDistribute / groupsWithCapacity.length);
        const remainder = studentsToDistribute % groupsWithCapacity.length;

        console.log('Distribution calculation:', {
          totalCapacity,
          studentsToDistribute,
          basePerGroup: baseStudentsPerGroup,
          remainder
        });

        // 4. Distribuir estudiantes
        let totalEnrolled = 0;

        for (let i = 0; i < groupsWithCapacity.length; i++) {
          const group = groupsWithCapacity[i];

          // Asignar base + 1 extra para los primeros grupos (para distribuir el remainder)
          let studentsForThisGroup = baseStudentsPerGroup;
          if (i < remainder) {
            studentsForThisGroup += 1;
          }

          // No exceder la capacidad del grupo
          studentsForThisGroup = Math.min(studentsForThisGroup, group.availableSeats);

          if (studentsForThisGroup <= 0) continue;

          console.log(`Enrolling ${studentsForThisGroup} students in group ${group.groupNumber}`);

          // Inscribir en este grupo específico
          const response = await fetch('http://localhost:3000/api/enrollment-automation/auto-enroll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sessionId,
              courseId: courseId,
              offeringId: group.offeringId,
              groupNumber: group.groupNumber,
              maxStudents: studentsForThisGroup
            })
          });

          if (!response.ok) {
            console.error(`Failed to enroll in group ${group.groupNumber}`);
            continue;
          }

          const result = await response.json();
          totalEnrolled += result.enrolled || 0;

          console.log(`Enrolled ${result.enrolled} in group ${group.groupNumber}`);
        }

        return {
          success: true,
          enrolled: totalEnrolled,
          remaining: totalEligible - totalEnrolled
        };

      } catch (error) {
        console.error('Error in distribute enrollment:', error);
        throw error;
      }
    },

    async confirmAutoEnroll() {
      if (!this.autoEnrollData || !this.autoEnrollData.metadata) {
        this.showNotification('error', 'Error', 'No enrollment data available');
        return;
      }

      if (!this.autoEnrollData.students || this.autoEnrollData.students.length === 0) {
        this.showNotification('info', 'No Students', 'There are no students to enroll');
        this.closeAutoEnrollModal();
        return;
      }

      const currentOfferingId = this.autoEnrollData.metadata.offeringId;
      const currentGroupNumber = this.autoEnrollData.metadata.groupNumber;

      // Verificar cuántos grupos existen para esta materia
      const { sessionId, courseId } = this.autoEnrollData.metadata;

      try {
        const coursesRes = await fetch(`http://localhost:3000/api/sessions/${sessionId}/courses`);
        const courses = await coursesRes.json();

        const existingGroups = courses.filter(c => c.id === parseInt(courseId));

        // Si hay más de un grupo, mostrar opciones
        if (existingGroups.length > 1) {
          this.pendingEnrollmentData = {
            ...this.autoEnrollData,
            existingGroups: existingGroups,
            currentOfferingId: currentOfferingId,
            currentGroupNumber: currentGroupNumber
          };

          this.closeAutoEnrollModal();
          this.showEnrollmentOptionsModal = true;
          this.enrollmentOption = 'current'; // Opción por defecto
        } else {
          // Solo hay un grupo, proceder directamente
          await this.executeAutoEnroll('current');
        }
      } catch (error) {
        console.error('Error checking groups:', error);
        this.showNotification('error', 'Error', 'Failed to check existing groups');
      }
    },

    // Método para crear Grupo 2 desde Auto-Enrollment
    async createGroupTwoFromAutoEnroll() {
      if (!this.autoEnrollData || !this.autoEnrollData.subject) {
        this.showNotification('error', 'Error', 'No subject selected');
        return;
      }

      const subject = this.autoEnrollData.subject;
      const sessionId = this.autoEnrollData.metadata.sessionId;
      const courseId = this.autoEnrollData.metadata.courseId;
      const maxCapacity = this.autoEnrollData.metadata.maxCapacity || 50;

      // Cerrar el modal de auto-enrollment
      this.closeAutoEnrollModal();

      try {
        // Obtener información de la sesión actual
        const sessionRes = await fetch(`http://localhost:3000/api/sessions/${sessionId}`);
        if (!sessionRes.ok) throw new Error('Failed to get session info');

        const sessionData = await sessionRes.json();

        // Obtener el número de grupo más alto existente
        const coursesRes = await fetch(`http://localhost:3000/api/sessions/${sessionId}/courses`);
        const courses = await coursesRes.json();

        const existingGroups = courses.filter(c => c.id === parseInt(courseId));
        const nextGroupNumber = existingGroups.length > 0
          ? Math.max(...existingGroups.map(g => g.groupNumber || 1)) + 1
          : 2;

        // GUARDAR INFORMACIÓN PARA CREAR EL GRUPO DESPUÉS
        this.selectedGroupForTeacher = {
          sessionId: sessionId,
          sessionName: sessionData.sessionName,
          courseCode: subject.code,
          courseId: courseId,
          programId: sessionData.programId,
          groupNumber: nextGroupNumber,
          maxCapacity: maxCapacity,
          isPendingCreation: true // Indicador de que aún no se ha creado
        };

        // Abrir modal de selección de profesor
        this.selectedTeacherId = '';
        this.showTeacherAssignmentModal = true;

        this.showNotification(
          'info',
          'Assign Teacher',
          `Please assign a teacher for Group ${nextGroupNumber}`
        );

      } catch (error) {
        console.error('Error preparing new group:', error);
        this.showNotification('error', 'Error', 'Failed to prepare new group');
      }
    },

    async assignTeacherToGroup() {
      if (!this.selectedTeacherId) {
        this.showNotification('error', 'Validation Error', 'Please select a teacher');
        return;
      }

      if (!this.selectedGroupForTeacher) {
        this.showNotification('error', 'Error', 'No group information available');
        return;
      }

      try {
        let offeringId = this.selectedGroupForTeacher.offeringId;

        // Si el grupo está pendiente de creación, crearlo primero
        if (this.selectedGroupForTeacher.isPendingCreation) {
          const createResponse = await fetch('http://localhost:3000/api/enrollment-automation/add-to-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courseId: parseInt(this.selectedGroupForTeacher.courseId),
              programId: this.selectedGroupForTeacher.programId,
              createNewGroup: true
            })
          });

          const createResult = await createResponse.json();

          if (!createResult.success) {
            throw new Error(createResult.message || 'Failed to create new group');
          }

          offeringId = createResult.offeringId;
          this.showNotification('success', 'Group Created', `Group ${createResult.groupNumber} has been created`);
        }

        // Ahora asignar el profesor al offering
        const response = await fetch(
          `http://localhost:3000/api/sessions/${this.selectedGroupForTeacher.sessionId}/offerings/${offeringId}/teacher`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teacherId: parseInt(this.selectedTeacherId)
            })
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to assign teacher');
        }

        const groupName = this.selectedGroupForTeacher.groupNumber > 1
          ? `${this.selectedGroupForTeacher.courseCode}-${this.selectedGroupForTeacher.groupNumber}`
          : this.selectedGroupForTeacher.courseCode;

        this.showNotification(
          'success',
          'Teacher Assigned',
          `Teacher assigned to ${groupName} successfully!`
        );

        // Cerrar modal
        this.showTeacherAssignmentModal = false;
        this.selectedGroupForTeacher = null;
        this.selectedTeacherId = '';

        // Recargar datos
        await this.loadSessions();

        if (this.currentSessionId) {
          await this.loadSessionCourses(this.currentSessionId);
        }

      } catch (error) {
        console.error('Error assigning teacher:', error);
        this.showNotification('error', 'Error', error.message || 'Failed to assign teacher');
      }
    },

  }
}
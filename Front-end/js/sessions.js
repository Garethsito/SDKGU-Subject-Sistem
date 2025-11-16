/////////////////////////////////////////////////////
// Apartado de Sesiones - CRUD Completo con Backend

function dashboard() {
  return {
    open: false,
    showFilters: false,
    currentSessionId: null,
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
    
    get filteredSubjectNames() {
      if (!this.selectedSession.programId) {
        return [];
      }
      return this.availableCourses
        .filter(course => course.programId === parseInt(this.selectedSession.programId))
        .map(course => ({
          code: course.courseCode,
          id: course.id,
          name: course.courseName
        }));
    },

    get availableSubjects() {
      if (!this.selectedSession.subjects) {
        return this.filteredSubjectNames;
      }
      return this.filteredSubjectNames.filter(course => 
        !this.selectedSession.subjects.includes(course.code)
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
        const response = await fetch('http://localhost:3000/api/teachers');
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
      
      if (!this.selectedSession.subjects || this.selectedSession.subjects.length === 0) {
        this.validationError = 'Please select at least one subject';
        return false;
      }
      
      if (!this.selectedSession.teacherId) {
        this.validationError = 'Please select a professor';
        return false;
      }
      
      return true;
    },
    
    checkEditLock(sessionDate) {
      if (!sessionDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sessionDateObj = new Date(sessionDate);
      const diffTime = sessionDateObj - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
          switch(this.filters.occupancy) {
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
      await this.loadPrograms();
      await this.loadAllCourses();
      await this.loadTeachers();
      await this.loadSessions();
      console.log('Init completed');
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
          subjects: [],
          subjectId: null,
          teacherId: '',
          professor: ''
        };
        
        this.openModalFlag = true;
      } else {
        try {
          console.log('Loading session details for ID:', session.id);
          
          const response = await fetch(`http://localhost:3000/api/sessions/${session.id}`);
          if (!response.ok) throw new Error('Failed to load session details');
          
          const sessionData = await response.json();
          console.log('Session data from backend:', sessionData);
          
          // Asignar los datos correctamente - SOLO UNA MATERIA
          this.selectedSession = {
            id: sessionData.id,
            number: session.number,
            sessionName: sessionData.sessionName,
            startDate: sessionData.startDate,
            endDate: sessionData.endDate,
            programId: sessionData.programId.toString(),
            program: sessionData.program,
            subjects: sessionData.subjects || [],
            teacherId: sessionData.teacherId ? sessionData.teacherId.toString() : '',
            professor: sessionData.professor || 'TBD'
          };
          
          console.log('Selected session prepared:', this.selectedSession);
          
          // Cargar los cursos de la sesión
          if (type !== 'add') {
            await this.loadSessionCourses(session.id);
          }
          
          if (type === 'edit' && this.checkEditLock(this.selectedSession.startDate)) {
            this.isEditLocked = true;
            this.editWarning = 'This session is less than 7 days away and cannot be edited';
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
        subjects: this.selectedSession.subjects,
        teacherId: this.selectedSession.teacherId,
        programId: this.selectedSession.programId
      });
      
      try {
        const sessionData = {
          sessionName: this.selectedSession.sessionName || `Session ${this.selectedSession.number}`,
          startDate: new Date(this.selectedSession.startDate).toISOString().split('T')[0],
          endDate: new Date(this.selectedSession.endDate).toISOString().split('T')[0],
          programId: parseInt(this.selectedSession.programId),
          courses: (this.selectedSession.subjects || []).map(subjectCode => {
            const course = this.availableCourses.find(c => c.courseCode === subjectCode);
            if (!course) throw new Error(`Course ${subjectCode} not found`);
            return {
              courseId: course.id,
              teacherId: this.selectedSession.teacherId ? parseInt(this.selectedSession.teacherId) : null
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
        
        if (!response.ok) throw new Error('Failed to delete session');
        
        this.showNotification('success', 'Session Deleted', 
          `Session ${this.selectedSession.number} has been deleted successfully`);
        
        this.closeModal();
        await this.loadSessions();
        
      } catch (error) {
        console.error('Error deleting session:', error);
        this.showNotification('error', 'Error', 'Failed to delete session');
      }
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
        if(ctx) {
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
                data: [progress, 100-progress], 
                backgroundColor: [chartColor, '#e5e7eb'], 
                borderWidth: 0, 
                borderRadius: 6, 
                cutout: '75%' 
              }] 
            },
            options: { 
              responsive: true, 
              maintainAspectRatio: true, 
              plugins: { legend: {display: false}, tooltip: {enabled: false} }, 
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
    },
    
    backToSubjects() {
      this.subjectsView = 'list';
      this.selectedSubject = null;
      this.subjectSearchTerm = '';
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
        
        await this.loadSessionCourses(this.selectedSession.id);
        const updatedSubject = this.allSubjects.find(s => s.id === this.selectedSubject.id);
        if (updatedSubject) {
          this.selectedSubject = updatedSubject;
        }
        // Recargar sesiones para actualizar el porcentaje
        await this.loadSessions();
        
      } catch (error) {
        console.error('Error removing student:', error);
        this.showNotification('error', 'Error', 'Failed to remove student');
      }
    },

    addSubjectToSession() {
      if (!this.tempSubject) return;
      
      if (!this.selectedSession.subjects) {
        this.selectedSession.subjects = [];
      }
      
      if (!this.selectedSession.subjects.includes(this.tempSubject)) {
        this.selectedSession.subjects.push(this.tempSubject);
      }
      
      this.tempSubject = '';
    },

    removeSubjectFromSession(index) {
      if (this.selectedSession.subjects) {
        this.selectedSession.subjects.splice(index, 1);
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
      
      this.showAddStudentModal = true;
      this.studentSearchTerm = '';
      this.loadingStudents = true;
      
      try {
        const response = await fetch(
          `http://localhost:3000/api/sessions/${this.currentSessionId}/courses/${this.selectedSubject.id}/available-students`
        );
        
        if (!response.ok) throw new Error('Failed to fetch available students');
        
        this.availableStudents = await response.json();
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
        const updatedSubject = this.allSubjects.find(s => s.id === this.selectedSubject.id);
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

  }
}
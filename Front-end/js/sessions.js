/////////////////////////////////////////////////////
// Apartado de Sesiones - CRUD Completo con Backend

function dashboard() {
  return {
    open: false,
    showFilters: false,
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
        .map(course => course.courseCode);
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
        
        this.allSessions = sessionsData;
        this.sessions = [...sessionsData];
        
        console.log('Sessions loaded:', this.sessions);
        
        this.$nextTick(() => {
          this.sessions.forEach(session => {
            this.initChart(document, session.progress || session.occupancy, session.chartId);
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
    
    // 🔥 FUNCIÓN CRÍTICA - CORREGIDA
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
          teacherId: '',
          professor: ''
        };
        
        this.openModalFlag = true;
      } else {
        // 🔥 PARA DETAILS Y EDIT: CARGAR DESDE EL BACKEND
        try {
          console.log('Loading session details for ID:', session.id);
          
          const response = await fetch(`http://localhost:3000/api/sessions/${session.id}`);
          if (!response.ok) throw new Error('Failed to load session details');
          
          const sessionData = await response.json();
          console.log('Session data from backend:', sessionData);
          
          // Asignar los datos correctamente
          this.selectedSession = {
            id: sessionData.id,
            number: session.number, // Mantener el número de la lista
            sessionName: sessionData.sessionName,
            startDate: sessionData.startDate, // Ya viene en formato YYYY-MM-DD
            endDate: sessionData.endDate,     // Ya viene en formato YYYY-MM-DD
            programId: sessionData.programId.toString(), // Convertir a string para el select
            program: sessionData.program,
            subjects: sessionData.subjects || [], // Array de códigos de curso
            teacherId: sessionData.teacherId ? sessionData.teacherId.toString() : '',
            professor: sessionData.professor || 'TBD'
          };
          
          console.log('Selected session prepared:', this.selectedSession);
          
          // Cargar los cursos de la sesión para el modal de Manage
          if (type !== 'add') {
            await this.loadSessionCourses(session.id);
          }
          
          // Verificar si está bloqueado para edición
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
      
      try {
        const sessionData = {
          sessionName: this.selectedSession.sessionName || `Session ${this.selectedSession.number}`,
          startDate: this.selectedSession.startDate,
          endDate: this.selectedSession.endDate,
          programId: parseInt(this.selectedSession.programId),
          courses: this.selectedSession.subjects.map(courseCode => {
            const course = this.availableCourses.find(c => c.courseCode === courseCode);
            return {
              courseId: course?.id,
              teacherId: this.selectedSession.teacherId ? parseInt(this.selectedSession.teacherId) : null
            };
          }).filter(c => c.courseId)
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
        await this.loadSessionCourses(this.selectedSession.id);
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
    
    deleteStudent(studentId) {
      if(confirm('Are you sure you want to delete this student?')) {
        if(this.selectedSubject) {
          const index = this.selectedSubject.students.findIndex(s => s.id === studentId);
          if(index !== -1) {
            this.selectedSubject.students.splice(index, 1);
            this.showNotification('success', 'Student Deleted', 'Student has been deleted successfully');
          }
        }
      }
    }
  }
}
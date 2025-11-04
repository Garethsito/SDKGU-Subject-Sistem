/////////////////////////////////////////////////////
// Apartado de Sesiones - CRUD Completo

// Función principal para sesiones
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
    
    // Lista de materias ahora incluye el programa al que pertenecen.
    // Usamos 'Bachelor's' y 'Associate' para que coincida con el dropdown de Programas.
    allSubjectDefinitions: [
      { name: "MATH 201", program: "Bachelor's" },
      { name: "MATH 202", program: "Associate" },
      { name: "MATH 203", program: "Bachelor's" },
      { name: "GBUS 404", program: "Associate" },
      { name: "GBUS 405", program: "Bachelor's" },
      { name: "ENGL 201", program: "Associate" },
      { name: "ENGL 202", program: "Bachelor's" },
      { name: "SPCH 201", program: "Associate" },
      { name: "ART 201", program: "Bachelor's" },
      { name: "PHIL 201", program: "Bachelor's" }
    ],

    // Getter reactivo que filtra las materias basándose en el programa seleccionado en el modal
    get filteredSubjectNames() {
      // Si el programa aún no se ha seleccionado en el modal, devuelve una lista vacía.
      if (!this.selectedSession.program) {
        return [];
      }
      
      // Filtra la lista completa y devuelve solo los nombres
      return this.allSubjectDefinitions
        .filter(s => s.program === this.selectedSession.program)
        .map(s => s.name);
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
    
    allSubjects: [
      { id: 1, name: 'MATH 201', code: 'MATH 201', teacher: 'Dr. Smith', students: [ { id: 1, name: 'Juan Pérez', matricula: '2021001', status: 'active' }, { id: 2, name: 'María García', matricula: '2021002', status: 'active' }, { id: 3, name: 'Carlos López', matricula: '2021003', status: 'active' }, { id: 4, name: 'Ana Martínez', matricula: '2021004', status: 'inactive' } ] }, // 3 activos
      { id: 2, name: 'PHYS 201', code: 'PHYS 201', teacher: 'Prof. Johnson', students: [ { id: 5, name: 'Pedro Sánchez', matricula: '2021005', status: 'active' }, { id: 6, name: 'Laura Rodríguez', matricula: '2021006', status: 'active' }, { id: 7, name: 'Diego Torres', matricula: '2021007', status: 'active' } ] }, // 3 activos
      { id: 3, name: 'GBUS 404', code: 'GBUS 404', teacher: 'Dr. Brown', students: [ { id: 8, name: 'Sofia Ramírez', matricula: '2021008', status: 'active' }, { id: 9, name: 'Miguel Flores', matricula: '2021009', status: 'active' }, { id: 10, name: 'Elena Castro', matricula: '2021010', status: 'inactive' }, { id: 11, name: 'Roberto Díaz', matricula: '2021011', status: 'active' } ] }, // 3 activos
      { id: 4, name: 'ENGL 201', code: 'ENGL 201', teacher: 'Prof. Davis', students: [ { id: 12, name: 'Andrea Morales', matricula: '2021012', status: 'active' }, { id: 13, name: 'Luis Herrera', matricula: '2021013', status: 'active' } ] } // 2 activos
    ],
    
    filters: {
      program: 'all',
      session: 'all',
      month: 'all',
      occupancy: 'all',
      subject: 'all',
      activeSessions: false,
      lowEnrollment: false
    },

    allSessions: [
      { id: 'S1', number: 1, month: 'January', date: '2025-01-15', progress: 80, occupancy: 80, subject:'MATH 201', professor:'Daniel Tornero', chartId:'progressChart-1', program: "Bachelor's", status: 'active'},
      { id: 'S2', number: 2, month: 'February', date: '2025-02-10', progress: 65, occupancy: 65, subject:'MATH 202, ENGL 201', professor:'Jorge Ruiz', chartId:'progressChart-2', program: 'Associate', status: 'active'},
      { id: 'S3', number: 3, month: 'March', date: '2025-03-20', progress: 90, occupancy: 90, subject:'MATH 203', professor:'Daniel Tornero', chartId:'progressChart-3', program: "Bachelor's", status: 'active'},
      { id: 'S4', number: 4, month: 'April', date: '2025-04-05', progress: 35, occupancy: 35, subject:'GBUS 404', professor:'Jorge Ruiz', chartId:'progressChart-4', program: 'Associate', status: 'active'},
      { id: 'S5', number: 5, month: 'May', date: '2025-05-12', progress: 28, occupancy: 28, subject:'GBUS 405', professor:'Daniel Tornero', chartId:'progressChart-5', program: "Bachelor's", status: 'active'},
      { id: 'S6', number: 6, month: 'June', date: '2025-06-18', progress: 55, occupancy: 55, subject:'ENGL 201', professor:'Jorge Ruiz', chartId:'progressChart-6', program: 'Associate', status: 'active'},
      { id: 'S7', number: 7, month: 'July', date: '2025-07-08', progress: 38, occupancy: 38, subject:'ENGL 202', professor:'Daniel Tornero', chartId:'progressChart-7', program: "Bachelor's", status: 'active'},
      { id: 'S8', number: 8, month: 'November', date: '2025-11-10', progress: 72, occupancy: 72, subject:'SPCH 201', professor:'Jorge Ruiz', chartId:'progressChart-8', program: 'Associate', status: 'active'}
    ],
    
    sessions: [],
    
    // Sistema de notificaciones
    showNotification(type, title, message) {
      const id = Date.now();
      const notification = {
        id,
        type, // 'success', 'error', 'warning'
        title,
        message,
        show: true
      };
      
      this.notifications.push(notification);
      
      setTimeout(() => {
        this.removeNotification(id);
      }, 5000);
    },
    
    removeNotification(id) {
      const index = this.notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        this.notifications[index].show = false; 
        setTimeout(() => {
          this.notifications.splice(index, 1);
        }, 300); 
      }
    },
    
    // Simulación de cálculo de ocupación
    calculateOccupancy(subjectArray) {
      let totalStudents = 0;
      const maxCapacity = 20; // Capacidad máxima simulada

      subjectArray.forEach(subjectName => {
        const subjectData = this.allSubjects.find(s => s.name === subjectName);
        
        if (subjectData && subjectData.students) {
          const activeStudents = subjectData.students.filter(s => s.status === 'active').length;
          totalStudents += activeStudents;
        } else {
          // Si la materia (ej. MATH 202) no está en 'allSubjects', simula 5 estudiantes
          totalStudents += 5; 
        }
      });

      const occupancyPercentage = Math.round((totalStudents / maxCapacity) * 100);
      return Math.min(occupancyPercentage, 100);
    },

    // Validación de campos requeridos
    validateSession() {
      this.validationError = '';
      
      if (!this.selectedSession.program) {
        this.validationError = 'Please select a program';
        return false;
      }
      
      if (!this.selectedSession.date) {
        this.validationError = 'Please select a date';
        return false;
      }
      
      if (!this.selectedSession.subject || this.selectedSession.subject.length === 0) {
        this.validationError = 'Please select at least one subject';
        return false;
      }
      
      if (!this.selectedSession.professor) {
        this.validationError = 'Please select a professor';
        return false;
      }
      
      return true;
    },
    
    checkEditLock(sessionDate) {
      if (!sessionDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sessionDateObj = new Date(sessionDate + 'T00:00:00'); 
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
    
    init() {
      console.log('Session.js init() called');
      this.sessions = [...this.allSessions];
      
      const isCriticalFilter = sessionStorage.getItem('criticalSessionsFilter');
      if (isCriticalFilter === 'true') {
         this.sessions = this.sessions.filter(s => s.occupancy < 40);
         this.sessions.sort((a, b) => a.occupancy - b.occupancy);
         sessionStorage.removeItem('criticalSessionsFilter');
         this.message = 'Showing critical sessions (occupancy < 40%) sorted by lowest occupancy';
      }

      this.$nextTick(() => {
        this.sessions.forEach(session => {
          this.initChart(document, session.progress, session.chartId);
        });
      });
    },
    
    // CREATE & READ - Abrir modal
    openModal(session = {}, type = 'add') {
      this.modalType = type;
      this.validationError = '';
      this.editWarning = '';
      this.isEditLocked = false;

      if (type === 'add') {
        const maxNumber = Math.max(...this.allSessions.map(s => s.number || 0), 0);
        const newNumber = maxNumber + 1;
        const newId = 'S' + newNumber;

        this.selectedSession = {
          id: newId,
          number: newNumber,
          date: '',
          month: '',
          subject: [], // Inicia como array para el <select multiple>
          professor: '',
          program: '', // Vacío, para forzar al usuario a seleccionar
          occupancy: 0, 
          status: 'active'
        };
      } else {
        // Clonamos la sesión
        this.selectedSession = { ...session };
        
        // Transformamos el STRING de subject en un ARRAY para el modal
        if (typeof this.selectedSession.subject === 'string' && this.selectedSession.subject) {
          this.selectedSession.subject = this.selectedSession.subject.split(',').map(s => s.trim()).filter(s => s);
        } else {
          this.selectedSession.subject = [];
        }
        
        if (type === 'edit' && this.checkEditLock(this.selectedSession.date)) {
          this.isEditLocked = true;
          this.editWarning = 'This session is less than 7 days away and cannot be edited';
        }
      }

      this.openModalFlag = true;
    },
    
    // UPDATE - Guardar sesión (CREATE o UPDATE)
    saveSession() {
      if (!this.validateSession()) {
        this.showNotification('error', 'Validation Error', this.validationError);
        return;
      }
      
      if(this.selectedSession.date) {
        const dateObj = new Date(this.selectedSession.date + 'T00:00:00');
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
        this.selectedSession.month = months[dateObj.getMonth()];
      }
      
      const calculatedOccupancy = this.calculateOccupancy(this.selectedSession.subject);
      const subjectsString = this.selectedSession.subject.join(', ');

      const sessionToSave = {
        ...this.selectedSession,
        subject: subjectsString, 
        occupancy: calculatedOccupancy, 
        progress: calculatedOccupancy, 
        chartId: this.selectedSession.chartId || 'progressChart-' + this.selectedSession.number, 
      };
      
      if(this.modalType === 'add') {
        // CREATE
        sessionToSave.chartId = 'progressChart-' + sessionToSave.number;
        
        this.sessions.push(sessionToSave);
        this.allSessions.push(sessionToSave);
        
        console.log('New session created:', sessionToSave);
        this.showNotification('success', 'Session Created', `Session ${sessionToSave.number} has been created successfully`);
        
      } else if(this.modalType === 'edit') {
        // UPDATE
        const idx = this.sessions.findIndex(s => s.id === sessionToSave.id);
        if(idx !== -1) {
          this.sessions[idx] = sessionToSave;
        }
        
        const idxAll = this.allSessions.findIndex(s => s.id === sessionToSave.id);
        if(idxAll !== -1) {
          this.allSessions[idxAll] = sessionToSave;
        }
        
        console.log('Session updated:', sessionToSave);
        this.showNotification('success', 'Session Updated', `Session ${sessionToSave.number} has been updated successfully`);
      }
      
      this.closeModal();
      
      this.$nextTick(() => {
        this.sessions.forEach(session => {
          this.initChart(document, session.progress, session.chartId);
        });
      });
    },
    
    // Paso 1 para Borrar: Abrir modal de confirmación
    requestDelete() {
      this.showDeleteModal = true;
    },

    // Paso 2 para Borrar: Confirmar y ejecutar
    confirmDelete() {
      const sessionId = this.selectedSession.id;
      const sessionNumber = this.selectedSession.number;
      
      this.sessions = this.sessions.filter(s => s.id !== sessionId);
      this.allSessions = this.allSessions.filter(s => s.id !== sessionId);
      
      console.log('Session deleted:', sessionId);
      this.showNotification('success', 'Session Deleted', `Session ${sessionNumber} has been deleted successfully`);
      
      this.closeModal(); // Cierra ambos modales
    },
    
    closeModal() {
      this.openModalFlag = false;
      this.showDeleteModal = false; // Asegurarse de que el modal de borrado también se cierre
      this.validationError = '';
      this.editWarning = '';
      this.isEditLocked = false;
      this.selectedSession = {}; 
    },
    
    // Inicializar gráfico
    initChart(el, progress, id) {
      setTimeout(() => { 
        const ctx = document.getElementById(id);
        if(ctx) {
          let chartColor;
          if (progress < 40) {
            chartColor = '#252121'; // Gris Carbón (Crítico)
          } else if (progress >= 40 && progress < 60) {
            chartColor = '#F69A1C'; // Amarillo (Bajo)
          } else if (progress >= 60 && progress < 90) {
            chartColor = '#A6192E'; // Rojo Oscuro (Óptimo)
          } else {
            chartColor = '#D41736'; // Rojo Principal (Lleno)
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
        } else {
          // console.warn('Failed to find canvas with id:', id);
        }
      }, 100); 
    },
    
    // Modales de subjects
    openSubjectsModal() {
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
    
    deleteSubject(subjectId) {
      if(confirm('Are you sure you want to delete this subject?')) {
        const index = this.allSubjects.findIndex(s => s.id === subjectId);
        if(index !== -1) {
          this.allSubjects.splice(index, 1);
          console.log('Subject deleted:', subjectId);
          this.showNotification('success', 'Subject Deleted', `Subject ${subjectId} has been deleted successfully`);
        }
      }
    },
    
    deleteStudent(studentId) {
      if(confirm('Are you sure you want to delete this student?')) {
        if(this.selectedSubject) {
          const index = this.selectedSubject.students.findIndex(s => s.id === studentId);
          if(index !== -1) {
            this.selectedSubject.students.splice(index, 1);
            console.log('Student deleted:', studentId);
            this.showNotification('success', 'Student Deleted', `Student ${studentId} has been deleted successfully`);
          }
        }
      }
    }
  }
}
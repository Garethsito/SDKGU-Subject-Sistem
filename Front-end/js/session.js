function dashboard() {
  return {
    open: false,
    showFilters: false,
    searchQuery: '',
    message: '',
    openModalFlag: false,
    modalType: '',
    selectedSession: {},
    
    // Variables para el modal de subjects
    showSubjectsModal: false,
    subjectsView: 'list', // 'list' o 'students'
    selectedSubject: null,
    subjectSearchTerm: '',
    
    // Computed properties para filtrado
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
    
    // Datos de subjects (simulación)
    allSubjects: [
      { 
        id: 1, 
        name: 'MATH 201', 
        code: 'MATH 201', 
        teacher: 'Dr. Smith',
        students: [
          { id: 1, name: 'Juan Pérez', matricula: '2021001', status: 'active' },
          { id: 2, name: 'María García', matricula: '2021002', status: 'active' },
          { id: 3, name: 'Carlos López', matricula: '2021003', status: 'active' },
          { id: 4, name: 'Ana Martínez', matricula: '2021004', status: 'inactive' }
        ]
      },
      { 
        id: 2, 
        name: 'PHYS 201', 
        code: 'PHYS 201', 
        teacher: 'Prof. Johnson',
        students: [
          { id: 5, name: 'Pedro Sánchez', matricula: '2021005', status: 'active' },
          { id: 6, name: 'Laura Rodríguez', matricula: '2021006', status: 'active' },
          { id: 7, name: 'Diego Torres', matricula: '2021007', status: 'active' }
        ]
      },
      { 
        id: 3, 
        name: 'GBUS 404', 
        code: 'GBUS 404', 
        teacher: 'Dr. Brown',
        students: [
          { id: 8, name: 'Sofia Ramírez', matricula: '2021008', status: 'active' },
          { id: 9, name: 'Miguel Flores', matricula: '2021009', status: 'active' },
          { id: 10, name: 'Elena Castro', matricula: '2021010', status: 'inactive' },
          { id: 11, name: 'Roberto Díaz', matricula: '2021011', status: 'active' }
        ]
      },
      { 
        id: 4, 
        name: 'ENGL 201', 
        code: 'ENGL 201', 
        teacher: 'Prof. Davis',
        students: [
          { id: 12, name: 'Andrea Morales', matricula: '2021012', status: 'active' },
          { id: 13, name: 'Luis Herrera', matricula: '2021013', status: 'active' }
        ]
      }
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
// Copia original de todas las sesiones (no se modifica)
    allSessions: [
        { id: 'S1', number: 1, month: 'January', date: '2025-01-15', progress: 80, occupancy: 80, subject:'MATH 201', professor:'Daniel Tornero', chartId:'progressChart-1', program: "Bachelor's", status: 'active'},
        { id: 'S2', number: 2, month: 'February', date: '2025-02-10', progress: 65, occupancy: 65, subject:'MATH 202', professor:'Jorge Ruiz', chartId:'progressChart-2', program: 'Associate', status: 'active'},
        { id: 'S3', number: 3, month: 'March', date: '2025-03-20', progress: 90, occupancy: 90, subject:'MATH 203', professor:'Daniel Tornero', chartId:'progressChart-3', program: "Bachelor's", status: 'active'},
        { id: 'S4', number: 4, month: 'April', date: '2025-04-05', progress: 35, occupancy: 35, subject:'GBUS 404', professor:'Jorge Ruiz', chartId:'progressChart-4', program: 'Associate', status: 'active'},
        { id: 'S5', number: 5, month: 'May', date: '2025-05-12', progress: 28, occupancy: 28, subject:'GBUS 405', professor:'Daniel Tornero', chartId:'progressChart-5', program: "Bachelor's", status: 'active'},
        { id: 'S6', number: 6, month: 'June', date: '2025-06-18', progress: 55, occupancy: 55, subject:'ENGL 201', professor:'Jorge Ruiz', chartId:'progressChart-6', program: 'Associate', status: 'active'},
        { id: 'S7', number: 7, month: 'July', date: '2025-07-08', progress: 38, occupancy: 38, subject:'ENGL 202', professor:'Daniel Tornero', chartId:'progressChart-7', program: "Bachelor's", status: 'active'},
        { id: 'S8', number: 8, month: 'August', date: '2025-08-25', progress: 72, occupancy: 72, subject:'SPCH 201', professor:'Jorge Ruiz', chartId:'progressChart-8', program: 'Associate', status: 'active'}
    ],
    
    // Sesiones visibles (se filtra desde allSessions)
    sessions: [],
    
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
      // Restaurar todas las sesiones desde allSessions
      this.sessions = [...this.allSessions];
      this.message = '';
    },
    
    applyFilters() {
      // Empezar con todas las sesiones
      let filtered = [...this.allSessions];
      
      // Filtro por programa
      if (this.filters.program !== 'all') {
        const programName = this.filters.program === 'bachelor' ? "Bachelor's" : 'Associate';
        filtered = filtered.filter(s => s.program === programName);
      }
      
      // Filtro por mes
      if (this.filters.month !== 'all') {
        filtered = filtered.filter(s => s.month === this.filters.month);
      }
      
      // Filtro por nivel de ocupación
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
      
      // Filtro por materia
      if (this.filters.subject !== 'all') {
        filtered = filtered.filter(s => s.subject === this.filters.subject);
      }
      
      // Filtro por sesión académica
      if (this.filters.session !== 'all') {
        const sessionNumber = parseInt(this.filters.session.replace('session', ''));
        filtered = filtered.filter(s => s.number === sessionNumber);
      }
      
      this.sessions = filtered;
      this.showFilters = false;
      
      // Mensaje informativo
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

      // Inicializar sessions con una copia de allSessions primero
      this.sessions = [...this.allSessions];

      // Verificar si hay filtro crítico en sessionStorage
      const isCriticalFilter = sessionStorage.getItem('criticalSessionsFilter');
      console.log('sessionStorage criticalSessionsFilter:', isCriticalFilter);

      if (isCriticalFilter === 'true') {
        console.log('BEFORE filter - sessions:', this.sessions.length);

        // Filtrar sesiones críticas (occupancy < 40)
        this.sessions = this.sessions.filter(s => s.occupancy < 40);

        console.log('AFTER filter - sessions:', this.sessions.length);
        console.log('Filtered sessions:', this.sessions);

        // Ordenar de menor a mayor ocupación
        this.sessions.sort((a, b) => a.occupancy - b.occupancy);

        // Limpiar el sessionStorage para evitar reaplicar el filtro más tarde
        sessionStorage.removeItem('criticalSessionsFilter');

        this.message = 'Showing critical sessions (occupancy < 40%) sorted by lowest occupancy';
      } else {
        console.log('No critical filter detected, showing all sessions');
        this.message = '';
      }
    },

    
    openModal(session = {}, type = 'add') {
      this.modalType = type;

      if (type === 'add') {
        // Generar ID automático para nueva sesión
        const maxNumber = Math.max(...this.allSessions.map(s => s.number || 0), 0);
        const newNumber = maxNumber + 1;
        const newId = 'S' + newNumber;

        this.selectedSession = {
          id: newId,
          number: newNumber,
          date: '',
          month: '',
          subject: '',
          professor: '',
          program: '',
          occupancy: 0,
          status: 'active'
        };
      } else {
        // Copiar los datos de la sesión seleccionada (para edit o details)
        this.selectedSession = { ...session };
      }

      // Abrir el modal
      this.openModalFlag = true;

      // 🔄 Reiniciar completamente el componente de tags (esperar a que el modal se monte)
      setTimeout(() => {
        const tagComponent = document.querySelector('[x-data^="subjectTags"]');
        if (tagComponent && Alpine.$data(tagComponent)) {
          const tagData = Alpine.$data(tagComponent);
          // Sincronizar el subject del session actual con las etiquetas
          tagData.selectedTags = this.selectedSession.subject
            ? [this.selectedSession.subject]
            : [];
          tagData.query = '';
          tagData.filteredSubjects = [];
          tagData.highlightedIndex = 0;
        }
      }, 100);
    },

    
    saveSession() {
          // Extraer el mes del date input antes de guardar
          if(this.selectedSession.date) {
            const dateObj = new Date(this.selectedSession.date + 'T00:00:00');
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
            this.selectedSession.month = months[dateObj.getMonth()];
          }
          
          if(this.modalType==='add') {
            const newSession = {
              ...this.selectedSession, 
              chartId:'progressChart-' + this.selectedSession.number,
              progress: this.selectedSession.occupancy || 0
            };
            
            this.sessions.push(newSession);
            this.allSessions.push(newSession);
            
            console.log('Nueva sesión agregada:', newSession);
          } else if(this.modalType==='edit') {
            const idx = this.sessions.findIndex(s=>s.id===this.selectedSession.id);
            if(idx!==-1) {
              this.sessions[idx] = {...this.selectedSession, progress: this.selectedSession.occupancy};
            }
            
            const idxAll = this.allSessions.findIndex(s=>s.id===this.selectedSession.id);
            if(idxAll!==-1) {
              this.allSessions[idxAll] = {...this.selectedSession, progress: this.selectedSession.occupancy};
            }
            
            console.log('Sesión actualizada:', this.selectedSession);
          }
          this.openModalFlag = false;
        },
    
    initChart(el, progress, id) {
      setTimeout(() => {
        const ctx = document.getElementById(id);
        if(ctx) {
          new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: { datasets: [{ data: [progress, 100-progress], backgroundColor: ['#A6192E','#f3f4f6'], borderWidth: 0, borderRadius: 6, cutout: '75%' }] },
            options: { responsive:true, maintainAspectRatio:true, plugins:{legend:{display:false}, tooltip:{enabled:false}}, animation:{animateRotate:true, duration:1000, easing:'easeOutQuart'} }
          });
        }
      },100);
    },
    
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
          }
        }
      }
    }
  }
}

    function subjectTags(session) {
      return {
        query: '',
        allSubjects: [
          "MATH 201","MATH 202","MATH 203","GBUS 404","GBUS 405","ENGL 201",
          "ENGL 202","SPCH 201","ART 201","PHIL 201"
        ],
        get selectedTags() {
          return session.subject ? [session.subject] : [];
        },
        set selectedTags(val) {
          session.subject = val[0] || '';
        },
        filteredSubjects: [],
        highlightedIndex: 0,

        showAllSubjects() {
          this.filteredSubjects = this.allSubjects.filter(
            s => !this.selectedTags.includes(s)
          );
          this.highlightedIndex = 0;
        },

        addTag(tag) {
          tag = tag?.trim();
          if(tag && !this.selectedTags.includes(tag)) {
            this.selectedTags = [tag]; // actualizar getter/setter
          }
          this.query = '';
          this.filteredSubjects = [];
          this.highlightedIndex = 0;
        },

        removeTag(index) {
          this.selectedTags = [];
        },

        filterSubjects() {
          const q = this.query.toLowerCase();
          this.filteredSubjects = this.allSubjects.filter(
            s => s.toLowerCase().includes(q) && !this.selectedTags.includes(s)
          );
          this.highlightedIndex = 0;
        }
      }
    }


    function subjectDropdown(selectedSession) {
      return {
        open: false,
        get selectedSubject() {
          return selectedSession.subject || '';
        },
        set selectedSubject(val) {
          selectedSession.subject = val;
        },
        subjects: [
          "MATH 201","MATH 202","MATH 203","GBUS 404","GBUS 405","ENGL 201",
          "ENGL 202","SPCH 201","ART 201","PHIL 201"
        ],
        selectSubject(subject) {
          this.selectedSubject = subject;
          this.open = false;
        },
        addNewSubject() {
          alert('Add new subject clicked!');
        }
      }
    }

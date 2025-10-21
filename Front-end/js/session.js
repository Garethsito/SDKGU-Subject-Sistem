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
    
    // Datos de subjects (simulación)
    allSubjects: [
      { 
        id: 1, 
        name: 'Mathematics', 
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
        name: 'Physics', 
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
        name: 'Chemistry', 
        code: 'CHEM 101', 
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
        name: 'English', 
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
      occupancy: 'all',
      activeSessions: false,
      lowEnrollment: false
    },
    sessions: [
      { id: 'S1', number: 1, month: 'January', progress: 80, occupancy: 80, subject:'Math', professor:'Prof. A', chartId:'progressChart-1', program: "Bachelor's", status: 'active'},
      { id: 'S2', number: 2, month: 'February', progress: 65, occupancy: 65, subject:'Physics', professor:'Prof. B', chartId:'progressChart-2', program: 'Associate', status: 'active'},
      { id: 'S3', number: 3, month: 'March', progress: 90, occupancy: 90, subject:'Chemistry', professor:'Prof. C', chartId:'progressChart-3', program: "Bachelor's", status: 'active'},
      { id: 'S4', number: 4, month: 'April', progress: 35, occupancy: 35, subject:'Biology', professor:'Prof. D', chartId:'progressChart-4', program: 'Associate', status: 'active'},
      { id: 'S5', number: 5, month: 'May', progress: 28, occupancy: 28, subject:'History', professor:'Prof. E', chartId:'progressChart-5', program: "Bachelor's", status: 'active'},
      { id: 'S6', number: 6, month: 'June', progress: 55, occupancy: 55, subject:'English', professor:'Prof. F', chartId:'progressChart-6', program: 'Associate', status: 'active'},
      { id: 'S7', number: 7, month: 'July', progress: 38, occupancy: 38, subject:'Art', professor:'Prof. G', chartId:'progressChart-7', program: "Bachelor's", status: 'active'},
      { id: 'S8', number: 8, month: 'August', progress: 72, occupancy: 72, subject:'Music', professor:'Prof. H', chartId:'progressChart-8', program: 'Associate', status: 'active'}
    ],
    
    clearFilters() {
      this.filters = {
        program: 'all',
        session: 'all',
        occupancy: 'all',
        activeSessions: false,
        lowEnrollment: false
      };
      // Restaurar todas las sesiones
      this.sessions = [
        { id: 'S1', number: 1, month: 'January', progress: 80, occupancy: 80, subject:'Math', professor:'Prof. A', chartId:'progressChart-1', program: "Bachelor's", status: 'active'},
        { id: 'S2', number: 2, month: 'February', progress: 65, occupancy: 65, subject:'Physics', professor:'Prof. B', chartId:'progressChart-2', program: 'Associate', status: 'active'},
        { id: 'S3', number: 3, month: 'March', progress: 90, occupancy: 90, subject:'Chemistry', professor:'Prof. C', chartId:'progressChart-3', program: "Bachelor's", status: 'active'},
        { id: 'S4', number: 4, month: 'April', progress: 35, occupancy: 35, subject:'Biology', professor:'Prof. D', chartId:'progressChart-4', program: 'Associate', status: 'active'},
        { id: 'S5', number: 5, month: 'May', progress: 28, occupancy: 28, subject:'History', professor:'Prof. E', chartId:'progressChart-5', program: "Bachelor's", status: 'active'},
        { id: 'S6', number: 6, month: 'June', progress: 55, occupancy: 55, subject:'English', professor:'Prof. F', chartId:'progressChart-6', program: 'Associate', status: 'active'},
        { id: 'S7', number: 7, month: 'July', progress: 38, occupancy: 38, subject:'Art', professor:'Prof. G', chartId:'progressChart-7', program: "Bachelor's", status: 'active'},
        { id: 'S8', number: 8, month: 'August', progress: 72, occupancy: 72, subject:'Music', professor:'Prof. H', chartId:'progressChart-8', program: 'Associate', status: 'active'}
      ];
      this.message = '';
    },
    
    applyFilters() {
      // Implementar lógica de filtros si es necesario
      this.showFilters = false;
    },
    
    init() {
      console.log('Session.js init() called');
      
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
        
        // Limpiar el sessionStorage
        sessionStorage.removeItem('criticalSessionsFilter');
        
        this.message = 'Showing critical sessions (occupancy < 40%) sorted by lowest occupancy';
      } else {
        console.log('No critical filter detected, showing all sessions');
      }
    },
    
    openModal(session={}, type='add') {
      this.modalType = type;
      if(type==='add') {
        this.selectedSession = { id:'', number:'', date:'', subject:'', professor:'' };
      } else {
        this.selectedSession = {...session};
      }
      this.openModalFlag = true;
    },
    
    saveSession() {
      if(this.modalType==='add') {
        this.sessions.push({...this.selectedSession, chartId:'progressChart-' + (this.sessions.length+1)});
      } else if(this.modalType==='edit') {
        const idx = this.sessions.findIndex(s=>s.id===this.selectedSession.id);
        if(idx!==-1) this.sessions[idx] = {...this.selectedSession};
      }
      this.openModalFlag = false;
      console.log('Saved session:', this.selectedSession);
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
    selectedTags: session.subject ? [session.subject] : [],
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
        this.selectedTags.push(tag);
        session.subject = tag;
      }
      this.query = '';
      this.filteredSubjects = [];
      this.highlightedIndex = 0;
    },

    removeTag(index) {
      this.selectedTags.splice(index, 1);
      session.subject = this.selectedTags[0] || '';
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
    selectedSubject: selectedSession.subject || '',
    subjects: [
      "Math", "English", "Science", "Programming", "Databases", 
      "Networks", "Web Design", "Ethics", "History", "Economics"
    ],
    selectSubject(subject) {
      this.selectedSubject = subject;
      this.open = false;
      selectedSession.subject = subject;
    },
    addNewSubject() {
      alert('Add new subject clicked!');
    }
  }
}
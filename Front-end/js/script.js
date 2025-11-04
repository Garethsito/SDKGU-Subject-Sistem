
//Front-end/js/script.js
/////////////////////////////////////////////////////
// Apartado de Index
// Función del dashboard de index
function dashboardData() {
  return {
    open: false,
    searchQuery: '',
    showFilters: false,
    openModalFlag: false,
    selectedSession: {},
    upcomingSessions: [],
    
    filters: {
      program: 'all',
      session: 'all',
      occupancy: 'all',
      activeSessions: false,
      lowEnrollment: false,
      transfers: false,
      prerequisites: false
    },
    
    stats: {
      totalStudents: 1277,
      activeSessions: 38,
      avgOccupancy: 72,
      criticalSessions: 0,
    },
    
    sessionOccupancy: {
      labels: ['Session 1', 'Session 2', 'Session 3', 'Session 4', 'Session 5', 'Session 6'],
      data: [85, 72, 68, 91, 55, 78]
    },
    
    studentDistribution: {
      labels: ["Bachelor's", 'Associate'],
      data: [754, 493]
    },
    
    allSessions: [
      { 
        id: 1,
        name: 'Session 1',
        program: "Bachelor's",
        month: 'October',
        occupancy: 85,
        status: 'active',
        lowEnrollment: false,
        subjects: ['MATH 201', 'ENGL 201'],
        professor: 'Daniel Tornero'
      },
      { 
        id: 2, 
        name: 'Session 2', 
        program: 'Associate', 
        month: 'November', 
        occupancy: 72, 
        status: 'active', 
        lowEnrollment: false,
        subjects: ['GBUS 404', 'SPCH 201'],
        professor: 'Jorge Ruiz'
      },
      { 
        id: 3, 
        name: 'Session 3', 
        program: 'Associate', 
        month: 'December', 
        occupancy: 68, 
        status: 'active', 
        lowEnrollment: false,
        subjects: ['MATH 202', 'ART 201'],
        professor: 'Daniel Tornero'
      },
      { 
        id: 4, 
        name: 'Session 4', 
        program: "Bachelor's", 
        month: 'January', 
        occupancy: 91, 
        status: 'active', 
        lowEnrollment: false,
        subjects: ['PHIL 201', 'ENGL 202'],
        professor: 'Jorge Ruiz'
      },
      { 
        id: 5, 
        name: 'Session 5', 
        program: 'Associate', 
        month: 'February', 
        occupancy: 55, 
        status: 'active', 
        lowEnrollment: false,
        subjects: ['MATH 203'],
        professor: 'Daniel Tornero'
      },
      { 
        id: 6, 
        name: 'Session 6', 
        program: "Bachelor's", 
        month: 'March', 
        occupancy: 78, 
        status: 'active', 
        lowEnrollment: false,
        subjects: ['GBUS 405', 'MATH 201'],
        professor: 'Jorge Ruiz'
      },
      { 
        id: 7, 
        name: 'Session 7', 
        program: 'Associate', 
        month: 'April', 
        occupancy: 35, 
        status: 'active', 
        lowEnrollment: true,
        subjects: ['ENGL 201'],
        professor: 'Daniel Tornero'
      },
      { 
        id: 8, 
        name: 'Session 8', 
        program: "Bachelor's", 
        month: 'May', 
        occupancy: 42, 
        status: 'active', 
        lowEnrollment: true,
        subjects: ['SPCH 201', 'ART 201'],
        professor: 'Jorge Ruiz'
      },
      { 
        id: 9, 
        name: 'Session 9', 
        program: 'Associate', 
        month: 'June', 
        occupancy: 95, 
        status: 'active', 
        lowEnrollment: false,
        subjects: ['MATH 202', 'PHIL 201', 'ENGL 202'],
        professor: 'Daniel Tornero'
      },
      { 
        id: 10, 
        name: 'Session 10', 
        program: "Bachelor's", 
        month: 'July', 
        occupancy: 28, 
        status: 'active', 
        lowEnrollment: true,
        subjects: ['GBUS 404'],
        professor: 'Jorge Ruiz'
      }
    ],
    
    async fetchTotalStudents() {
  try {
    const response = await fetch('http://localhost:3000/api/students/count');
    const data = await response.json();
    
    if (data.total !== undefined) {
      // ✅ PRIMERO actualiza la propiedad reactiva de Alpine
      this.stats.totalStudents = data.total;
      console.log('Total de estudiantes actualizado:', data.total);

      // ✅ OPCIONAL: Forzar actualización del DOM
      this.$nextTick(() => {
        const totalEl = document.getElementById('totalStudents');
        if (totalEl) {
          totalEl.textContent = data.total;
        }
      });

      // ✅ Actualizar gráfica si existe (calcula proporciones correctas)
      if (chartInstances['pieChart']) {
        // Mantén la proporción Bachelor's vs Associate (aproximadamente 60/40)
        const bachelorPercentage = 0.59; // 59% como en tus datos originales
        const bachelorTotal = Math.round(data.total * bachelorPercentage);
        const associateTotal = data.total - bachelorTotal;
        
        chartInstances['pieChart'].data.datasets[0].data = [bachelorTotal, associateTotal];
        chartInstances['pieChart'].update();
        
        // También actualiza studentDistribution para que sea consistente
        this.studentDistribution.data = [bachelorTotal, associateTotal];
      }
    }
  } catch (error) {
    console.error('Error al obtener total de estudiantes:', error);
    // Mantener el valor por defecto en caso de error
  }
},


    async init() {
      this.upcomingSessions = [...this.allSessions];
      await this.fetchTotalStudents();
      this.updateStats();
      console.log('Total sessions:', this.allSessions.length);
      console.log('Critical sessions:', this.stats.criticalSessions);
       console.log('Total students cargado:', this.stats.totalStudents); // ✅ Agregar este log
    },


    
    // Abre el modal de detalles
    openModal(session, type='details') {
      this.selectedSession = {...session};
      this.openModalFlag = true;
      
      setTimeout(() => {
        this.createModalChart();
      }, 100);
    },

    createModalChart() {
      const chartId = 'modalChart' + this.selectedSession.id;
      const canvas = document.getElementById(chartId);
      
      if (canvas) {
        if (chartInstances[chartId]) {
          chartInstances[chartId].destroy();
        }
        
        const ctx = canvas.getContext('2d');
        chartInstances[chartId] = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Occupied', 'Available'],
            datasets: [{
              data: [this.selectedSession.occupancy, 100 - this.selectedSession.occupancy],
              backgroundColor: ['#D41736', 'rgba(210, 210, 210, 0.4)'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.label + ': ' + context.parsed + '%';
                  }
                }
              }
            }
          }
        });
      }
    },

    // Limpia los filtros
    clearFilters() {
      this.filters = {
        program: 'all',
        session: 'all',
        occupancy: 'all',
        activeSessions: false,
        lowEnrollment: false,
        transfers: false,
        prerequisites: false
      };
      
      this.upcomingSessions = [...this.allSessions];
      this.updateStats();
      
      setTimeout(() => {
        window.createSessionCharts();
      }, 100);
    },

    applyFilters() {
      console.log('Aplicando filtros:', this.filters);
      
      let filtered = [...this.allSessions];
      
      if (this.filters.program !== 'all') {
        const programName = this.filters.program === 'bachelor' ? "Bachelor's" : 'Associate';
        filtered = filtered.filter(session => session.program === programName);
      }

      if (this.filters.session !== 'all') {
        const sessionNumber = parseInt(this.filters.session.replace('session', ''));
        filtered = filtered.filter(session => session.id === sessionNumber);
      }
      
      if (this.filters.occupancy !== 'all') {
        filtered = filtered.filter(session => {
          const occ = session.occupancy;
          
          switch(this.filters.occupancy) {
            case 'critical': 
              return occ < 40;
            case 'low': 
              return occ >= 40 && occ < 60;
            case 'optimal': 
              return occ >= 60 && occ < 90;
            case 'full': 
              return occ >= 90;
            default: 
              return true;
          }
        });
      }
      
      if (this.filters.activeSessions) {
        filtered = filtered.filter(session => session.status === 'active');
      }
      
      if (this.filters.lowEnrollment) {
        filtered = filtered.filter(session => session.lowEnrollment === true);
      }

      this.upcomingSessions = filtered;
      this.updateStats();
      
      setTimeout(() => {
        window.createSessionCharts();
      }, 100);
      
      this.showFilters = false;
      console.log('Sesiones filtradas:', filtered.length);
    },
    
    updateStats() {
      this.stats.criticalSessions = this.allSessions.filter(s => s.occupancy < 40).length;
      
      if (this.upcomingSessions.length > 0) {
        const totalOccupancy = this.upcomingSessions.reduce((sum, s) => sum + s.occupancy, 0);
        this.stats.avgOccupancy = Math.round(totalOccupancy / this.upcomingSessions.length);
        this.stats.activeSessions = this.upcomingSessions.filter(s => s.status === 'active').length;
      }
    },

    redirectToCriticalSessions() {
      const criticalSessions = this.allSessions.filter(s => s.occupancy < 40);
      console.log('Critical sessions found:', criticalSessions);
      sessionStorage.setItem('criticalSessionsFilter', 'true');
      window.location.href = 'session.html';
    }
  }
}

// Inicialización para las graficas en cuestión a index.hmtl
document.addEventListener('DOMContentLoaded', function () {
  
  setTimeout(() => {
    const data = Alpine.$data(document.body);
    
    // Gráfica 1: Ocupación por sesión (Barras)
    const canvas1 = document.getElementById('miGrafica');
    if (!canvas1) return;
    
    const ctx1 = canvas1.getContext('2d');
    
    chartInstances['barChart'] = new Chart(ctx1, {
      type: 'bar', 
      data: {
        labels: data.sessionOccupancy.labels,
        datasets: [{
          label: 'Occupancy %',
          data: data.sessionOccupancy.data,
          backgroundColor: [
            '#A6192E',
            '#D41736',
            '#8E1C2D',
            '#A6192E',
            '#D41736',
            '#8E1C2D'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { 
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });

    // Gráfica 2: Distribución de estudiantes (Pie)
// Gráfica 2: Distribución de estudiantes (Pie)
async function cargarGraficaDistribucion() {
  try {
    const res = await fetch('http://localhost:3000/api/students/distribution');
    const apiData = await res.json();

    // ✅ Verifica si existe el canvas
    const canvas2 = document.getElementById('miGrafica2');
    if (!canvas2) {
      console.warn('⚠️ No se encontró el elemento #miGrafica2');
      return;
    }
    const ctx2 = canvas2.getContext('2d');

    // ✅ Usa los datos del backend si existen, si no usa los locales
    const distData = apiData?.studentDistribution?.data?.length
      ? apiData.studentDistribution
      : Alpine.$data(document.body).studentDistribution;

    // ✅ Si ya existe la gráfica, actualízala
    if (chartInstances['pieChart']) {
      chartInstances['pieChart'].data.labels = distData.labels;
      chartInstances['pieChart'].data.datasets[0].data = distData.data;
      chartInstances['pieChart'].update();
      console.log('📊 Gráfica de distribución actualizada.');
      return;
    }

    // ✅ Si no existe, créala
    chartInstances['pieChart'] = new Chart(ctx2, {
      type: 'pie',
      data: {
        labels: distData.labels,
        datasets: [{
          data: distData.data,
          backgroundColor: ['#A6192E', '#2D2828'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: true,
            position: 'bottom',
            labels: { 
              boxWidth: 12,
              padding: 5,
              font: { size: 10 }
            }
          }
        }
      }
    });

    console.log('✅ Gráfica de distribución creada exitosamente.');
  } catch (error) {
    console.error('❌ Error cargando distribución de estudiantes:', error);

    // 🔄 En caso de error, usa los datos locales
    const localData = Alpine.$data(document.body).studentDistribution;
    const canvas2 = document.getElementById('miGrafica2');
    if (!canvas2) return;
    const ctx2 = canvas2.getContext('2d');

    if (chartInstances['pieChart']) chartInstances['pieChart'].destroy();

    chartInstances['pieChart'] = new Chart(ctx2, {
      type: 'pie',
      data: {
        labels: localData.labels,
        datasets: [{
          data: localData.data,
          backgroundColor: ['#A6192E', '#2D2828'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: true,
            position: 'bottom',
            labels: { 
              boxWidth: 12,
              padding: 5,
              font: { size: 10 }
            }
          }
        }
      }
    });
  }
}

cargarGraficaDistribucion();



    // Gráficas de Donut para cada sesión
    // Gráficas de Donut para cada sesión
    window.createSessionCharts = function() {
      
      // Destruir gráficas anteriores
      Object.keys(chartInstances).forEach(key => {
        if (key.startsWith('sessionChart')) {
          chartInstances[key].destroy();
          delete chartInstances[key];
        }
      });

      // Crear nuevas gráficas
      data.upcomingSessions.forEach((session) => {
        const canvas = document.getElementById('sessionChart' + session.id);
        
        if (canvas) {
          const ctx = canvas.getContext('2d');
          
          // Determinar color según ocupación
          // Gris Carbon si es crítico (<40%)
          // Mauve Gris si es bajo (40-60%)
          // Wine Rose si es óptimo (60-90%)
          // Crimson Red si está lleno (≥90%)
          let chartColor;
          if (progress < 40) {
            chartColor = '#322C2C'; // Rojo 20%
          } else if (progress >= 40 && progress < 60) {
            chartColor = '#7B6569'; // Rojo 50%
          } else if (progress >= 60 && progress < 90) {
            chartColor = '#8C4650'; // Rojo 80%
          } else {
            chartColor = '#D41736'; // Rojo 100%
          }
          
          chartInstances['sessionChart' + session.id] = new Chart(ctx, {
            type: 'doughnut', 
            data: {
              labels: ['Occupied', 'Available'],
              datasets: [{
                data: [session.occupancy, 100 - session.occupancy],
                backgroundColor: [
                  chartColor,
                  'rgba(210, 210, 210, 0.4)'
                ],
                borderWidth: 0 
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '70%',
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return context.label + ': ' + context.parsed + '%';
                    }
                  }
                }
              }
            }
          });
        }
      });
    };

    // Crear las gráficas iniciales
    createSessionCharts();

  }, 100);
});

/////////////////////////////////////////////////////
// Apartado de Sesiones

// Función para session
function dashboard() {
  return {
    open: false,
    showFilters: false,
    searchQuery: '',
    message: '',
    openModalFlag: false,
    modalType: '',
    selectedSession: {},
    
    showSubjectsModal: false,
    subjectsView: 'list',
    selectedSubject: null,
    subjectSearchTerm: '',
    
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
        filtered = filtered.filter(s => s.subject === this.filters.subject);
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
      console.log('sessionStorage criticalSessionsFilter:', isCriticalFilter);

      if (isCriticalFilter === 'true') {
        console.log('BEFORE filter - sessions:', this.sessions.length);
        this.sessions = this.sessions.filter(s => s.occupancy < 40);
        console.log('AFTER filter - sessions:', this.sessions.length);
        this.sessions.sort((a, b) => a.occupancy - b.occupancy);
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
        this.selectedSession = { ...session };
      }

      this.openModalFlag = true;

      setTimeout(() => {
        const tagComponent = document.querySelector('[x-data^="subjectTags"]');
        if (tagComponent && Alpine.$data(tagComponent)) {
          const tagData = Alpine.$data(tagComponent);
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
        
        console.log('New session add:', newSession);
      } else if(this.modalType==='edit') {
        const idx = this.sessions.findIndex(s=>s.id===this.selectedSession.id);
        if(idx!==-1) {
          this.sessions[idx] = {...this.selectedSession, progress: this.selectedSession.occupancy};
        }
        
        const idxAll = this.allSessions.findIndex(s=>s.id===this.selectedSession.id);
        if(idxAll!==-1) {
          this.allSessions[idxAll] = {...this.selectedSession, progress: this.selectedSession.occupancy};
        }
        
        console.log('Update session:', this.selectedSession);
      }
      this.openModalFlag = false;
    },
    
    initChart(el, progress, id) {
      setTimeout(() => {
        const ctx = document.getElementById(id);
        if(ctx) {
          // Determinar color según ocupación
          // Gris Carbon si es crítico (<40%)
          // Mauve Gris si es bajo (40-60%)
          // Wine Rose si es óptimo (60-90%)
          // Crimson Red si está lleno (≥90%)
          let chartColor;
          if (progress < 40) {
            chartColor = '#322C2C'; // Rojo 20%
          } else if (progress >= 40 && progress < 60) {
            chartColor = '#7B6569'; // Rojo 50%
          } else if (progress >= 60 && progress < 90) {
            chartColor = '#8C4650'; // Rojo 80%
          } else {
            chartColor = '#D41736'; // Rojo 100%
          }
          
          new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: { 
              datasets: [{ 
                data: [progress, 100-progress], 
                backgroundColor: [chartColor, '#f3f4f6'], 
                borderWidth: 0, 
                borderRadius: 6, 
                cutout: '75%' 
              }] 
            },
            options: { 
              responsive: true, 
              maintainAspectRatio: true, 
              plugins: {
                legend: {display: false}, 
                tooltip: {enabled: false}
              }, 
              animation: {
                animateRotate: true, 
                duration: 1000, 
                easing: 'easeOutQuart'
              } 
            }
          });
        }
      }, 100);
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

// Función auxiliar en cuestión a los tags
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
        this.selectedTags = [tag];
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

// Función auxiliar para el dropdown
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

/////////////////////////////////////////////////////
// Apartado de Subjects
// Variables Globales
if (typeof chartInstances === 'undefined') {
  var chartInstances = {};
}

// Función principal
function subjectsData() {
  return {
    open: false,
    message: '',
    showFilters: false,
    selectedSubject: null,
    searchQuery: '',
    
    // Filtros
    filters: {
      program: 'all',
      session: 'all',
      occupancy: 'all',
      prerequisites: 'all'
    },
    
    // Array original que NUNCA se modifica
    allSubjects: [
      { 
        code: 'GBUS 404', 
        program: 'ASSD', 
        session: 'Session 1', 
        occupancy: 80,
        maxStudents: 30,
        prerequisites: ['GBUS 101', 'GBUS 202'],
        students: [
          { name: 'Juan Pérez', id: '001', email: 'juan@sdgku.edu' },
          { name: 'María García', id: '002', email: 'maria@sdgku.edu' },
          { name: 'Carlos López', id: '003', email: 'carlos@sdgku.edu' }
        ]
      },
      { 
        code: 'ACCT 301', 
        program: 'ASSD', 
        session: 'Session 1', 
        occupancy: 55,
        maxStudents: 25,
        prerequisites: ['ACCT 101'],
        students: [
          { name: 'Ana Martínez', id: '004', email: 'ana@sdgku.edu' },
          { name: 'Pedro Sánchez', id: '005', email: 'pedro@sdgku.edu' }
        ]
      },
      { 
        code: 'MKTG 205', 
        program: 'ASSD', 
        session: 'Session 1', 
        occupancy: 90,
        maxStudents: 20,
        prerequisites: ['MKTG 101', 'GBUS 101'],
        students: [
          { name: 'Laura Rodríguez', id: '006', email: 'laura@sdgku.edu' }
        ]
      },
      { 
        code: 'MATH 202', 
        program: 'BGSM', 
        session: 'Session 1', 
        occupancy: 50,
        maxStudents: 28,
        prerequisites: ['MATH 101'],
        students: [
          { name: 'Diego Torres', id: '007', email: 'diego@sdgku.edu' }
        ]
      },
      { 
        code: 'PHYS 310', 
        program: 'ASSD', 
        session: 'Session 1', 
        occupancy: 60,
        maxStudents: 22,
        prerequisites: ['PHYS 101', 'MATH 202'],
        students: []
      },
      { 
        code: 'CHEM 405', 
        program: 'ASSD', 
        session: 'Session 1', 
        occupancy: 95,
        maxStudents: 18,
        prerequisites: ['CHEM 101'],
        students: []
      },
      { 
        code: 'ECON 220', 
        program: 'BGSM', 
        session: 'Session 1', 
        occupancy: 20,
        maxStudents: 30,
        prerequisites: [],
        students: []
      },
      { 
        code: 'HIST 150', 
        program: 'BGSM', 
        session: 'Session 1', 
        occupancy: 10,
        maxStudents: 25,
        prerequisites: [],
        students: []
      },
      { 
        code: 'BIOL 302', 
        program: 'BGSM', 
        session: 'Session 1', 
        occupancy: 38,
        maxStudents: 20,
        prerequisites: ['BIOL 101', 'CHEM 101'],
        students: []
      }
    ],
    
    // Array que se muestra en la UI (este SÍ cambia con filtros)
    subjects: [],
    
    // Inicialización
    init() {
      // Copia inicial de todos los subjects
      this.subjects = [...this.allSubjects];
    },
    
    getCardBg(occupancy) {
      if (occupancy >= 70) return 'rgba(255, 255, 255, 0.6)';
      if (occupancy >= 40) return 'rgba(255, 255, 255, 0.4)';
      return 'rgba(255, 194, 194, 0.4)';
    },
    
    showStudents(subject) {
      this.selectedSubject = subject;
    },
    
    // Limpiar filtros: restaura DESDE allSubjects
    clearFilters() {
      this.filters = {
        program: 'all',
        session: 'all',
        occupancy: 'all',
        prerequisites: 'all'
      };
      
      // Restaurar desde el array original
      this.subjects = [...this.allSubjects];
      this.message = '';
    },
    
    // SIEMPRE filtra desde allSubjects
    applyFilters() {
      console.log('Aplicando filtros:', this.filters);
      
      // Siempre partir del array original
      let filtered = [...this.allSubjects];
      
      // Filtro por programa
      if (this.filters.program !== 'all') {
        const programName = this.filters.program === 'bachelor' ? 'BGSM' : 'ASSD';
        filtered = filtered.filter(s => s.program === programName);
      }
      
      // Filtro por sesión
      if (this.filters.session !== 'all') {
        const sessionName = 'Session ' + this.filters.session.replace('session', '');
        filtered = filtered.filter(s => s.session === sessionName);
      }
      
      // Filtro por ocupación
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
      
      // Filtro por prerrequisitos
      if (this.filters.prerequisites !== 'all') {
        filtered = filtered.filter(s => {
          switch(this.filters.prerequisites) {
            case 'yes': return s.prerequisites.length > 0;
            case 'no': return s.prerequisites.length === 0;
            default: return true;
          }
        });
      }
      
      // Actualizar subjects mostrados
      this.subjects = filtered;
      this.showFilters = false;
      
      // Mensaje informativo
      const activeFilters = [];
      if (this.filters.program !== 'all') activeFilters.push('Program');
      if (this.filters.session !== 'all') activeFilters.push('Session');
      if (this.filters.occupancy !== 'all') activeFilters.push('Occupancy');
      if (this.filters.prerequisites !== 'all') activeFilters.push('Prerequisites');
      
      if (activeFilters.length > 0) {
        this.message = `Filters applied: ${activeFilters.join(', ')} | Showing ${this.subjects.length} subject(s)`;
      } else {
        this.message = '';
      }
      
      console.log('Subjects filtrados:', this.subjects.length);
    }
  }
}
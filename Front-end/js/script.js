
//Front-end/js/script.js
/////////////////////////////////////////////////////
// Apartado de Index
// Función del dashboard de index
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
      totalStudents: 0,
      activeSessions: 0,
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
    
    allSessions: [],

    async init() {
      await this.fetchData();
      this.upcomingSessions = [...this.allSessions];
      this.updateStats();
  
      console.log('Total sessions:', this.allSessions.length);
      console.log('Critical sessions:', this.stats.criticalSessions);
      console.log('Total students cargado:', this.stats.totalStudents);
    },

    async fetchData() {
      try {
        // 🧠 Obtener total de estudiantes
        const resStudents = await fetch('http://localhost:3000/api/students/count');
        const dataStudents = await resStudents.json();
        if (dataStudents.total !== undefined) {
          this.stats.totalStudents = dataStudents.total;
          console.log('✅ Total de estudiantes actualizado:', dataStudents.total);
        }

        // 🧠 Obtener sesiones desde el backend
        const res = await fetch('http://localhost:3000/api/students/sessions');
        const data = await res.json();
        this.allSessions = data;
        console.log("📡 Sesiones cargadas desde la BD:", data);

        // 🔥 NO calcular aquí activeSessions manualmente
        // Se calculará en updateStats() basado en upcomingSessions

      } catch (error) {
        console.error('❌ Error obteniendo datos del dashboard:', error);
      }
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

    // 🔥 FIX: Limpia los filtros correctamente
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
      
      // ✅ Restaurar desde allSessions
      this.upcomingSessions = [...this.allSessions];
      
      // ✅ Recalcular estadísticas basadas en upcomingSessions
      this.updateStats();

      // ✅ Recrear gráficas después de actualizar datos
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
    
    // 🔥 FIX: Actualiza estadísticas basadas en upcomingSessions
    updateStats() {
      // ✅ Calcular critical sessions desde allSessions (siempre)
      this.stats.criticalSessions = this.allSessions.filter(s => s.occupancy < 40).length;
      
      // ✅ Calcular active sessions desde upcomingSessions (depende de filtros)
      if (this.upcomingSessions.length > 0) {
        this.stats.activeSessions = this.upcomingSessions.filter(s => s.status === 'active').length;
        
        const totalOccupancy = this.upcomingSessions.reduce((sum, s) => sum + s.occupancy, 0);
        this.stats.avgOccupancy = Math.round(totalOccupancy / this.upcomingSessions.length);
      } else {
        // Si no hay sesiones filtradas, mostrar 0
        this.stats.activeSessions = 0;
        this.stats.avgOccupancy = 0;
      }
      
      console.log('📊 Stats actualizadas:', this.stats);
    },

    redirectToCriticalSessions() {
      const criticalSessions = this.allSessions.filter(s => s.occupancy < 40);
      console.log('Critical sessions found:', criticalSessions);
      sessionStorage.setItem('criticalSessionsFilter', 'true');
      window.location.href = 'session.html';
    }
  }
}

// Inicialización para las graficas en cuestión a index.html
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
    async function cargarGraficaDistribucion() {
      try {
        const res = await fetch('http://localhost:3000/api/students/distribution');
        const apiData = await res.json();

        const canvas2 = document.getElementById('miGrafica2');
        if (!canvas2) {
          console.warn('⚠️ No se encontró el elemento #miGrafica2');
          return;
        }
        const ctx2 = canvas2.getContext('2d');

        const distData = apiData?.studentDistribution?.data?.length
          ? apiData.studentDistribution
          : Alpine.$data(document.body).studentDistribution;

        if (chartInstances['pieChart']) {
          chartInstances['pieChart'].data.labels = distData.labels;
          chartInstances['pieChart'].data.datasets[0].data = distData.data;
          chartInstances['pieChart'].update();
          console.log('📊 Gráfica de distribución actualizada.');
          return;
        }

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
    window.createSessionCharts = function() {
      
      Object.keys(chartInstances).forEach(key => {
        if (key.startsWith('sessionChart')) {
          chartInstances[key].destroy();
          delete chartInstances[key];
        }
      });

      data.upcomingSessions.forEach((session) => {
        const canvas = document.getElementById('sessionChart' + session.id);
        
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const progress = session.occupancy;
          
          let chartColor;
          if (progress < 40) {
            chartColor = '#322C2C';
          } else if (progress >= 40 && progress < 60) {
            chartColor = '#7B6569';
          } else if (progress >= 60 && progress < 90) {
            chartColor = '#8C4650';
          } else {
            chartColor = '#D41736';
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

    createSessionCharts();

  }, 100);
});

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

/////////////////////////////////////////////////////
// Apartado de Students
// Función principal
    function academicData() {
      return {
        open: false,
        showFilters: false,
        viewMode: 'heatmap',
        selectedStudent: null,
        searchTerm: '',
        programFilter: 'all',
        filters: {
          program: '',
          status: ''
        },
        subjects: [
          // BSGM - General Education (12 courses)
          { id: 1, name: 'Algebra 1', program: 'BSGM', category: 'General Ed' },
          { id: 2, name: 'Algebra 2', program: 'BSGM', category: 'General Ed' },
          { id: 3, name: 'Quantitative Research', program: 'BSGM', category: 'General Ed' },
          { id: 4, name: 'English I', program: 'BSGM', category: 'General Ed' },
          { id: 5, name: 'Speech', program: 'BSGM', category: 'General Ed' },
          { id: 6, name: 'English II', program: 'BSGM', category: 'General Ed' },
          { id: 7, name: 'Intro to Art', program: 'BSGM', category: 'General Ed' },
          { id: 8, name: 'Philosophy & Ethics', program: 'BSGM', category: 'General Ed' },
          { id: 9, name: 'World History', program: 'BSGM', category: 'General Ed' },
          { id: 10, name: 'Political Science', program: 'BSGM', category: 'General Ed' },
          { id: 11, name: 'Public Health', program: 'BSGM', category: 'General Ed' },
          { id: 12, name: 'Environmental Systems', program: 'BSGM', category: 'General Ed' },
          
          // BSGM - Global Business (9 courses)
          { id: 13, name: 'Intro to Global Business', program: 'BSGM', category: 'Global Business' },
          { id: 14, name: 'Global Business Models', program: 'BSGM', category: 'Global Business' },
          { id: 15, name: 'Legal Issues', program: 'BSGM', category: 'Global Business' },
          { id: 16, name: 'Business Plan Dev 1', program: 'BSGM', category: 'Global Business' },
          { id: 17, name: 'Alternative Dispute', program: 'BSGM', category: 'Global Business' },
          { id: 18, name: 'Small Business Creation', program: 'BSGM', category: 'Global Business' },
          { id: 19, name: 'Business Plan Dev 2', program: 'BSGM', category: 'Global Business' },
          { id: 20, name: 'Accounting', program: 'BSGM', category: 'Global Business' },
          { id: 21, name: 'Finance', program: 'BSGM', category: 'Global Business' },
          
          // BSGM - Global Systems (6 courses)
          { id: 22, name: 'Intro to Global Systems', program: 'BSGM', category: 'Global Systems' },
          { id: 23, name: 'Visioning & Creativity', program: 'BSGM', category: 'Global Systems' },
          { id: 24, name: 'Generational Dynamics', program: 'BSGM', category: 'Global Systems' },
          { id: 25, name: 'Systems Thinking', program: 'BSGM', category: 'Global Systems' },
          { id: 26, name: 'Info Systems & Tech', program: 'BSGM', category: 'Global Systems' },
          { id: 27, name: 'Global Competitiveness', program: 'BSGM', category: 'Global Systems' },
          
          // BSGM - Management (7 courses)
          { id: 28, name: 'Principles of Mgmt', program: 'BSGM', category: 'Management' },
          { id: 29, name: 'Intl Managerial Leader', program: 'BSGM', category: 'Management' },
          { id: 30, name: 'Intl HR Management', program: 'BSGM', category: 'Management' },
          { id: 31, name: 'Strategic Management', program: 'BSGM', category: 'Management' },
          { id: 32, name: 'Risk Mgmt & Security', program: 'BSGM', category: 'Management' },
          { id: 33, name: 'Production & Ops Mgmt', program: 'BSGM', category: 'Management' },
          { id: 34, name: 'Sustainability', program: 'BSGM', category: 'Management' },
          
          // BSGM - Entrepreneurship & Marketing (5 courses)
          { id: 35, name: 'Intro to Entrepreneurship', program: 'BSGM', category: 'Entrepreneurship' },
          { id: 36, name: 'Global Venture Dev', program: 'BSGM', category: 'Entrepreneurship' },
          { id: 37, name: 'E-commerce & Social', program: 'BSGM', category: 'Entrepreneurship' },
          { id: 38, name: 'Intro to Marketing', program: 'BSGM', category: 'Marketing' },
          { id: 39, name: 'Global Marketing Research', program: 'BSGM', category: 'Marketing' },
          { id: 40, name: 'Global Advertising', program: 'BSGM', category: 'Marketing' },
          
          // BSGM - Practicum (2 courses)
          { id: 41, name: 'Practicum 1', program: 'BSGM', category: 'Practicum' },
          { id: 42, name: 'Practicum 2', program: 'BSGM', category: 'Practicum' },
          
          // ASSD - Software Development (20 courses)
          { id: 43, name: 'HTML & CSS Basics', program: 'ASSD', category: 'Web Development' },
          { id: 44, name: 'HTML & CSS Advanced', program: 'ASSD', category: 'Web Development' },
          { id: 45, name: 'Scratch Programming', program: 'ASSD', category: 'Programming' },
          { id: 46, name: 'JavaScript Basics', program: 'ASSD', category: 'Programming' },
          { id: 47, name: 'jQuery', program: 'ASSD', category: 'Programming' },
          { id: 48, name: 'JS & jQuery Project', program: 'ASSD', category: 'Programming' },
          { id: 49, name: 'React.js', program: 'ASSD', category: 'Frontend' },
          { id: 50, name: 'Python Basics', program: 'ASSD', category: 'Backend' },
          { id: 51, name: 'Redux', program: 'ASSD', category: 'Frontend' },
          { id: 52, name: 'Web API', program: 'ASSD', category: 'Backend' },
          { id: 53, name: 'Flask Framework', program: 'ASSD', category: 'Backend' },
          { id: 54, name: 'Django Basics', program: 'ASSD', category: 'Backend' },
          { id: 55, name: 'Django Advanced', program: 'ASSD', category: 'Backend' },
          { id: 56, name: 'Data Structures', program: 'ASSD', category: 'Computer Science' },
          { id: 57, name: 'UX Design', program: 'ASSD', category: 'Design' },
          { id: 58, name: 'Software Dev Lifecycle', program: 'ASSD', category: 'Project Management' },
          { id: 59, name: 'Software Architecture', program: 'ASSD', category: 'Project Management' },
          { id: 60, name: 'Capstone 1', program: 'ASSD', category: 'Capstone' },
          { id: 61, name: 'Capstone 2', program: 'ASSD', category: 'Capstone' },
          { id: 62, name: 'Capstone 3', program: 'ASSD', category: 'Capstone' }
        ],
        students: [
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
            progress: {} 
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
            progress: {} 
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
            progress: {} 
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
            progress: {} 
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
            progress: {} 
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
            progress: {} 
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
            progress: {} 
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
            progress: {} 
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
            progress: {} 
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
            progress: {} 
          }
        ],
        filteredStudents: [],
        
        init() {
          // Generar progreso aleatorio basado en el programa del estudiante
          this.students.forEach(student => {
            const studentProgram = student.program.includes('Bachelor') ? 'BSGM' : 'ASSD';
            const relevantSubjects = this.subjects.filter(s => s.program === studentProgram);
            
            relevantSubjects.forEach(subject => {
              const rand = Math.random();
              if (rand > 0.6) student.progress[subject.id] = 2; // Completada
              else if (rand > 0.4) student.progress[subject.id] = 1; // En progreso
              else if (rand > 0.2) student.progress[subject.id] = 0; // No iniciada
              else student.progress[subject.id] = 3; // Reprobada
            });
          });
          this.filteredStudents = [...this.students];
        },
        
        getStatusColor(status) {
          switch(status) {
            case 0: return 'bg-gray-400';
            case 1: return 'bg-[#F69A1C]';
            case 2: return 'bg-[#D41736]';
            case 3: return 'bg-[#252121]';
            default: return 'bg-gray-400';
          }
        },
        
        getStatusIcon(status) {
          switch(status) {
            case 0: return 'fa-solid fa-clock';
            case 1: return 'fa-solid fa-book-open';
            case 2: return 'fa-solid fa-check-circle';
            case 3: return 'fa-solid fa-times-circle';
            default: return 'fa-solid fa-clock';
          }
        },
        
        getStatusText(status) {
          switch(status) {
            case 0: return 'Not Started';
            case 1: return 'In Progress';
            case 2: return 'Completed';
            case 3: return 'Failed';
            default: return 'Unknown';
          }
        },
        
        calculateProgress(student) {
          const studentProgram = student.program.includes('Bachelor') ? 'BSGM' : 'ASSD';
          const relevantSubjects = this.subjects.filter(s => s.program === studentProgram);
          const completed = Object.entries(student.progress)
            .filter(([id, status]) => {
              const subjectId = parseInt(id);
              return relevantSubjects.some(s => s.id === subjectId) && status === 2;
            }).length;
          return (completed / relevantSubjects.length) * 100;
        },
        
        getCompletedCount(student) {
          const studentProgram = student.program.includes('Bachelor') ? 'BSGM' : 'ASSD';
          const relevantSubjects = this.subjects.filter(s => s.program === studentProgram);
          return Object.entries(student.progress)
            .filter(([id, status]) => {
              const subjectId = parseInt(id);
              return relevantSubjects.some(s => s.id === subjectId) && status === 2;
            }).length;
        },
        
        getTotalSubjects(student) {
          const studentProgram = student.program.includes('Bachelor') ? 'BSGM' : 'ASSD';
          return this.subjects.filter(s => s.program === studentProgram).length;
        },
        
        getFilteredSubjects() {
          if (this.programFilter === 'all') return this.subjects;
          return this.subjects.filter(s => s.program === this.programFilter);
        },
        
        getFilteredStudentsByProgram() {
          if (this.programFilter === 'all') return this.filteredStudents;
          const programType = this.programFilter === 'BSGM' ? 'Bachelor' : 'Associate';
          return this.filteredStudents.filter(s => s.program.includes(programType));
        },
        
        getAverageProgress() {
          const total = this.students.reduce((sum, student) => sum + this.calculateProgress(student), 0);
          return total / this.students.length;
        },
        
        getCompletedStudents() {
          return this.students.filter(s => this.calculateProgress(s) === 100).length;
        },
        
        getBehindStudents() {
          return this.students.filter(s => this.calculateProgress(s) < 50).length;
        },
        
        filterStudents() {
          this.filteredStudents = this.students.filter(student => {
            return student.name.toLowerCase().includes(this.searchTerm.toLowerCase());
          });
        },
        
        applyFilters() {
          this.filteredStudents = this.students.filter(student => {
            let match = true;
            
            if (this.filters.program) {
              match = match && student.program.toLowerCase().includes(this.filters.program);
            }
            
            if (this.filters.status) {
              const progress = this.calculateProgress(student);
              if (this.filters.status === 'complete') match = match && progress === 100;
              else if (this.filters.status === 'ontrack') match = match && progress >= 50 && progress < 100;
              else if (this.filters.status === 'behind') match = match && progress < 50;
            }
            
            if (this.searchTerm) {
              match = match && student.name.toLowerCase().includes(this.searchTerm.toLowerCase());
            }
            
            return match;
          });
        },
        
        clearFilters() {
          this.filters = { program: '', status: '' };
          this.searchTerm = '';
          this.filteredStudents = [...this.students];
        }
      }
    }
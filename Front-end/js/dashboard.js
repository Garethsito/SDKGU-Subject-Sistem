//Front-end/js/dashboard.js
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
      totalStudents: 0,
      activeSessions: 0,
      enrollmentGrowth: 0, 
      criticalSessions: 0,
    },
    
    // Nueva estructura para materias faltantes
    missingSubjects: {
      labels: [], // Nombres de las materias
      data: []    // Cantidad de estudiantes faltantes por materia
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
      console.log('Enrollment Growth:', this.stats.enrollmentGrowth);
    },

    async fetchData() {
      try {
        // Obtener total de estudiantes
        const resStudents = await fetch('http://localhost:3000/api/students/count');
        const dataStudents = await resStudents.json();
        if (dataStudents.total !== undefined) {
          this.stats.totalStudents = dataStudents.total;
          console.log('✅ Total de estudiantes actualizado:', dataStudents.total);
        }

        // Obtener enrollment growth desde el backend
        try {
          const resGrowth = await fetch('http://localhost:3000/api/students/enrollment-growth');
          const dataGrowth = await resGrowth.json();
          if (dataGrowth.growth !== undefined) {
            this.stats.enrollmentGrowth = dataGrowth.growth;
            console.log('Enrollment Growth actualizado:', dataGrowth.growth);
          }
        } catch (error) {
          console.warn('No se pudo obtener enrollment growth del backend, usando valor por defecto');
          this.stats.enrollmentGrowth = this.calculateEnrollmentGrowth();
        }

        // 🆕 Obtener estudiantes con materias faltantes
        try {
          const resMissing = await fetch('http://localhost:3000/api/students/missing-subjects');
          const dataMissing = await resMissing.json();
          if (dataMissing.missingSubjects) {
            this.missingSubjects = dataMissing.missingSubjects;
            console.log('📊 Materias faltantes cargadas:', dataMissing.missingSubjects);
          }
        } catch (error) {
          console.warn('No se pudo obtener materias faltantes, usando datos de ejemplo');
          // Datos de ejemplo si no hay endpoint
          this.missingSubjects = {
            labels: ['Math 101', 'English 102', 'History 201', 'Science 301', 'Art 105', 'PE 100'],
            data: [45, 32, 28, 51, 19, 38]
          };
        }

        // 🧠 Obtener sesiones desde el backend
        const res = await fetch('http://localhost:3000/api/students/sessions');
        const data = await res.json();
        this.allSessions = data;
        console.log("📡 Sesiones cargadas desde la BD:", data);

      } catch (error) {
        console.error('❌ Error obteniendo datos del dashboard:', error);
        this.stats.enrollmentGrowth = this.calculateEnrollmentGrowth();
      }
    },

    // Calcular crecimiento de matrícula
    calculateEnrollmentGrowth() {
      if (this.allSessions.length === 0) return 0;
      
      const activeSessions = this.allSessions.filter(s => s.status === 'active').length;
      const totalSessions = this.allSessions.length;
      
      const avgOccupancy = this.allSessions.reduce((sum, s) => sum + s.occupancy, 0) / totalSessions;
      const growthRate = ((avgOccupancy - 60) / 60) * 100;
      
      return Math.round(growthRate * 10) / 10;
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
    
    // 🔥 FIX: Actualiza estadísticas basadas en upcomingSessions
    updateStats() {
      this.stats.criticalSessions = this.allSessions.filter(s => s.occupancy < 40).length;
      
      if (this.upcomingSessions.length > 0) {
        this.stats.activeSessions = this.upcomingSessions.filter(s => s.status === 'active').length;
      } else {
        this.stats.activeSessions = 0;
      }
      
      if (this.stats.enrollmentGrowth === 0) {
        this.stats.enrollmentGrowth = this.calculateEnrollmentGrowth();
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

// Variables Globales
if (typeof chartInstances === 'undefined') {
  var chartInstances = {};
}

// Inicialización para las graficas en cuestión a index.html
document.addEventListener('DOMContentLoaded', function () {
  
  setTimeout(() => {
    const data = Alpine.$data(document.body);
    
    // 🆕 Gráfica 1: Estudiantes con Materias Faltantes (Barras Horizontales)
    const canvas1 = document.getElementById('miGrafica');
    if (!canvas1) return;
    
    const ctx1 = canvas1.getContext('2d');
    
    chartInstances['barChart'] = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: data.missingSubjects.labels,
        datasets: [{
          label: 'Missing Students',
          data: data.missingSubjects.data,
          backgroundColor: [
            '#A6192E',
            '#D41736',
            '#8E1C2D',
            '#A6192E',
            '#D41736',
            '#8E1C2D'
          ],
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y', // Barras horizontales
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'Students: ' + context.parsed.x;
              }
            }
          }
        },
        scales: {
          x: { 
            beginAtZero: true,
            ticks: {
              stepSize: 10
            }
          },
          y: {
            ticks: {
              font: {
                size: 11
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
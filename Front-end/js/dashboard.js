// Variables Globales
// Objeto para almacenar todas las instancias de Chart.js
if (typeof chartInstances === 'undefined') {
  var chartInstances = {};
}

/* Función principal de datos y métodos de Alpine.js
Esta función retorna un objeto con todas las propiedades y métodos que serán
accesibles en el HTML mediante x-data, x-text, x-show, etc.
 */
function dashboardData() {
  return {
    // Controla si el sidebar está abierto o cerrado
    open: false,
    
    //Almacena el texto de búsqueda del usuario
    searchQuery: '',
    
    // Controla si el panel de filtros está visible
    showFilters: false,

    // Variables para el modal
    openModalFlag: false,
    selectedSession: {},

    //upcomingSessions - Array de sesiones que se muestran en pantalla
    upcomingSessions: [],

    /* Filtros
     almacena todos los filtros seleccionados por el usuario
     */
    filters: {
      program: 'all',           // 'all', 'bachelor', 'associate'
      session: 'all',           // 'all', 'session1', 'session2', etc.
      occupancy: 'all',         // 'all', 'critical', 'low', 'optimal', 'full'
      activeSessions: false,      // Checkbox: grupos activos
      lowEnrollment: false,     // Checkbox: baja inscripción
      transfers: false,         // Checkbox: estudiantes con transferencias
      prerequisites: false      // Checkbox: prerequisitos pendientes
    },
    
    
    /* Metricas/Estadísticas principales
     stats - Objeto con las estadísticas principales del dashboard
     Se actualizan dinámicamente según los filtros aplicados
     */
    stats: {
      totalStudents: 1247,      // Total de estudiantes
      activeSessions: 38,         // Grupos activos
      avgOccupancy: 72,         // Ocupación promedio (porcentaje)
      criticalSessions: 0,        // Grupos con <40% de ocupación
    },
    

    
    /* Datos para las gráficas
     sessionOccupancy - Datos para la gráfica de barras
     */
    sessionOccupancy: {
      labels: ['Session 1', 'Session 2', 'Session 3', 'Session 4', 'Session 5', 'Session 6'],
      data: [85, 72, 68, 91, 55, 78]  // Porcentajes de ocupación
    },
    
    // studentDistribution - Datos para la gráfica de pie
    studentDistribution: {
      labels: ["Bachelor's", 'Associate'],
      data: [754, 493]  // # de estudiantes por programa
    },
    
    /* Datos de sesiones (Simulación)
      allSessions - Array completo con TODAS las sesiones disponibles
    */
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
         
    // Métodos
    
    /* init() - Se ejecuta automáticamente cuando Alpine.js se inicializa
     Copia todas las sesiones al array de sesiones visibles a upcomingSessions
     */
    init() {
      // El operador spread [...] crea una copia del array
      this.upcomingSessions = [...this.allSessions];
      
      // Calcular estadísticas iniciales
      this.updateStats();
      
      // Debug: verificar cuántas sesiones críticas hay
      console.log('Total sessions:', this.allSessions.length);
      console.log('Critical sessions:', this.stats.criticalSessions);
      console.log('Sessions with occupancy < 40:', this.allSessions.filter(s => s.occupancy < 40));
    },
    
    // openModal() - Abre el modal con los detalles de la sesión
    openModal(session, type='details') {
      this.selectedSession = {...session};
      this.openModalFlag = true;
      
      // Crear gráfica del modal después de que se muestre
      setTimeout(() => {
        this.createModalChart();
      }, 100);
    },

    // createModalChart() - Crea la gráfica de donut en el modal
    createModalChart() {
      const chartId = 'modalChart' + this.selectedSession.id;
      const canvas = document.getElementById(chartId);
      
      if (canvas) {
        // Destruir gráfica anterior si existe
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

    // clearFilters() - Limpia todos los filtros y restaura el estado inicial
    clearFilters() {
      // Valor por defecto para cada filtro
      this.filters = {
        program: 'all',
        session: 'all',
        occupancy: 'all',
        activeSessions: false,
        lowEnrollment: false,
        transfers: false,
        prerequisites: false
      };
      
      // Restaurar todas las sesiones (sin filtros)
      this.upcomingSessions = [...this.allSessions];
      
      // Recalcular las estadísticas con todos los datos
      this.updateStats();
      
      // El setTimeout espera a que Alpine.js actualice el DOM (100ms)
      setTimeout(() => {
        window.createSessionCharts();
      }, 100);
    },

    // applyFilters() - Aplica los filtros seleccionados y actualiza la vista
    applyFilters() {
      console.log('Aplicando filtros:', this.filters);
      
      // Copia de TODAS las sesiones
      let filtered = [...this.allSessions];
      
      if (this.filters.program !== 'all') {
        // Convertir el valor del filtro al nombre completo del programa
        const programName = this.filters.program === 'bachelor' ? "Bachelor's" : 'Associate';
        
        // filter() crea un nuevo array con solo las sesiones que cumplan la condición
        filtered = filtered.filter(session => session.program === programName);
      }

      if (this.filters.session !== 'all') {
        // Extraer el # de la sesion del string "session1", etc. y se convierte a entero
        const sessionNumber = parseInt(this.filters.session.replace('session', ''));
        
        // Filtrar solo la sesión que coincida con el ID
        filtered = filtered.filter(session => session.id === sessionNumber);
      }
      
      if (this.filters.occupancy !== 'all') {
        filtered = filtered.filter(session => {
          const occ = session.occupancy; // Obtener el porcentaje de ocupación
          
          // Switch para evaluar el rango de ocupación
          switch(this.filters.occupancy) {
            case 'critical': 
              return occ < 40;              // Crítico: menos del 40%
            case 'low': 
              return occ >= 40 && occ < 60; // Bajo: entre 40% y 60%
            case 'optimal': 
              return occ >= 60 && occ < 90; // Óptimo: entre 60% y 90%
            case 'full': 
              return occ >= 90;             // Lleno: 90% o más
            default: 
              return true;                  // Si no coincide, incluir la sesión
          }
        });
      }
      
      if (this.filters.activeSessions) {
        // Solo incluir sesiones con status === 'active'
        filtered = filtered.filter(session => session.status === 'active');
      }
      
      if (this.filters.lowEnrollment) {
        // Solo incluir sesiones con lowEnrollment === true
        filtered = filtered.filter(session => session.lowEnrollment === true);
      }
      
      // NOTA: Los filtros transfers y prerequisites no tienen datos de ejemplo. 

      // Actualización del array de sesiones visibles con los resultados filtrados
      this.upcomingSessions = filtered;
      
      // Recalcular las estadisticas segun en las sesiones filtradas
      this.updateStats();
      
      // Recrear las graficas de donut para las sesiones visibles
      setTimeout(() => {
        window.createSessionCharts();
      }, 100);
      
      // Cerrar el panel de filtros
      this.showFilters = false;
      console.log('Sesiones filtradas:', filtered.length);
    },
    
    // Recalcular las estadisticas segun en las sesiones filtradas
    updateStats() {
      // SIEMPRE calcular critical sessions desde allSessions (independiente de filtros)
      this.stats.criticalSessions = this.allSessions.filter(s => s.occupancy < 40).length;
      
      // Solo calcular el resto si hay sesiones para mostrar
      if (this.upcomingSessions.length > 0) {
        
        // reduce() suma todos los valores de ocupación
        const totalOccupancy = this.upcomingSessions.reduce((sum, s) => sum + s.occupancy, 0);
        // Dividir entre el número de sesiones y redondear
        this.stats.avgOccupancy = Math.round(totalOccupancy / this.upcomingSessions.length);
        
        // filter().length cuenta las sesiones q cumplen la condición
        this.stats.activeSessions = this.upcomingSessions.filter(s => s.status === 'active').length;
      }
    },

    redirectToCriticalSessions() {
      // Filtrar sesiones críticas
      const criticalSessions = this.allSessions.filter(s => s.occupancy < 40);
      
      console.log('Critical sessions found:', criticalSessions);
      console.log('Number of critical sessions:', criticalSessions.length);
      
      // Guardar en sessionStorage (persiste entre páginas)
      sessionStorage.setItem('criticalSessionsFilter', 'true');
      
      console.log('sessionStorage set to: true');
      
      // Redirigir
      window.location.href = 'session.html';
    }

  }
}

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function () {
  
  // Esperar 100ms para inicializar
  setTimeout(() => {
    // Obtener los datos de Alpine.js del body
    const data = Alpine.$data(document.body);
    
    // Grafica 1: Ocupación por sesión (Barras)
    const canvas1 = document.getElementById('miGrafica');
    if (!canvas1) return; // Salir si no existe el canvas (no estamos en index.html)
    
    const ctx1 = canvas1.getContext('2d');
    
    // Crear la gráfica y guardar la instancia en chartInstances
    chartInstances['barChart'] = new Chart(ctx1, {
      type: 'bar', 
      data: {
        // Etiquetas del eje X 
        labels: data.sessionOccupancy.labels,
        datasets: [{
          label: 'Occupancy %',
          // Datos del eje Y 
          data: data.sessionOccupancy.data,
          // Colores diferentes para cada barra
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
        responsive: true,              // Se adapta al tamaño del contenedor
        maintainAspectRatio: false,   // No mantiene proporción fija
        plugins: {
          legend: { display: false }   // Ocultar la leyenda
        },
        scales: {
          y: { 
            beginAtZero: true,         // El eje Y comienza en 0
            max: 100,                  // Máximo en 100%
            ticks: {
              // Función para agregar el símbolo % a cada tick
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });

    // Grafica 2 : Distribución de estudiantes (Pie)
    const canvas2 = document.getElementById('miGrafica2');
    if (!canvas2) return; // Salir si no existe el canvas
    
    const ctx2 = canvas2.getContext('2d');
    
    chartInstances['pieChart'] = new Chart(ctx2, {
      type: 'pie', 
      data: {
        // Etiquetas para cada sección del pie
        labels: data.studentDistribution.labels,
        datasets: [{
          // Datos numéricos para cada sección
          data: data.studentDistribution.data,
          // Colores para cada sección
          backgroundColor: [
            '#A6192E',  // Rojo para Bachelor's
            '#2D2828'   // Gris oscuro para Associate
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: true,           // Mostrar leyenda
            position: 'bottom',      // Posicionar abajo
            labels: { 
              boxWidth: 12,          // Ancho del cuadro de color
              padding: 5,            // Espaciado
              font: { size: 10 }     // Tamaño de fuente
            }
          }
        }
      }
    });

    /* Graficas de Donut para cada sesión
    createSessionCharts() - Crea gráficas de donut para cada sesión visible
    */
    window.createSessionCharts = function() {
      
      // Destruimos todo e iniciamos de nuevo
      Object.keys(chartInstances).forEach(key => {
        // Solo destruir graficas que empiecen con "sessionChart"
        if (key.startsWith('sessionChart')) {
          chartInstances[key].destroy();    // Destruir la instancia de Chart.js
          delete chartInstances[key];       // Eliminar la referencia del objeto
        }
      });

      // Creación de nuevas gráficas SOLO para las sesiones visibles
      data.upcomingSessions.forEach((session) => {
        // Buscar el canvas con el ID correspondiente
        const canvas = document.getElementById('sessionChart' + session.id);
        
        // Verificar que el canvas existe en el DOM
        if (canvas) {
          const ctx = canvas.getContext('2d');
          
          // Crear la grafica y guardar la instancia
          chartInstances['sessionChart' + session.id] = new Chart(ctx, {
            type: 'doughnut', 
            data: {
              labels: ['Occupied', 'Available'],
              datasets: [{
                // Primer valor: porcentaje ocupado - Segundo valor: porcentaje disponible (100 - ocupado)
                data: [session.occupancy, 100 - session.occupancy],
                backgroundColor: [
                  '#D41736',                    // Rojo para ocupado
                  'rgba(210, 210, 210, 0.4)'   // Gris transparente para disponible
                ],
                borderWidth: 0 
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '70%',  // Tamaño del hueco en el centro (70% del radio)
              plugins: {
                legend: { display: false },  // Ocultar leyenda
                tooltip: {
                  // Personalizar el texto del tooltip al hacer hover
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

    // Crear las gráficas iniciales al cargar la página
    createSessionCharts();

  }, 100); // Fin del setTimeout
}); 

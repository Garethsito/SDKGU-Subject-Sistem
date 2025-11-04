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
      occupancy: 'all', // Este se re-interpreta como "demand"
      prerequisites: 'all'
    },
    
    // Variable de estado del modal de estudiantes
    modalStudentFilter: 'current', // 'current', 'passed', 'missing'

    // Variables para el modal de CREAR SESIÓN
    showCreateSessionModal: false,
    newSessionTemplate: null, // Guarda el subject original (ej. GBUS 404)
    newSession: { // Datos del formulario del nuevo modal
      number: null, 
      startDate: '', 
      endDate: '', 
      status: 'Planning', 
      subjects: [] 
    },
    newSessionSubjectsInput: '', // Input de texto para materias

    // NUEVO: Objeto Toast para notificaciones
    toast: {
      show: false,
      message: '',
      type: 'success' // 'success' o 'error'
    },
    
    // Array original que NUNCA se modifica
    allSubjects: [
      { 
        code: 'GBUS 404', 
        program: 'ASSD', 
        session: 'Session 1', 
        maxStudents: 30,
        prerequisites: ['GBUS 101', 'GBUS 202'],
        modality: 'Online',
        instructor: 'Dr. Evelyn Reed',
        students: [ // Inscritos en ESTA SESIÓN
          { name: 'Juan Pérez', id: '001', email: 'juan@sdgku.edu' }
        ],
        courseData: { // Datos de TODO el curso 'GBUS 404'
          passedStudents: [
            { name: 'Gabriel Soto', id: '101', email: 'gabriel@sdgku.edu' },
            { name: 'Elena Torres', id: '102', email: 'elena@sdgku.edu' }
          ],
          missingStudents: [
            { name: 'Miguel Ángel', id: '201', email: 'miguel@sdgku.edu' },
            { name: 'Valeria Luna', id: '202', email: 'valeria@sdgku.edu' },
            { name: 'Roberto Fox', id: '203', email: 'roberto@sdgku.edu' }
          ]
        }
      },
      { 
        code: 'GBUS 404', 
        program: 'ASSD', 
        session: 'Session 2', 
        maxStudents: 25,
        prerequisites: ['GBUS 101', 'GBUS 202'],
        modality: 'In-Person',
        instructor: 'Dr. Evelyn Reed',
        students: [], // Inscritos en ESTA SESIÓN
        courseData: { // Datos duplicados (en un sistema real, esto se cargaría por 'GBUS 404')
          passedStudents: [
            { name: 'Gabriel Soto', id: '101', email: 'gabriel@sdgku.edu' },
            { name: 'Elena Torres', id: '102', email: 'elena@sdgku.edu' }
          ],
          missingStudents: [
            { name: 'Miguel Ángel', id: '201', email: 'miguel@sdgku.edu' },
            { name: 'Valeria Luna', id: '202', email: 'valeria@sdgku.edu' },
            { name: 'Roberto Fox', id: '203', email: 'roberto@sdgku.edu' }
          ]
        }
      },
      { 
        code: 'ACCT 301', 
        program: 'ASSD', 
        session: 'Session 1', 
        maxStudents: 25,
        prerequisites: ['ACCT 101'],
        modality: 'In-Person',
        instructor: 'Prof. Michael Bay',
        students: [
          { name: 'Ana Martínez', id: '004', email: 'ana@sdgku.edu' },
          { name: 'Pedro Sánchez', id: '005', email: 'laura@sdgku.edu' }
        ],
        courseData: {
          passedStudents: [ { name: 'Estudiante Pasado 1', id: '301', email: 'ep1@sdgku.edu' } ],
          missingStudents: [ { name: 'Estudiante Faltante 1', id: '401', email: 'ef1@sdgku.edu' } ]
        }
      },
      // Ejemplo de ALTA DEMANDA (tu ejemplo de 19/22)
      { 
        code: 'BIOL 302', 
        program: 'BGSM', 
        session: 'Session 1', 
        maxStudents: 20,
        prerequisites: ['BIOL 101', 'CHEM 101'],
        modality: 'Online',
        instructor: 'Dr. Evelyn Reed',
        students: [], // 0 Inscritos
        courseData: {
          passedStudents: [ // 3 Pasados
            { name: 'Pasado Bio 1', id: '501', email: 'pb1@sdgku.edu' },
            { name: 'Pasado Bio 2', id: '502', email: 'pb2@sdgku.edu' },
            { name: 'Pasado Bio 3', id: '503', email: 'pb3@sdgku.edu' }
          ],
          missingStudents: [ // 19 Faltantes
            { name: 'Faltante Bio 1', id: '601', email: 'fb1@sdgku.edu' }, { name: 'Faltante Bio 2', id: '602', email: 'fb2@sdgku.edu' },
            { name: 'Faltante Bio 3', id: '603', email: 'fb3@sdgku.edu' }, { name: 'Faltante Bio 4', id: '604', email: 'fb4@sdgku.edu' },
            { name: 'Faltante Bio 5', id: '605', email: 'fb5@sdgku.edu' }, { name: 'Faltante Bio 6', id: '606', email: 'fb6@sdgku.edu' },
            { name: 'Faltante Bio 7', id: '607', email: 'fb7@sdgku.edu' }, { name: 'Faltante Bio 8', id: '608', email: 'fb8@sdgku.edu' },
            { name: 'Faltante Bio 9', id: '609', email: 'fb9@sdgku.edu' }, { name: 'Faltante Bio 10', id: '610', email: 'fb10@sdgku.edu' },
            { name: 'Faltante Bio 11', id: '611', email: 'fb11@sdgku.edu' }, { name: 'Faltante Bio 12', id: '612', email: 'fb12@sdgku.edu' },
            { name: 'Faltante Bio 13', id: '613', email: 'fb13@sdgku.edu' }, { name: 'Faltante Bio 14', id: '614', email: 'fb14@sdgku.edu' },
            { name: 'Faltante Bio 15', id: '615', email: 'fb15@sdgku.edu' }, { name: 'Faltante Bio 16', id: '616', email: 'fb16@sdgku.edu' },
            { name: 'Faltante Bio 17', id: '617', email: 'fb17@sdgku.edu' }, { name: 'Faltante Bio 18', id: '618', email: 'fb18@sdgku.edu' },
            { name: 'Faltante Bio 19', id: '619', email: 'fb19@sdgku.edu' }
          ]
        }
      },

    ],
    
    // Array que se muestra en la UI (este SÍ cambia con filtros)
    subjects: [],
    
    // Inicialización
    init() {
      // Calcular métricas para cada sesión
      this.allSubjects.forEach(s => {
        // 1. Ocupación de la SESIÓN (para el modal)
        s.occupancy = (s.maxStudents > 0) ? Math.round((s.students.length / s.maxStudents) * 100) : 0;
        
        // 2. Métrica de DEMANDA DEL CURSO (para la tarjeta)
        if (s.courseData) {
          const enrolled = s.students.length; 
          const passed = s.courseData.passedStudents.length;
          const missing = s.courseData.missingStudents.length;
          const totalPool = enrolled + passed + missing;
          
          s.missingCount = missing; // Cantidad de faltantes
          s.missingPercent = (totalPool > 0) ? Math.round((missing / totalPool) * 100) : 0;
        } else {
          s.missingCount = 0;
          s.missingPercent = 0;
        }
      });
      
      this.subjects = [...this.allSubjects];
    },
    
    getCardBg(occupancy) {
      if (occupancy >= 70) return 'rgba(255, 255, 255, 0.6)';
      if (occupancy >= 40) return 'rgba(255, 255, 255, 0.4)';
      return 'rgba(255, 194, 194, 0.4)';
    },
    
    showStudents(subject) {
      this.selectedSubject = subject;
      this.modalStudentFilter = 'current'; // Resetear el filtro del modal
    },
    
    // recalcula las métricas (usado por enroll/remove)
    recalculateMetrics(subject) {
      // Actualizar TODAS las tarjetas que comparten el curso (ej. GBUS 404)
      this.allSubjects.forEach(s => {
        if (s.code === subject.code) {
          // Recalcula la métrica de demanda para todas las sesiones del mismo curso
          const s_enrolled = s.students.length;
          const s_passed = s.courseData.passedStudents.length;
          const s_missing = s.courseData.missingStudents.length;
          const s_totalPool = s_enrolled + s_passed + s_missing;
          
          s.missingCount = s_missing;
          s.missingPercent = (s_totalPool > 0) ? Math.round((s_missing / s_totalPool) * 100) : 0;
          
          // También recalcula la ocupación de la sesión (por si acaso)
          s.occupancy = (s.maxStudents > 0) ? Math.round((s.students.length / s.maxStudents) * 100) : 0;
        }
      });
    },
    
    // Lógica de Inscripción
    enrollStudent(student) {
      if (!this.selectedSubject) return;

      this.selectedSubject.courseData.missingStudents = this.selectedSubject.courseData.missingStudents.filter(s => s.id !== student.id);
      this.selectedSubject.students.push(student);
      
      this.recalculateMetrics(this.selectedSubject);
    },
    
    // Lógica de "Reprobar"
    removeStudent(studentId) {
      if (!this.selectedSubject) return;
      
      const student = this.selectedSubject.students.find(s => s.id === studentId);
      if (!student) return;

      this.selectedSubject.students = this.selectedSubject.students.filter(s => s.id !== studentId);
      this.selectedSubject.courseData.missingStudents.push(student);
      
      this.recalculateMetrics(this.selectedSubject);
    },
    
    // --- NUEVAS FUNCIONES PARA EL MODAL DE CREAR SESIÓN ---
    openCreateSessionModal() {
      // 1. Guardar la plantilla del curso que estamos creando
      this.newSessionTemplate = this.selectedSubject; 
      
      // 2. Resetear el formulario y pre-llenar la materia
      this.newSession = { 
        number: null, 
        startDate: '', 
        endDate: '', 
        status: 'Planning', 
        subjects: [this.selectedSubject.code] // Pre-llena el array
      };
      // Pre-llena el CAMPO DE TEXTO
      this.newSessionSubjectsInput = this.selectedSubject.code;
      
      // 3. Cerrar el modal de alumnos y abrir el nuevo modal
      this.selectedSubject = null; 
      this.showCreateSessionModal = true;
    },

    // Actualiza el array de 'subjects' del newSession (del form de session.html)
    updateNewSessionSubjectsArray() {
      this.newSession.subjects = this.newSessionSubjectsInput.split(',')
        .map(s => s.trim())
        .filter(Boolean);
    },

    // MODIFICADO: Guarda la nueva sesión
    saveNewSession() {
      if (!this.newSession.number || !this.newSession.startDate || !this.newSession.endDate) {
        alert('Please fill Session Number, Start Date, and End Date.');
        return;
      }
      
      // LÓGICA MODIFICADA: NO CREAR, SÓLO MOSTRAR ÉXITO
      console.log('Simulating session creation with:', this.newSession);
      
      // 1. Cerrar el modal
      this.showCreateSessionModal = false;
      
      // 2. Mostrar mensaje de éxito
      this.showToast(`Session ${this.newSession.number} for ${this.newSessionSubjectsInput} created successfully!`, 'success');

      // 3. Resetear el formulario (buena práctica)
      this.newSession = { number: null, startDate: '', endDate: '', status: 'Planning', subjects: [] };
      this.newSessionSubjectsInput = '';
      this.newSessionTemplate = null;
    },

    // NUEVO: Función para mostrar el Toast
    showToast(message, type = 'success') {
      this.toast.message = message;
      this.toast.type = type;
      this.toast.show = true;
      setTimeout(() => {
        this.toast.show = false;
      }, 3000); // Ocultar después de 3 segundos
    },
    
    // --- Filtros ---
    
    clearFilters() {
      this.filters = {
        program: 'all',
        session: 'all',
        occupancy: 'all',
        prerequisites: 'all'
      };
      this.subjects = [...this.allSubjects];
      this.message = '';
    },
    
    applyFilters() {
      console.log('Aplicando filtros:', this.filters);
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
      
      // Filtro de "Occupancy" (Demanda)
      if (this.filters.occupancy !== 'all') {
        filtered = filtered.filter(s => {
          const missingPercent = s.missingPercent;
          switch(this.filters.occupancy) {
            case 'critical': return missingPercent >= 75; // Alta demanda
            case 'low': return missingPercent >= 40 && missingPercent < 75; // Demanda media
            case 'optimal': return missingPercent < 40; // Demanda baja
            case 'full': return missingPercent === 0; // Nadie falta
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
      if (this.filters.occupancy !== 'all') activeFilters.push('Demand'); // Cambiado
      if (this.filters.prerequisites !== 'all') activeFilters.push('Prerequisites');
      
      if (activeFilters.length > 0) {
        this.message = `Filters applied: ${activeFilters.join(', ')} | Showing ${this.subjects.length} subject(s)`;
      } else {
        this.message = '';
      }
    }
  }
}
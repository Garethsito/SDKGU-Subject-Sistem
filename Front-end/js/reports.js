function reports() {
  return {
    open: false,
    activeReport: 'general',
    searchQuery: '',
    selectedStudent: null,
    
    editingGrades: false,
    courseSearchQuery: '',
    coursesForEditing: [],
    modifiedCourses: [],
    savingGrades: false,
    saveStatus: { type: '', message: '' },
    editingStudentId: null,
    
    opcionesGeneral: {
      totalAlumnos: false,
      listaAlumnos: false,
      CantidaddeSesiones: false,
      DescripcionSesion: false,
      All: false
    },

    reportFilters: {
      program: 'all',
      demandLevel: 'all',
      minStudents: 0,
      courseType: 'all',
      sortBy: 'demand_desc'
    },
    
    students: [],
    sessionData: [],
    subjects: [],
    programs: [],
    recommendations: [],
    expandedRecommendations: Alpine.reactive({}),
    loading: true,
    availablePrograms: [],
    error: null,

    // Paginación para recomendaciones
    recommendationsPage: 1,
    recommendationsPerPage: 10,
    reportFilters: {
      program: 'all',
      demandLevel: 'all',
      minStudents: 0,
      courseType: 'all',
      sortBy: 'demand_desc'
    },
    open: false,
    showFilters: false,  

    apiUrl: 'http://localhost:3000/api',
    
    // ✅ CORREGIDO: init
    async init() {
      console.log('🚀 Iniciando carga de datos de reportes...');
      await this.loadAllData();
      await this.loadRecommendations();
    },
    
    async loadAllData() {
      this.loading = true;
      this.error = null;
      
      try {
        await Promise.all([
          this.loadPrograms(),
          this.loadCourses(),
          this.loadStudents(),
          this.loadSessions()
        ]);
        
      console.log('✅ Datos cargados correctamente:', {
        programs: this.programs.length,
        courses: this.subjects.length,
        students: this.students.length,
        sessions: this.sessionData.length
      });

      this.availablePrograms = [...new Set(this.students.map(s => s.program))].filter(Boolean);
      console.log('📋 Programas disponibles:', this.availablePrograms);

      } catch (error) {
        console.error('❌ Error cargando datos:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async loadPrograms() {
      try {
        const response = await fetch(`${this.apiUrl}/programs`);
        if (!response.ok) throw new Error('Error loading programs');
        this.programs = await response.json();
        console.log('📚 Programas cargados:', this.programs.length);
      } catch (error) {
        console.error('Error loading programs:', error);
        throw error;
      }
    },
    
    async loadCourses() {
      try {
        const response = await fetch(`${this.apiUrl}/courses`);
        if (!response.ok) throw new Error('Error loading courses');
        const courses = await response.json();
        
        this.subjects = courses.map(course => ({
          id: parseInt(course.id),
          name: course.courseName || course.name,
          code: course.courseCode || course.code,
          units: course.credits || 3
        }));
        
        console.log('📖 Cursos cargados:', this.subjects.length);
      } catch (error) {
        console.error('Error loading courses:', error);
        throw error;
      }
    },
    
    async loadStudents() {
      try {
        const response = await fetch(`${this.apiUrl}/students`);
        if (!response.ok) throw new Error('Error loading students');
        const studentsData = await response.json();
        
        this.students = studentsData.map(student => ({
          id: student.id,
          studentId: student.studentIdNumber || student.studentId,
          name: student.name || `${student.firstName} ${student.lastName}`,
          firstName: student.firstName,
          middleName: student.middleName,
          lastName: student.lastName,
          phone: student.phone,
          emailPersonal: student.email || 'N/A',
          emailSDGKU: student.sdgkuEmail || 'N/A',
          status: student.status,
          program: typeof student.program === 'object' && student.program !== null 
            ? student.program.programName || 'N/A' 
            : student.program,
          modality: student.modality,
          cohort: student.cohort,
          language: student.language,
          totalUnits: student.totalUnits,
          transferredUnits: student.transferredUnits,
          unitsEarned: student.totalUnitsEarned,
          startDate: student.startDate,
          scheduledCompletion: student.scheduledCompletionDate,
          graduationDate: student.graduationDate,
          completedSubjects: student.completedSubjects || [],
          requiredSubjects: student.requiredSubjects || [],
          grades: student.grades || {},
          progress: {}
        }));
        
        console.log('👥 Estudiantes cargados:', this.students.length);
      } catch (error) {
        console.error('Error loading students:', error);
        throw error;
      }
    },
    
   async loadSessions() {
  try {
    const response = await fetch(`${this.apiUrl}/sessions`);
    if (!response.ok) throw new Error('Error loading sessions');
    const sessions = await response.json();

    sessions.forEach(s => console.log('Raw session:', s));

    this.sessionData = sessions.map(session => {
      console.log('Mapping session:', session.sessionName);
      
      const materiaIds = session.subjects || [];
      
      // Usar el occupancy que viene de la API (estudiantes asignados)
      const enrolled = session.occupancy || 0;
      
      // Capacidad = número de materias × 50 estudiantes por materia
      const capacity = materiaIds.length * 50;
      const available = Math.max(0, capacity - enrolled);

      // Buscar qué estudiantes están asignados a esta sesión
      const assignedStudents = this.students.filter(student => 
        student.assignedSession === session.id || 
        student.sessionId === session.id ||
        student.currentSessionId === session.id // Ajusta según tu modelo de datos
      );

      return {
        id: session.id,
        number: session.number || session.id,
        sessionName: session.sessionName,
        date: session.startDate,
        program: session.program,
        capacity,
        enrolled,
        available,
        Materias: materiaIds,
        listAlumns: assignedStudents.map(s => s.id) // IDs de estudiantes asignados
      };
    });

    console.log('📅 Sesiones cargadas:', this.sessionData);

  } catch (error) {
    console.error('Error loading sessions:', error);
    throw error;
  }
},
getStudentPendingSubjects(studentId) {
  const student = this.students.find(s => s.id === studentId);
  if (!student) return [];
  
  // Obtener todas las materias del programa del estudiante
  const programSubjects = this.subjects
    .filter(s => s.programId === student.programId)
    .map(s => s.id);
  
  // Filtrar las que ya completó
  const completedSubjects = student.completedSubjects || [];
  return programSubjects.filter(id => !completedSubjects.includes(id));
},

    // ✅ CORREGIDO: loadRecommendations (una sola versión)
    async loadRecommendations() {
      console.log("=== LOAD RECOMMENDATIONS START ===");

      try {
        const response = await fetch(`${this.apiUrl}/recommendations`);
        if (!response.ok) throw new Error('Error loading recommendations');

        const data = await response.json();
        console.log("📥 RAW FROM BACKEND:", data);

        this.recommendations = Array.isArray(data) ? data : [];

        if (this.recommendations.length > 0) {
          console.log("🔑 KEYS:", Object.keys(this.recommendations[0]));
        } else {
          console.warn("⚠️ No recommendations received");
        }

        this.recommendations.sort((a, b) => (b.missingCount || 0) - (a.missingCount || 0));

        console.log("✅ Recommendations loaded:", this.recommendations.length);
        console.log("=== LOAD RECOMMENDATIONS END ===");

      } catch (error) {
        console.error("❌ Error in loadRecommendations:", error);
        this.recommendations = [];
      }
    },

    getFormattedRecommendations() {
      if (!this.recommendations || this.recommendations.length === 0) {
        return [];
      }

      // 1️⃣ Formatear todas las recomendaciones
      let allFormatted = this.recommendations.map(rec => {
        const allStudents = rec.students || [];
        const studentNames = allStudents.map(s => s.fullName || s.name || 'Unknown');
        
        return {
          subject: rec.courseName || rec.subjectName || 'Unknown',
          subjectId: rec.courseId || rec.subjectId,
          courseCode: rec.courseCode || '',
          studentCount: rec.missingCount || 0,
          students: studentNames,
          _rawData: rec
        };
      });
      // Filtro por PROGRAMA
      if (this.reportFilters.program !== 'all') {
        allFormatted = allFormatted.filter(rec => {
          return rec.students.some(studentName => {
            const student = this.students.find(s => 
              s.name === studentName || 
              `${s.firstName} ${s.lastName}` === studentName
            );
            
            if (!student) return false;
            
            const programLower = (student.program || '').toLowerCase();
            
            if (this.reportFilters.program === 'bachelor') {
              return programLower.includes('bachelor') || programLower.includes('bsgm');
            } else if (this.reportFilters.program === 'associate') {
              return programLower.includes('associate') || programLower.includes('assd');
            }
            
            return false;
          });
        });
      }

      // Filtro por NIVEL DE DEMANDA
      if (this.reportFilters.demandLevel !== 'all') {
        allFormatted = allFormatted.filter(rec => {
          const count = rec.studentCount;
          
          switch(this.reportFilters.demandLevel) {
            case 'critical':
              return count >= 75;
            case 'high':
              return count >= 40 && count < 75;
            case 'medium':
              return count >= 10 && count < 40;
            case 'low':
              return count < 10;
            default:
              return true;
          }
        });
      }

      // Filtro por CANTIDAD MÍNIMA
      if (this.reportFilters.minStudents > 0) {
        allFormatted = allFormatted.filter(rec => {
          return rec.studentCount >= this.reportFilters.minStudents;
        });
      }

      // ORDENAR según criterio
      switch(this.reportFilters.sortBy) {
        case 'demand_desc':
          allFormatted.sort((a, b) => b.studentCount - a.studentCount);
          break;
        case 'demand_asc':
          allFormatted.sort((a, b) => a.studentCount - b.studentCount);
          break;
        case 'alphabetical':
          allFormatted.sort((a, b) => a.subject.localeCompare(b.subject));
          break;
      }

      // Aplicar paginación
      const startIndex = (this.recommendationsPage - 1) * this.recommendationsPerPage;
      const endIndex = startIndex + this.recommendationsPerPage;
      
      return allFormatted.slice(startIndex, endIndex);
    },

    // Total de páginas considerando filtros
    get totalRecommendationPages() {
      if (!this.recommendations || this.recommendations.length === 0) return 1;
      
      let filtered = [...this.recommendations];
      
      if (this.reportFilters.program !== 'all') {
        filtered = filtered.filter(rec => {
          const students = rec.students || [];
          return students.some(s => {
            const student = this.students.find(st => 
              st.name === (s.fullName || s.name) || 
              `${st.firstName} ${st.lastName}` === (s.fullName || s.name)
            );
            
            if (!student) return false;
            const programLower = (student.program || '').toLowerCase();
            
            if (this.reportFilters.program === 'bachelor') {
              return programLower.includes('bachelor') || programLower.includes('bsgm');
            } else if (this.reportFilters.program === 'associate') {
              return programLower.includes('associate') || programLower.includes('assd');
            }
            return false;
          });
        });
      }
      
      if (this.reportFilters.demandLevel !== 'all') {
        filtered = filtered.filter(rec => {
          const count = rec.missingCount || 0;
          switch(this.reportFilters.demandLevel) {
            case 'critical': return count >= 75;
            case 'high': return count >= 40 && count < 75;
            case 'medium': return count >= 10 && count < 40;
            case 'low': return count < 10;
            default: return true;
          }
        });
      }
      
      if (this.reportFilters.minStudents > 0) {
        filtered = filtered.filter(rec => (rec.missingCount || 0) >= this.reportFilters.minStudents);
      }
      
      if (this.reportFilters.courseType !== 'all') {
        filtered = filtered.filter(rec => {
          const code = (rec.courseCode || '').toUpperCase();
          switch(this.reportFilters.courseType) {
            case 'gen_ed':
              return code.startsWith('ENGL') || code.startsWith('MATH') || 
                    code.startsWith('SPCH') || code.startsWith('HIST') ||
                    code.startsWith('PSYC') || code.startsWith('SOCI');
            case 'core':
              return code.startsWith('GBUS') || code.startsWith('ACCT') ||
                    code.startsWith('MGMT') || code.startsWith('MKTG');
            case 'elective':
              return !code.startsWith('GBUS') && !code.startsWith('ACCT') &&
                    !code.startsWith('ENGL') && !code.startsWith('MATH');
            default:
              return true;
          }
        });
      }
      
      return Math.ceil(filtered.length / this.recommendationsPerPage);
    },

    // Métodos de paginación
    nextRecommendationsPage() {
      if (this.recommendationsPage < this.totalRecommendationPages) {
        this.recommendationsPage++;
      }
    },

    prevRecommendationsPage() {
      if (this.recommendationsPage > 1) {
        this.recommendationsPage--;
      }
    },

    goToRecommendationsPage(page) {
      if (page >= 1 && page <= this.totalRecommendationPages) {
        this.recommendationsPage = page;
      }
    },

    toggleRecommendationExpansion(subjectId) {
      // Forzar reactividad con spread operator
      this.expandedRecommendations = {
        ...this.expandedRecommendations,
        [subjectId]: !this.expandedRecommendations[subjectId]
      };
      console.log('Toggled:', subjectId, 'State:', this.expandedRecommendations[subjectId]);
    },

    isExpanded(subjectId) {
      return this.expandedRecommendations[subjectId] === true;
    },

    getInitials(name) {
      if (!name) return '??';
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    },

    getExecutiveSummary() {
      const totalSessions = this.sessionData.length;
      const totalStudents = this.students.length;
      const totalSubjects = this.subjects.length;

      let totalOccupancy = 0;
      let sessionsWithCapacity = 0;

      this.sessionData.forEach(session => {
        if (session.capacity > 0) {
          const occ = (session.enrolled / session.capacity) * 100;
          totalOccupancy += occ;
          sessionsWithCapacity++;
        }
      });

      const avgOccupancy = sessionsWithCapacity > 0 ? Math.round(totalOccupancy / sessionsWithCapacity) : 0;
      const sessionsFull = this.sessionData.filter(s => s.capacity > 0 && Math.round((s.enrolled / s.capacity) * 100) >= 100).length;
      const sessionsLow = this.sessionData.filter(s => s.capacity > 0 && Math.round((s.enrolled / s.capacity) * 100) < 50).length;

      return {
        totalStudents,
        totalSessions,
        totalSubjects,
        avgOccupancy,
        sessionsFull,
        sessionsLow
      };
    },

    getSessionsOccupancyStatus() {
      return this.sessionData.map(session => {
        const capacity = session.capacity || 0;
        const enrolled = session.enrolled || 0;
        const available = capacity - enrolled;
        const occupancy = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;

        let status = 'Low';
        if (occupancy >= 100) status = 'Full';
        else if (occupancy >= 90) status = 'Critical';
        else if (occupancy >= 75) status = 'High';
        else if (occupancy >= 50) status = 'Optimal';

        return {
          id: session.id,
          number: session.number,
          program: session.program,
          capacity,
          enrolled,
          available,
          occupancy,
          status
        };
      }).sort((a, b) => b.occupancy - a.occupancy);
    },

    getStudentsByProgram() {
      const distribution = {};
      
      this.students.forEach(student => {
        const program = student.program || 'Unknown';
        if (!distribution[program]) {
          distribution[program] = 0;
        }
        distribution[program]++;
      });
      
      return Object.keys(distribution).map(program => ({
        program,
        count: distribution[program],
        percentage: Math.round((distribution[program] / this.students.length) * 100)
      }));
    },

    getStudentsByStatus() {
      const statusCount = {};
      
      this.students.forEach(student => {
        const status = student.status || 'Unknown';
        if (!statusCount[status]) {
          statusCount[status] = 0;
        }
        statusCount[status]++;
      });
      
      return Object.keys(statusCount).map(status => ({
        status,
        count: statusCount[status],
        percentage: Math.round((statusCount[status] / this.students.length) * 100)
      }));
    },

    getProblematicSessions() {
      const problems = [];

      this.sessionData.forEach(session => {
        const capacity = session.capacity || 0;
        const enrolled = session.enrolled || 0;
        if (capacity === 0) return;

        const occupancy = Math.round((enrolled / capacity) * 100);

        if (occupancy >= 100) {
          problems.push({
            id: session.id,
            number: session.number,
            program: session.program,
            type: 'overload',
            severity: 'Critical',
            message: `${occupancy}% full - Risk of rejecting students`,
            occupancy
          });
        } else if (occupancy >= 90) {
          problems.push({
            id: session.id,
            number: session.number,
            program: session.program,
            type: 'overload',
            severity: 'High',
            message: `${occupancy}% full - Close to capacity`,
            occupancy
          });
        } else if (occupancy < 50) {
          problems.push({
            id: session.id,
            number: session.number,
            program: session.program,
            type: 'underload',
            severity: 'Warning',
            message: `${occupancy}% full - Risk of cancellation`,
            occupancy
          });
        }
      });

      return problems.sort((a, b) => {
        if (a.type === 'overload' && b.type !== 'overload') return -1;
        if (a.type !== 'overload' && b.type === 'overload') return 1;
        return b.occupancy - a.occupancy;
      });
    },

    getAcademicProgressMetrics() {
      const DEFAULT_TOTAL_UNITS = 126;
      let totalUnitsEarned = 0;
      let totalUnitsRequired = 0;
      let studentsNearCompletion = 0;
      let studentsAtRisk = 0;

      this.students.forEach(student => {
        const earned = Number(student.unitsEarned) || 0;
        const required = Number(student.totalUnits ?? DEFAULT_TOTAL_UNITS);

        if (required > 0) {
          totalUnitsEarned += earned;
          totalUnitsRequired += required;

          const progress = (earned / required) * 100;
          if (progress >= 80) studentsNearCompletion++;
          if (progress < 25) studentsAtRisk++;
        }
      });

      const avgProgress = totalUnitsRequired > 0 ? Math.round((totalUnitsEarned / totalUnitsRequired) * 100) : 0;

      return {
        avgProgress,
        totalUnitsEarned,
        totalUnitsRequired,
        studentsNearCompletion,
        studentsAtRisk
      };
    },

    getProgressDistribution() {
      const ranges = {
        '0-25%': 0,
        '26-50%': 0,
        '51-75%': 0,
        '76-99%': 0,
        '100%': 0
      };

      const DEFAULT_TOTAL_UNITS = 126;

      this.students.forEach(student => {
        const earned = Number(student.unitsEarned) || 0;
        const required = Number(student.totalUnits ?? DEFAULT_TOTAL_UNITS);
        const progress = required > 0 ? (earned / required) * 100 : 0;

        if (progress >= 100) ranges['100%']++;
        else if (progress >= 76) ranges['76-99%']++;
        else if (progress >= 51) ranges['51-75%']++;
        else if (progress >= 26) ranges['26-50%']++;
        else ranges['0-25%']++;
      });

      return ranges;
    },

    exportIndividualReport(student) {
          if (!student) return;
          
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF();
          
          // Configuración de colores
          const primaryColor = [166, 25, 46]; // #A6192E
          const secondaryColor = [212, 23, 54]; // #D41736
          
          // Header
          doc.setFillColor(...primaryColor);
          doc.rect(0, 0, 210, 40, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(24);
          doc.setFont(undefined, 'bold');
          doc.text('SDGKU - Student Report', 105, 20, { align: 'center' });
          
          doc.setFontSize(12);
          doc.setFont(undefined, 'normal');
          doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
          
          // Student Information
          let yPos = 50;
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(16);
          doc.setFont(undefined, 'bold');
          doc.text('Student Information', 20, yPos);
          
          yPos += 10;
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
          
          const normalizeText = (text) => {
            if (!text) return '';
            return String(text).replace(/[^\x00-\x7F]/g, '').trim();
          };

          const info = [
            ['Name:', normalizeText(`${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`)],
            ['Student ID:', normalizeText(student.studentId || 'N/A')],
            ['Program:', normalizeText(student.program || 'N/A')],
            ['Status:', normalizeText(student.status || 'N/A')],
            ['Email:', normalizeText(student.emailSDGKU || 'N/A')],
            ['Phone:', normalizeText(student.phone || 'N/A')]
          ];
          
          info.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label, 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(value, 60, yPos);
            yPos += 7;
          });
          
          // Academic Progress
          yPos += 5;
          doc.setFontSize(16);
          doc.setFont(undefined, 'bold');
          doc.text('Academic Progress', 20, yPos);
          
          yPos += 10;
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
              
          const progress = [
            ['Total Units:', normalizeText(student.totalUnits || '0')],
            ['Transferred Units:', normalizeText(student.transferredUnits || '0')],
            ['Units Earned:', normalizeText(student.unitsEarned || '0')],
            ['GPA:', normalizeText(this.getStudentGPA(student.id) || 'N/A')]
          ];
          
          progress.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label, 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(String(value), 60, yPos);
            yPos += 7;
          });
          
          // Subject Grades Table
          yPos += 5;
          doc.setFontSize(16);
          doc.setFont(undefined, 'bold');
          doc.text('Subject Grades', 20, yPos);
          yPos += 5;
          
          const subjects = this.getStudentSubjectsWithGrades(student.id);
          const tableData = subjects.map(subject => [
            normalizeText(subject.name || 'Unknown'),
            normalizeText(subject.units || '0'),
            subject.grade !== null ? normalizeText(subject.grade) : '-',
            normalizeText(subject.letter || '-'),
            normalizeText(subject.status || 'Not Started')
          ]);
          
          doc.autoTable({
            startY: yPos,
            head: [['Subject', 'Units', 'Grade', 'Letter', 'Status']],
            body: tableData,
            theme: 'striped',
            headStyles: {
              fillColor: primaryColor,
              textColor: [255, 255, 255],
              fontStyle: 'bold'
            },
            styles: {
              fontSize: 9,
              cellPadding: 3
            },
            columnStyles: {
              0: { cellWidth: 80 },
              1: { cellWidth: 20, halign: 'center' },
              2: { cellWidth: 20, halign: 'center' },
              3: { cellWidth: 20, halign: 'center' },
              4: { cellWidth: 40, halign: 'center' }
            }
          });
          
          // Footer
          const pageCount = doc.internal.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(
              `Page ${i} of ${pageCount}`,
              105,
              doc.internal.pageSize.height - 10,
              { align: 'center' }
            );
          }
          
          // Save PDF
          doc.save(`${student.studentId}_Report.pdf`);
        },
        
        exportGeneralReport() {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF();
          
          const primaryColor = [166, 25, 46];

          const normalizeText = (text) => {
            if (!text) return '';
            return String(text).replace(/[^\x00-\x7F]/g, '').trim();
          };
          
          // Header
          doc.setFillColor(...primaryColor);
          doc.rect(0, 0, 210, 40, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(24);
          doc.setFont(undefined, 'bold');
          doc.text('SDGKU - General Report', 105, 20, { align: 'center' });
          
          doc.setFontSize(12);
          doc.setFont(undefined, 'normal');
          doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
          
          let yPos = 50;
          
          // Executive Summary
          if (this.opcionesGeneral.totalAlumnos || this.opcionesGeneral.CantidaddeSesiones || this.opcionesGeneral.All) {
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Executive Summary', 20, yPos);
            yPos += 10;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            if (this.opcionesGeneral.totalAlumnos || this.opcionesGeneral.All) {
              doc.text(`Total Students: ${this.totalStudents()}`, 20, yPos);
              yPos += 7;
            }
            
            if (this.opcionesGeneral.CantidaddeSesiones || this.opcionesGeneral.All) {
              doc.text(`Total Sessions: ${this.totalSessions()}`, 20, yPos);
              yPos += 7;
            }
            
            yPos += 5;
          }
          
          // Student List
          if (this.opcionesGeneral.listaAlumnos || this.opcionesGeneral.All) {
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Student List', 20, yPos);
            yPos += 5;
                
            const studentData = this.students.map(s => [
              normalizeText(s.studentId || 'N/A'),
              normalizeText(s.name || 'Unknown'),
              normalizeText(s.program || 'N/A'),
              normalizeText(s.status || 'N/A'),
              `${normalizeText(s.unitsEarned || '0')}/${normalizeText(s.totalUnits || '0')}`
            ]);
            
            doc.autoTable({
              startY: yPos,
              head: [['ID', 'Name', 'Program', 'Status', 'Units']],
              body: studentData,
              theme: 'striped',
              headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold'
              },
              styles: {
                fontSize: 8,
                cellPadding: 2
              },
              columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 60 },
                2: { cellWidth: 35 },
                3: { cellWidth: 25 },
                4: { cellWidth: 25 }
              }
            });
            
            yPos = doc.lastAutoTable.finalY + 10;
          }
          
          // Session Description
          if (this.opcionesGeneral.DescripcionSesion || this.opcionesGeneral.All) {
            // Add new page if needed
            if (yPos > 250) {
              doc.addPage();
              yPos = 20;
            }
            
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Session Overview', 20, yPos);
            yPos += 5;
            
            const sessionData = this.sessionData.map(s => {
              const occupancy = s.capacity > 0 ? Math.round((s.enrolled / s.capacity) * 100) : 0;
              return [
                normalizeText(`Session ${s.NumberofSessions || 'N/A'}`),
                normalizeText(s.program || 'N/A'),
                `${normalizeText(s.enrolled || '0')}/${normalizeText(s.capacity || '0')}`,
                `${occupancy}%`
              ];
            });
            
            doc.autoTable({
              startY: yPos,
              head: [['Session', 'Program', 'Enrolled/Capacity', 'Occupancy']],
              body: sessionData,
              theme: 'striped',
              headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold'
              },
              styles: {
                fontSize: 9,
                cellPadding: 3
              }
            });
            
            yPos = doc.lastAutoTable.finalY + 10;
          }
          
          // Recommendations
          const recommendations = this.getFormattedRecommendations();
          if (recommendations.length > 0) {
            if (yPos > 250) {
              doc.addPage();
              yPos = 20;
            }
            
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Automatic Recommendations', 20, yPos);
            yPos += 5;
            
            const recData = recommendations.map(rec => [
              normalizeText(rec.subject || 'Unknown'),
              normalizeText(rec.studentCount || '0'),
              normalizeText(rec.students.slice(0, 3).join(', ')) + (rec.students.length > 3 ? '...' : '')
            ]);
            
            doc.autoTable({
              startY: yPos,
              head: [['Subject', 'Students Needed', 'Student Names']],
              body: recData,
              theme: 'striped',
              headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold'
              },
              styles: {
                fontSize: 9,
                cellPadding: 3
              },
              columnStyles: {
                0: { cellWidth: 60 },
                1: { cellWidth: 30 },
                2: { cellWidth: 85 }
              }
            });
          }
          
          // Footer
          const pageCount = doc.internal.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(
              `Page ${i} of ${pageCount}`,
              105,
              doc.internal.pageSize.height - 10,
              { align: 'center' }
            );
          }
          
          doc.save(`SDGKU_General_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        },
        
        openGeneralReport() {
          // Verificar que al menos una opción esté seleccionada
          const hasSelection = Object.values(this.opcionesGeneral).some(val => val === true);
          
          if (!hasSelection) {
            alert('Please select at least one option to include in the report');
            return;
          }
          
          this.exportGeneralReport();
        },

    async openGradesEditor(student) {
      this.selectedStudent = student;
      this.editingStudentId = student.id;
      this.editingGrades = true;
      this.courseSearchQuery = '';
      this.modifiedCourses = [];
      this.saveStatus = { type: '', message: '' };
      
      await this.loadCoursesForEditing(student.id);
    },
    
    async loadCoursesForEditing(studentId) {
  try {
    // ✅ Obtener datos completos del estudiante (incluye enrollments)
    const studentResponse = await fetch(`${this.apiUrl}/students/${studentId}`);
    
    if (!studentResponse.ok) {
      throw new Error('Failed to load student data');
    }
    
    const student = await studentResponse.json();
    
    // Crear mapa de calificaciones
    const gradesMap = {};
    
    if (student.grades && typeof student.grades === 'object') {
      Object.entries(student.grades).forEach(([courseId, gradeInfo]) => {
        const courseCode = gradeInfo.courseCode;
        
        if (courseCode) {
          // ✅ Mapear correctamente los grades
          let displayGrade = '--';
          
          // Si tiene letra de calificación, usarla
          if (gradeInfo.letter && gradeInfo.letter !== '-') {
            displayGrade = gradeInfo.letter;
          }
          // Si está enrolled (In Progress), mostrar IP
          else if (gradeInfo.isEnrolled || gradeInfo.status === 'In Progress') {
            displayGrade = 'IP';
          }
          
          gradesMap[courseCode] = {
            grade: displayGrade,
            sessionId: gradeInfo.sessionId || null,
            status: gradeInfo.status || 'Not Started'
          };
        }
      });
    }
    
    // Mapear todos los cursos del sistema
    this.coursesForEditing = this.subjects.map(subject => ({
      code: subject.code,
      name: subject.name,
      grade: gradesMap[subject.code]?.grade || '--',
      sessionId: gradesMap[subject.code]?.sessionId || null,
      status: gradesMap[subject.code]?.status || 'Not Started',
      modified: false
    }));
    
    console.log('📝 Cursos cargados para edición:', this.coursesForEditing.length);
    
    // Debug: Mostrar cursos "In Progress"
    const inProgressCourses = this.coursesForEditing.filter(c => c.grade === 'IP');
    console.log('📚 Cursos en progreso:', inProgressCourses.length);
    
    if (inProgressCourses.length > 0) {
      console.log('Ejemplo:', inProgressCourses[0]);
    }
    
  } catch (error) {
    console.error('Error loading courses for editing:', error);
    this.saveStatus = {
      type: 'error',
      message: 'Error al cargar los cursos'
    };
  }
},
    
    get filteredCoursesForEditing() {
      if (!this.courseSearchQuery || this.courseSearchQuery.trim() === '') {
        return this.coursesForEditing;
      }
      
      const query = this.courseSearchQuery.toLowerCase().trim();
      return this.coursesForEditing.filter(course => 
        course.code.toLowerCase().includes(query) || 
        course.name.toLowerCase().includes(query)
      );
    },

    get availablePrograms() {
      const programs = new Set();
      this.students.forEach(student => {
        if (student.program && student.program !== 'Unknown' && student.program !== 'N/A') {
          programs.add(student.program);
        }
      });
      const programsArray = Array.from(programs).sort();
      console.log('📋 Programas disponibles:', programsArray);
      return programsArray;
    },

    get filteredRecommendations() {
      let filtered = [...this.recommendations];
      
      // Filtrar por programa
      if (this.reportFilters.program !== 'all') {
        filtered = filtered.filter(rec => {
          const students = rec.students || [];
          return students.some(student => {
            const studentData = this.students.find(s => 
              s.name === student.fullName || s.name === student.name
            );
            return studentData && studentData.program === this.reportFilters.program;
          });
        });
      }
      
      // Filtrar por nivel de demanda
      if (this.reportFilters.demandLevel !== 'all') {
        filtered = filtered.filter(rec => {
          const count = rec.missingCount || 0;
          switch(this.reportFilters.demandLevel) {
            case 'critical': return count >= 75;
            case 'high': return count >= 40 && count < 75;
            case 'medium': return count >= 10 && count < 40;
            case 'low': return count < 10;
            default: return true;
          }
        });
      }
      
      // Filtrar por cantidad mínima
      if (this.reportFilters.minStudents > 0) {
        filtered = filtered.filter(rec => 
          (rec.missingCount || 0) >= this.reportFilters.minStudents
        );
      }
      
      // Ordenar
      filtered.sort((a, b) => {
        const countA = a.missingCount || 0;
        const countB = b.missingCount || 0;
        const nameA = a.courseName || a.subjectName || '';
        const nameB = b.courseName || b.subjectName || '';
        
        switch(this.reportFilters.sortBy) {
          case 'demand_desc': return countB - countA;
          case 'demand_asc': return countA - countB;
          case 'alphabetical': return nameA.localeCompare(nameB);
          default: return countB - countA;
        }
      });
      
      return filtered;
    },

    clearReportFilters() {
      this.reportFilters = {
        program: 'all',
        demandLevel: 'all',
        minStudents: 0,
        sortBy: 'demand_desc'
      };
    },

    get availableSessions() {
      return this.sessionData.map(s => ({
        id: s.id,
        number: s.number,
        display: `Session ${s.number}`
      }));
    },    

    markAsModified(courseCode) {
      const course = this.coursesForEditing.find(c => c.code === courseCode);
      if (course) {
        course.modified = true;
        if (!this.modifiedCourses.includes(courseCode)) {
          this.modifiedCourses.push(courseCode);
        }
      }
    },
    
    getStatusText(grade) {
      if (grade === '--') return 'Not Taken';
      if (grade === 'IP') return 'In Progress';
      if (grade === 'T') return 'Transferred';
      if (grade === 'F') return 'Failed';
      return 'Completed';
    },

    
    
    resetGrades() {
      if (confirm('¿Estás seguro de resetear todos los cambios?')) {
        this.loadCoursesForEditing(this.editingStudentId);
        this.modifiedCourses = [];
        this.saveStatus = { type: '', message: '' };
      }
    },
     // Agregar la función auxiliar como método
    getStatusFromGrade(grade) {
      if (!grade || grade === '--') return 'pending';
      if (grade === 'IP') return 'pending';
      if (grade === 'T' || grade === 'P') return 'transferred';
      if (grade === 'F') return 'failed';
      return 'completed';
    },
    
    async saveGrades() {
      if (this.modifiedCourses.length === 0) return;
      
      if (!this.editingStudentId) {
        this.saveStatus = {
          type: 'error',
          message: 'Error: No se encontró el ID del estudiante'
        };
        return;
      }
      
      this.savingGrades = true;
      this.saveStatus = { type: 'info', message: 'Saving changes...' };
      
      try {
        const gradesToSave = this.coursesForEditing
          .filter(course => course.modified)
          .map(course => ({
            courseCode: course.code,
            grade: course.grade,
            sessionId: course.sessionId,
             status: this.getStatusFromGrade(course.grade)
          }));
        
        console.log('💾 Guardando calificaciones:', gradesToSave);
        
        const response = await fetch(
          `${this.apiUrl}/students/${this.editingStudentId}/grades/batch`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grades: gradesToSave })
          }
        );
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          this.saveStatus = {
            type: 'success',
            message: `✅ ${result.successful} calificaciones guardadas exitosamente`
          };
          
          this.modifiedCourses = [];
          this.coursesForEditing.forEach(course => course.modified = false);
          
          await this.loadStudents();
          
          setTimeout(() => {
            this.editingGrades = false;
            this.saveStatus = { type: '', message: '' };
          }, 2000);
          
        } else {
          throw new Error(result.error || 'Error al guardar');
        }
        
      } catch (error) {
        console.error('❌ Error guardando calificaciones:', error);
        this.saveStatus = {
          type: 'error',
          message: `Error: ${error.message}`
        };
      } finally {
        this.savingGrades = false;
      }
    },

    applyFilters() {
      console.log('Applying filters:', this.reportFilters);
    },

    // Aplicar filtros de reportes
    applyReportFilters() {
      console.log('Applying report filters:', this.reportFilters);
      this.recommendationsPage = 1;
      this.showFilters = false;
    },

    // Limpiar filtros de reportes
    clearReportFilters() {
      this.reportFilters = {
        program: 'all',
        demandLevel: 'all',
        minStudents: 0,
        courseType: 'all',
        sortBy: 'demand_desc'
      };
      this.recommendationsPage = 1;
    },

    // Verificar si hay filtros activos
    get hasActiveReportFilters() {
      return this.reportFilters.program !== 'all' ||
            this.reportFilters.demandLevel !== 'all' ||
            this.reportFilters.minStudents > 0 ||
            this.reportFilters.courseType !== 'all';
    }, 

    verSeleccionados() {
      console.log(this.opcionesGeneral);
      const seleccionadas = Object.keys(this.opcionesGeneral).filter(key => this.opcionesGeneral[key]);
      console.log('Seleccionadas:', seleccionadas);
    },
    
    watchAll() {
      if (this.opcionesGeneral.All) {
        Object.keys(this.opcionesGeneral).forEach(key => {
          this.opcionesGeneral[key] = true;
        });
      } else {
        Object.keys(this.opcionesGeneral).forEach(key => {
          this.opcionesGeneral[key] = false;
        });
      }
    },
    
    totalStudents() {
      return this.students.length;
    },
    
    totalSessions() {
      return this.sessionData.length;
    },
    
    getStudentsInSession(sessionId) {
      const session = this.sessionData.find(s => s.id === sessionId);
      if (!session) return [];
      
      return session.listAlumns.map(studentId => 
        this.students.find(student => student.id === studentId)
      ).filter(student => student !== undefined);
    },
    
    getSubjectName(subjectId) {
      const subject = this.subjects.find(s => s.id === subjectId);
      return subject ? subject.name : 'Unknown';
    },
    
    getSessionSubjects(sessionId) {
      const session = this.sessionData.find(s => s.id === sessionId);
      if (!session) return [];
      return session.Materias.map(id => this.getSubjectName(id));
    },
    
    getMissingSubjects(studentId) {
      const student = this.students.find(s => s.id === studentId);
      if (!student) return [];
      
      if (!student.requiredSubjects || student.requiredSubjects.length === 0) {
        return this.subjects
          .map(s => s.id)
          .filter(id => !student.completedSubjects.includes(id));
      }
      
      const missing = student.requiredSubjects.filter(
        subjectId => !student.completedSubjects.includes(subjectId)
      );
      
      return missing;
    },
    
    get filteredStudents() {
      if (!this.searchQuery || this.searchQuery.trim() === '') {
        return this.students;
      }
      
      const query = this.searchQuery.toLowerCase().trim();
      
      return this.students.filter(student => {
        return (
          student.name.toLowerCase().includes(query) ||
          student.studentId.toLowerCase().includes(query) ||
          student.program.toLowerCase().includes(query) ||
          (student.emailPersonal && student.emailPersonal.toLowerCase().includes(query)) ||
          (student.emailSDGKU && student.emailSDGKU.toLowerCase().includes(query))
        );
      });
    },
    
    filterStudents() {
      console.log('Buscando:', this.searchQuery);
    },
    
    getStudentGPA(studentId) {
      const subjectsWithGrades = this.getStudentSubjectsWithGrades(studentId);
      
      let totalQualityPoints = 0;
      let totalUnits = 0;
      
      subjectsWithGrades.forEach(subject => {
        const numericGrade = subject.grade;
        const units = subject.units;
        const status = subject.status;
        
        if (status === 'Completed' && numericGrade !== null && units > 0) {
          const gradePoints = this.getGradePoints(numericGrade); 
          totalQualityPoints += gradePoints * units;
          totalUnits += units;
        }
      });

      if (totalUnits === 0) return 'N/A';
      
      const gpa = totalQualityPoints / totalUnits;
      return gpa.toFixed(2);
    },
    
    getGradePoints(numericGrade) {
      if (numericGrade === null) return 0.0;
      if (numericGrade >= 93) return 4.0;
      if (numericGrade >= 90) return 3.7;
      if (numericGrade >= 87) return 3.3;
      if (numericGrade >= 83) return 3.0;
      if (numericGrade >= 80) return 2.7;
      if (numericGrade >= 77) return 2.3;
      if (numericGrade >= 73) return 2.0;
      if (numericGrade >= 70) return 1.7;
      if (numericGrade >= 67) return 1.3;
      if (numericGrade >= 63) return 1.0;
      if (numericGrade >= 60) return 0.7;
      return 0.0;
    },
    
    getLetterGrade(numericGrade) {
      if (numericGrade >= 93) return 'A';
      if (numericGrade >= 90) return 'A-';
      if (numericGrade >= 87) return 'B+';
      if (numericGrade >= 83) return 'B';
      if (numericGrade >= 80) return 'B-';
      if (numericGrade >= 77) return 'C+';
      if (numericGrade >= 73) return 'C';
      if (numericGrade >= 70) return 'C-';
      if (numericGrade >= 67) return 'D+';
      if (numericGrade >= 63) return 'D';
      if (numericGrade >= 60) return 'D-';
      return 'F';
    },
    
    getStudentSubjectsWithGrades(studentId) {
      const student = this.students.find(s => s.id === studentId);
      if (!student) return [];
      
      const subjectsToShow = student.requiredSubjects && student.requiredSubjects.length > 0
        ? student.requiredSubjects
        : this.subjects.map(s => s.id);
      
      return subjectsToShow.map(subjectId => {
        const subject = this.subjects.find(s => s.id === subjectId);
        const gradeInfo = student.grades ? student.grades[subjectId] : null;
        
        return {
          id: subjectId,
          name: subject ? subject.name : 'Unknown',
          units: subject ? subject.units : 0,
          grade: gradeInfo?.grade || null,
          letter: gradeInfo?.letter || '-',
          status: gradeInfo?.status || 'Not Started'
        };
      });
    }
  };
}
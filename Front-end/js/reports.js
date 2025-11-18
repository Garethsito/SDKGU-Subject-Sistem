function reports() {
  return {
    activeReport: 'general',
    searchQuery: '',
    selectedStudent: null,
    opcionesGeneral: {
      totalAlumnos: false,
      listaAlumnos: false,
      CantidaddeSesiones: false,
      DescripcionSesion: false,
      All: false
    },
    filters: { program: 'all', session: 'all', occupancy: 'all' },
    
    // 🆕 Variables para datos de BD
    students: [],
    sessionData: [],
    subjects: [],
    programs: [],
    loading: true,
    error: null,
    
    // 🆕 URL de tu API
    apiUrl: 'http://localhost:3000/api',
    
    // 🆕 Inicialización
    async init() {
      console.log('🚀 Iniciando carga de datos de reportes...');
      await this.loadAllData();
    },
    
    // 🆕 Cargar todos los datos
    async loadAllData() {
      this.loading = true;
      this.error = null;
      
      try {
        // Cargar en paralelo
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
      } catch (error) {
        console.error('❌ Error cargando datos:', error);
        this.error = 'Error al cargar datos. Verifica que el servidor esté corriendo.';
      } finally {
        this.loading = false;
      }
    },
    
    // 🆕 Cargar programas
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
    
    // 🆕 Cargar cursos
    async loadCourses() {
      try {
        const response = await fetch(`${this.apiUrl}/courses`);
        if (!response.ok) throw new Error('Error loading courses');
        const courses = await response.json();
        
        // Adaptar formato
        this.subjects = courses.map(course => ({
          id: parseInt(course.id),
          name: course.name,
          code: course.code,
          units: 3 // Por defecto
        }));
        
        console.log('📖 Cursos cargados:', this.subjects.length);
      } catch (error) {
        console.error('Error loading courses:', error);
        throw error;
      }
    },
    
    // 🆕 Cargar estudiantes directamente desde el API
    async loadStudents() {
      try {
        const response = await fetch(`${this.apiUrl}/students`);
        if (!response.ok) throw new Error('Error loading students');
        const studentsData = await response.json();
        
        // Los datos ya vienen en el formato correcto del backend
        this.students = studentsData.map(student => ({
          id: student.id,
          studentId: student.studentId,
          name: student.name,
          firstName: student.firstName,
          middleName: student.middleName,
          lastName: student.lastName,
          phone: student.phone,
          emailPersonal: student.emailPersonal,
          emailSDGKU: student.emailSDGKU,
          status: student.status,
          program: student.program,
          modality: student.modality,
          cohort: student.cohort,
          language: student.language,
          totalUnits: student.totalUnits,
          transferredUnits: student.transferredUnits,
          unitsEarned: student.unitsEarned,
          startDate: student.startDate,
          scheduledCompletion: student.scheduledCompletion,
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
    
    // 🆕 Cargar sesiones
    async loadSessions() {
      try {
        const response = await fetch(`${this.apiUrl}/sessions`);
        if (!response.ok) throw new Error('Error loading sessions');
        const sessions = await response.json();

        this.sessionData = await Promise.all(sessions.map(async (session) => {
          const coursesResponse = await fetch(`${this.apiUrl}/sessions/${session.id}/courses`);
          const coursesData = await coursesResponse.json();

          // IDs únicos de estudiantes inscritos en la sesión (evita duplicados)
          const studentIds = new Set();
          coursesData.forEach(course => {
            if (Array.isArray(course.students)) {
              course.students.forEach(student => {
                if (student && student.id != null) studentIds.add(parseInt(student.id));
              });
            }
          });

          // calcular capacidad (intentar leer capacity por course; si no existe usar currentEnrollment)
          let capacitySum = 0;
          coursesData.forEach(c => {
            const cap = c.capacity ?? c.maxCapacity ?? 0;
            if (cap > 0) capacitySum += cap;
            else if (typeof c.currentEnrollment === 'number') capacitySum += c.currentEnrollment; // fallback
          });

          const enrolled = studentIds.size;
          const capacity = capacitySum || enrolled; // si no hay capacity info, asumimos como enrolled (evita div/0)
          const available = Math.max(0, capacity - enrolled);

          // convertir materias (course.code -> subject id)
          const materiaIds = coursesData.map(c => {
            const subject = this.subjects.find(s => s.code === c.code);
            return subject ? subject.id : null;
          }).filter(id => id !== null);

          return {
            id: session.id,
            number: session.number ?? session.id,
            date: session.startDate,
            program: session.program,
            capacity,
            enrolled,
            available,
            Materias: materiaIds,
            listAlumns: Array.from(studentIds)
          };
        }));
        console.log('📅 Sesiones cargadas:', this.sessionData.length);
      } catch (error) {
        console.error('Error loading sessions:', error);
        throw error;
      }
    },

    // Generar y descargar PDF del reporte general
        async openGeneralReport() {
          try {
            console.log('🔄 Generando PDF...');
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let yPos = 20;
            
            // Función auxiliar para agregar nueva página si es necesario
            const checkPageBreak = (neededSpace) => {
              if (yPos + neededSpace > pageHeight - 20) {
                doc.addPage();
                yPos = 20;
                return true;
              }
              return false;
            };
            
            // === ENCABEZADO ===
            doc.setFillColor(166, 25, 46);
            doc.rect(0, 0, pageWidth, 40, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont(undefined, 'bold');
            doc.text('General Academic Report', pageWidth / 2, 20, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            const currentDate = new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
            doc.text(`Generated: ${currentDate}`, pageWidth / 2, 30, { align: 'center' });
            
            yPos = 50;
            
            // === 1. RESUMEN EJECUTIVO ===
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('1. Executive Summary', 15, yPos);
            yPos += 10;
            
            const summary = this.getExecutiveSummary();
            
            doc.autoTable({
              startY: yPos,
              head: [['Metric', 'Value']],
              body: [
                ['Total Students', summary.totalStudents.toString()],
                ['Total Sessions', summary.totalSessions.toString()],
                ['Total Subjects', summary.totalSubjects.toString()],
                ['Average Occupancy', `${summary.avgOccupancy}%`],
                ['Sessions Full', summary.sessionsFull.toString()],
                ['Sessions Low', summary.sessionsLow.toString()]
              ],
              theme: 'grid',
              headStyles: { fillColor: [166, 25, 46], textColor: 255 },
              margin: { left: 15, right: 15 }
            });
            
            yPos = doc.lastAutoTable.finalY + 15;
            checkPageBreak(30);
            
            // === 2. ESTADO DE OCUPACIÓN ===
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('2. Session Occupancy Status', 15, yPos);
            yPos += 10;
            
            const occupancyData = this.getSessionsOccupancyStatus();
            
            doc.autoTable({
              startY: yPos,
              head: [['Session', 'Program', 'Capacity', 'Enrolled', 'Available', 'Occupancy', 'Status']],
              body: occupancyData.map(s => [
                `Session ${s.number}`,
                s.program,
                s.capacity.toString(),
                s.enrolled.toString(),
                s.available.toString(),
                `${s.occupancy}%`,
                s.status
              ]),
              theme: 'striped',
              headStyles: { fillColor: [166, 25, 46], textColor: 255 },
              margin: { left: 15, right: 15 },
              styles: { fontSize: 8 },
              columnStyles: {
                6: { 
                  cellWidth: 25,
                  fontStyle: 'bold'
                }
              }
            });
            
            yPos = doc.lastAutoTable.finalY + 15;
            checkPageBreak(30);
            
            // === 3. DISTRIBUCIÓN DE ESTUDIANTES ===
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('3. Student Distribution', 15, yPos);
            yPos += 10;
            
            // Por Programa
            const byProgram = this.getStudentsByProgram();
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('By Program:', 15, yPos);
            yPos += 7;
            
            doc.autoTable({
              startY: yPos,
              head: [['Program', 'Students', 'Percentage']],
              body: byProgram.map(p => [
                p.program,
                p.count.toString(),
                `${p.percentage}%`
              ]),
              theme: 'grid',
              headStyles: { fillColor: [166, 25, 46], textColor: 255 },
              margin: { left: 15, right: 15 }
            });
            
            yPos = doc.lastAutoTable.finalY + 10;
            checkPageBreak(30);
            
            // Por Status
            const byStatus = this.getStudentsByStatus();
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('By Status:', 15, yPos);
            yPos += 7;
            
            doc.autoTable({
              startY: yPos,
              head: [['Status', 'Students', 'Percentage']],
              body: byStatus.map(s => [
                s.status,
                s.count.toString(),
                `${s.percentage}%`
              ]),
              theme: 'grid',
              headStyles: { fillColor: [166, 25, 46], textColor: 255 },
              margin: { left: 15, right: 15 }
            });
            
            yPos = doc.lastAutoTable.finalY + 15;
            checkPageBreak(30);
            
            // === 4. DEMANDA DE MATERIAS ===
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('4. Subject Demand & Recommendations', 15, yPos);
            yPos += 10;
            
            const subjectDemand = this.getSubjectDemand();
            
            doc.autoTable({
              startY: yPos,
              head: [['Subject', 'Code', 'Students', 'Recommendation']],
              body: subjectDemand.map(s => [
                s.subjectName,
                s.subjectCode,
                s.count.toString(),
                s.recommendation.replace(/[🔴🟠🟡🟢]/g, '').trim()
              ]),
              theme: 'striped',
              headStyles: { fillColor: [166, 25, 46], textColor: 255 },
              margin: { left: 15, right: 15 },
              styles: { fontSize: 9 },
              columnStyles: {
                3: { cellWidth: 60 }
              }
            });
            
            yPos = doc.lastAutoTable.finalY + 15;
            checkPageBreak(30);
            
            // === 5. SESIONES CON PROBLEMAS ===
            const problems = this.getProblematicSessions();
            
            if (problems.length > 0) {
              doc.setFontSize(16);
              doc.setFont(undefined, 'bold');
              doc.text('5. Sessions with Issues', 15, yPos);
              yPos += 10;
              
              doc.autoTable({
                startY: yPos,
                head: [['Session', 'Program', 'Severity', 'Issue']],
                body: problems.map(p => [
                  `Session ${p.number}`,
                  p.program,
                  p.severity,
                  p.message
                ]),
                theme: 'grid',
                headStyles: { fillColor: [166, 25, 46], textColor: 255 },
                margin: { left: 15, right: 15 },
                styles: { fontSize: 9 },
                columnStyles: {
                  3: { cellWidth: 70 }
                }
              });
              
              yPos = doc.lastAutoTable.finalY + 15;
            }
            
            checkPageBreak(30);
            
            // === 6. PROGRESO ACADÉMICO ===
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('6. Academic Progress Metrics', 15, yPos);
            yPos += 10;
            
            const progress = this.getAcademicProgressMetrics();
            
            doc.autoTable({
              startY: yPos,
              head: [['Metric', 'Value']],
              body: [
                ['Average Progress', `${progress.avgProgress}%`],
                ['Students Near Completion (≥80%)', progress.studentsNearCompletion.toString()],
                ['Students At Risk (<25%)', progress.studentsAtRisk.toString()],
                ['Total Units Earned', progress.totalUnitsEarned.toString()],
                ['Total Units Required', progress.totalUnitsRequired.toString()]
              ],
              theme: 'grid',
              headStyles: { fillColor: [166, 25, 46], textColor: 255 },
              margin: { left: 15, right: 15 }
            });
            
            yPos = doc.lastAutoTable.finalY + 10;
            checkPageBreak(30);
            
            // Distribución de progreso
            const progressDist = this.getProgressDistribution();
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Progress Distribution:', 15, yPos);
            yPos += 7;
            
            doc.autoTable({
              startY: yPos,
              head: [['Range', 'Students']],
              body: Object.entries(progressDist).map(([range, count]) => [
                range,
                count.toString()
              ]),
              theme: 'grid',
              headStyles: { fillColor: [166, 25, 46], textColor: 255 },
              margin: { left: 15, right: 15 }
            });
            
            // === PIE DE PÁGINA EN TODAS LAS PÁGINAS ===
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            
            for (let i = 1; i <= pageCount; i++) {
              doc.setPage(i);
              doc.text(
                `Page ${i} of ${pageCount}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
              );
              doc.text(
                'SDGKU Academic Management System',
                15,
                pageHeight - 10
              );
            }
            
            // === GUARDAR PDF ===
            const fileName = `General_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
            console.log('✅ PDF generado exitosamente:', fileName);
            
          } catch (error) {
            console.error('❌ Error generando PDF:', error);
            alert('Error generating PDF. Please check the console for details.');
          }
        },

    // Generar y descargar PDF de reporte individual
    async exportIndividualReport(student) {
      try {
        console.log('🔄 Generando PDF individual para:', student.name);
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 20;
        
        // Función auxiliar para agregar nueva página
        const checkPageBreak = (neededSpace) => {
          if (yPos + neededSpace > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
            return true;
          }
          return false;
        };
        
        // === ENCABEZADO ===
        doc.setFillColor(166, 25, 46);
        doc.rect(0, 0, pageWidth, 50, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('Individual Student Report', pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(16);
        doc.text(student.name, pageWidth / 2, 32, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Student ID: ${student.studentId}`, pageWidth / 2, 40, { align: 'center' });
        
        yPos = 60;
        
        // === 1. PERSONAL INFORMATION ===
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setFillColor(166, 25, 46);
        doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('Personal Information', 17, yPos);
        yPos += 10;
        
        doc.setTextColor(0, 0, 0);
        doc.autoTable({
          startY: yPos,
          body: [
            ['Full Name', `${student.firstName} ${student.middleName} ${student.lastName}`],
            ['Phone', student.phone || 'N/A'],
            ['Personal Email', student.emailPersonal || 'N/A'],
            ['SDGKU Email', student.emailSDGKU || 'N/A']
          ],
          theme: 'grid',
          styles: { fontSize: 10 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 }
          },
          margin: { left: 15, right: 15 }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
        checkPageBreak(30);
        
        // === 2. ACADEMIC INFORMATION ===
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setFillColor(166, 25, 46);
        doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('Academic Information', 17, yPos);
        yPos += 10;
        
        doc.setTextColor(0, 0, 0);
        doc.autoTable({
          startY: yPos,
          body: [
            ['Program', student.program],
            ['Modality', student.modality],
            ['Cohort', student.cohort],
            ['Language', student.language],
            ['Status', student.status]
          ],
          theme: 'grid',
          styles: { fontSize: 10 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 }
          },
          margin: { left: 15, right: 15 }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
        checkPageBreak(30);
        
        // === 3. ACADEMIC PROGRESS ===
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setFillColor(166, 25, 46);
        doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('Academic Progress', 17, yPos);
        yPos += 10;
        
        doc.setTextColor(0, 0, 0);
        const progressPercent = Math.round((student.unitsEarned / student.totalUnits) * 100);
        
        doc.autoTable({
          startY: yPos,
          body: [
            ['Total Units', student.totalUnits.toString()],
            ['Transferred Units', student.transferredUnits.toString()],
            ['Units Earned', student.unitsEarned.toString()],
            ['Progress', `${progressPercent}%`]
          ],
          theme: 'grid',
          styles: { fontSize: 10 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 }
          },
          margin: { left: 15, right: 15 }
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
        
        // Barra de progreso visual
        doc.setFillColor(220, 220, 220);
        doc.rect(15, yPos, pageWidth - 30, 8, 'F');
        doc.setFillColor(166, 25, 46);
        doc.rect(15, yPos, (pageWidth - 30) * (progressPercent / 100), 8, 'F');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(`${progressPercent}%`, pageWidth / 2, yPos + 5, { align: 'center' });
        
        yPos += 15;
        checkPageBreak(30);
        
        // === 4. SUBJECT GRADES & GPA ===
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setFillColor(166, 25, 46);
        doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('Subject Grades', 17, yPos);
        yPos += 10;
        
        // GPA
        const gpa = this.getStudentGPA(student.id);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Current GPA: ${gpa}`, 15, yPos);
        yPos += 10;
        
        // Tabla de calificaciones
        const subjectsWithGrades = this.getStudentSubjectsWithGrades(student.id);
        
        doc.autoTable({
          startY: yPos,
          head: [['Subject', 'Units', 'Grade', 'Letter', 'Status']],
          body: subjectsWithGrades.map(s => [
            s.name,
            s.units.toString(),
            s.grade !== null ? s.grade.toString() : '-',
            s.letter,
            s.status
          ]),
          theme: 'striped',
          headStyles: { fillColor: [166, 25, 46], textColor: 255 },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { halign: 'center', cellWidth: 20 },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'center', cellWidth: 20 },
            4: { halign: 'center', cellWidth: 35 }
          },
          margin: { left: 15, right: 15 }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
        checkPageBreak(30);
        
        // === 5. IMPORTANT DATES ===
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setFillColor(166, 25, 46);
        doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('Important Dates', 17, yPos);
        yPos += 10;
        
        doc.setTextColor(0, 0, 0);
        doc.autoTable({
          startY: yPos,
          body: [
            ['Start Date', student.startDate],
            ['Scheduled Completion', student.scheduledCompletion],
            ['Graduation Date', student.graduationDate]
          ],
          theme: 'grid',
          styles: { fontSize: 10 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 }
          },
          margin: { left: 15, right: 15 }
        });
        
        // === PIE DE PÁGINA ===
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.text(
            `Page ${i} of ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
          doc.text(
            'SDGKU Academic Management System',
            15,
            pageHeight - 10
          );
          doc.text(
            `Generated: ${new Date().toLocaleDateString('en-US')}`,
            pageWidth - 15,
            pageHeight - 10,
            { align: 'right' }
          );
        }
        
        // === GUARDAR PDF ===
        const fileName = `Student_Report_${student.studentId}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        console.log('✅ PDF individual generado exitosamente:', fileName);
        
      } catch (error) {
        console.error('❌ Error generando PDF individual:', error);
        alert('Error generating PDF. Please check the console for details.');
      }
    },

    // Resumen ejecutivo
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

    // Estado de ocupación de sesiones
    getSessionsOccupancyStatus() {
      // Umbrales claros:
      // Full >=100, Critical 90-99, High 75-89, Optimal 50-74, Low <50
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

    // Distribución de estudiantes por programa
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

    // Distribución por estatus académico
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

    // Materias más demandadas (con recomendaciones)
    getSubjectDemand() {
      const demand = {};
      
      this.students.forEach(student => {
        const missing = this.getMissingSubjects(student.id);
        missing.forEach(subjectId => {
          if (!demand[subjectId]) {
            demand[subjectId] = {
              subjectId,
              count: 0,
              students: []
            };
          }
          demand[subjectId].count++;
          demand[subjectId].students.push(student.name);
        });
      });
      
      return Object.values(demand)
        .map(d => {
          const subject = this.subjects.find(s => s.id === d.subjectId);
          let recommendation = 'Monitor demand';
          
          if (d.count >= 18) recommendation = '🔴 Open new section immediately';
          else if (d.count >= 12) recommendation = '🟡 High demand - prepare section';
          else if (d.count < 5) recommendation = '🟢 Low demand - no action needed';
          
          return {
            subjectName: subject ? subject.name : 'Unknown',
            subjectCode: subject ? subject.code : 'N/A',
            count: d.count,
            recommendation,
            students: d.students
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },

    // Sesiones con problemas
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

      // ordenar: primero overload por occupancy, luego underload
      return problems.sort((a, b) => {
        if (a.type === 'overload' && b.type !== 'overload') return -1;
        if (a.type !== 'overload' && b.type === 'overload') return 1;
        return b.occupancy - a.occupancy;
      });
    },

    // Métricas de progreso académico
    getAcademicProgressMetrics() {
      const DEFAULT_TOTAL_UNITS = 126; // configurable
      let totalUnitsEarned = 0;
      let totalUnitsRequired = 0;
      let studentsNearCompletion = 0;
      let studentsAtRisk = 0;
      let countedStudents = 0; // para el promedio correcto

      this.students.forEach(student => {
        const earned = Number(student.unitsEarned) || 0;
        const required = Number(student.totalUnits ?? DEFAULT_TOTAL_UNITS);

        // contar sólo si required > 0
        if (required > 0) {
          totalUnitsEarned += earned;
          totalUnitsRequired += required;
          countedStudents++;

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

    // Distribución de progreso
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
    
    // Métodos originales
    clearFilters() {
      this.filters = { program: 'all', session: 'all', occupancy: 'all' };
    },
    
    applyFilters() {
      console.log('Applying filters:', this.filters);
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
      
      // Si no tiene requiredSubjects, obtener todos los cursos del programa
      if (!student.requiredSubjects || student.requiredSubjects.length === 0) {
        // Todos los cursos menos los completados
        return this.subjects
          .map(s => s.id)
          .filter(id => !student.completedSubjects.includes(id));
      }
      
      const missing = student.requiredSubjects.filter(
        subjectId => !student.completedSubjects.includes(subjectId)
      );
      
      return missing;
    },
    
    generateRecommendations() {
      const recommendations = {};
      
      this.students.forEach(student => {
        const missingIds = this.getMissingSubjects(student.id);
        
        missingIds.forEach(subjectId => {
          const subjectName = this.getSubjectName(subjectId);
          
          if (!recommendations[subjectName]) {
            recommendations[subjectName] = {
              subjectId: subjectId,
              students: [],
              count: 0
            };
          }
          
          recommendations[subjectName].students.push(student.name);
          recommendations[subjectName].count++;
        });
      });
      
      return recommendations;
    },
    
    getFormattedRecommendations() {
      const recs = this.generateRecommendations();
      const result = [];
      
      Object.keys(recs).forEach(subject => {
        result.push({
          subject: subject,
          subjectId: recs[subject].subjectId,
          studentCount: recs[subject].count,
          students: recs[subject].students
        });
      });
      
      return result.sort((a, b) => b.studentCount - a.studentCount);
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
      const student = this.students.find(s => s.id === studentId);
      if (!student || !student.grades) return 'N/A';
      
      const completedGrades = Object.values(student.grades)
        .filter(g => g.status === 'Completed' && g.grade !== null);
      
      if (completedGrades.length === 0) return 'N/A';
      
      const sum = completedGrades.reduce((acc, g) => acc + g.grade, 0);
      return (sum / completedGrades.length).toFixed(2);
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
      
      // Si no tiene materias requeridas, mostrar todas las materias con su estado
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
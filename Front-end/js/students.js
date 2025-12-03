//Front-end/js/students.js
// Apartado de Students - Connected to Backend API
// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';

function academicData() {
  return {
    open: false,
    showFilters: false,
    viewMode: 'heatmap',
    selectedStudent: null,
    searchTerm: '',
    programFilter: 'all',
    courseStatusFilter: 'all',
    filters: {
      program: '',
      status: '',
      missingSubjects: false
    },
    subjects: [],
    students: [],
    filteredStudents: [],
    missingCounts: {},
    loading: true,
    error: null,

    currentPage: 1,
    itemsPerPage: 20,

    async init() {
      try {
        this.loading = true;
        
        await Promise.all([
          this.loadCourses(),
          this.loadStudents()
        ]);
        
        this.filteredStudents = [...this.students];
        this.missingCounts = await this.countMissingStudentsByCourse();
        
        console.log('📊 Datos cargados:');
        console.log('- Subjects:', this.subjects.length);
        console.log('- Students:', this.students.length);
        console.log('- Sample student grades:', this.students[0]?.grades);

        this.loading = false;
      } catch (error) {
        console.error('Error initializing data:', error);
        this.error = 'Error loading data. Please refresh the page.';
        this.loading = false;
      }
    },

    async loadCourses() {
      try {
        const response = await fetch(`${API_BASE_URL}/courses`);
        if (!response.ok) throw new Error('Failed to fetch courses');
        
        const courses = await response.json();
        
        this.subjects = courses.map(course => {
          let program = 'BSGM';
          
          const programName = course.program?.programName || course.program || '';
          
          if (programName.includes('Associate') || programName.includes('ASSD')) {
            program = 'ASSD';
          }
          
          return {
            id: parseInt(course.id),
            name: course.courseName || course.name,
            program: program,
            courseCode: course.courseCode || course.code
          };
        });
        
        console.log(`✅ Loaded ${this.subjects.length} courses`);
      } catch (error) {
        console.error('Error loading courses:', error);
        throw error;
      }
    },

    async loadStudents() {
      try {
        const response = await fetch(`${API_BASE_URL}/students`);
        if (!response.ok) throw new Error('Failed to fetch students');
        
        const studentsData = await response.json();
        
        this.students = studentsData.map(student => {
          const progress = {};
          const grades = {};
          
          // ✅ CORREGIDO: Usar programId en vez de buscar en el string
          const programId = student.program?.id || 0;
          const programName = student.program?.programName || '';
          const studentProgram = programId === 1 ? 'BSGM' : 'ASSD';
          
          console.log('🔍 Student program:', {
            studentId: student.studentIdNumber,
            programId: programId,
            programName: programName,
            detected: studentProgram
          });
          
          if (student.grades && typeof student.grades === 'object') {
            Object.entries(student.grades).forEach(([courseId, gradeInfo]) => {
              if (gradeInfo && typeof gradeInfo === 'object') {
                const id = parseInt(courseId);
                const status = gradeInfo.status || 'Not Started';
                const letter = gradeInfo.letter || '-';
                const isEnrolled = gradeInfo.isEnrolled || false;


                if (isEnrolled){
                  progress[id]=1;
                }else{
                  progress[id] = this.gradeStatusToProgressStatus(status, letter);

                }
                
                grades[id] = {
                  grade: gradeInfo.grade || null,
                  letter: letter,
                  status: status,
                  courseCode: gradeInfo.courseCode || '',
                  courseName: gradeInfo.courseName || '',
                  sessionName: gradeInfo.sessionName || 'N/A',
                  isEnrolled : isEnrolled
                };
              }
            });
          }
          
          const relevantSubjects = this.subjects.filter(s => s.program === studentProgram);
          relevantSubjects.forEach(subject => {
            if (typeof progress[subject.id] === 'undefined') {
              progress[subject.id] = 0;
            }
          });
          
          let gpa = 0;
          let letterGrade = 'N/A';
          
          if (Object.keys(grades).length > 0) {
            const numericGrades = Object.values(grades)
              .map(g => g.grade)
              .filter(g => g !== null && g !== undefined && g > 0);
            
            if (numericGrades.length > 0) {
              const sum = numericGrades.reduce((a, b) => a + b, 0);
              const avg = sum / numericGrades.length;
              gpa = this.numericToGPA(avg);
              letterGrade = this.gpaToLetter(gpa);
            }
          }
          
          return {
            id: student.id || 0,
            name: student.name || `${student.firstName} ${student.lastName}`,
            studentId: student.studentIdNumber || 'N/A',
            firstName: student.firstName || '',
            middleName: student.middleName || '',
            lastName: student.lastName || '',
            phone: student.phone || 'N/A',
            emailPersonal: student.email || 'N/A',
            emailSDGKU: student.sdgkuEmail || 'N/A',
            status: student.status || 'Active',
            program: programName, // ✅ Nombre completo del programa
            programType: studentProgram, // ✅ BSGM o ASSD
            modality: student.modality || 'Online',
            cohort: student.cohort || 'N/A',
            language: student.language || 'English',
            totalUnits: student.totalUnits || 0,
            transferredUnits: student.transferredUnits || 0,
            unitsEarned: student.totalUnitsEarned || 0,
            startDate: student.startDate || 'N/A',
            scheduledCompletion: student.scheduledCompletionDate || 'N/A',
            graduationDate: student.graduationDate || 'N/A',
            progress: progress,
            grades: grades,
            gpa: gpa,
            letterGrade: letterGrade
          };
        });
        
        console.log(`✅ Loaded ${this.students.length} students`);
        console.log('Sample student data:', this.students[0]);
      } catch (error) {
        console.error('Error loading students:', error);
        throw error;
      }
    },

    gradeStatusToProgressStatus(status, letter) {
      // Normalizar status a minúsculas
      const normalizedStatus = status ? status.toLowerCase().trim() : '';
      const normalizedLetter = letter ? letter.toUpperCase().trim() : '';
      
      // Casos transferred
      if (normalizedLetter === 'T' || normalizedLetter === 'P') {
        return 4;
      }
      
      if (normalizedStatus === 'transferred') {
        return 4;
      }
      
      // Otros casos
      if (!normalizedStatus || normalizedStatus === 'not started') {
        return 0;
      }
      if (normalizedStatus === 'in progress') {
        return 1;
      }
      if (normalizedStatus === 'completed') {
        return 2;
      }
      if (normalizedStatus === 'failed') {
        return 3;
      }
      
      return 0;
    },

    numericToGPA(numeric) {
      if (numeric >= 93) return 4.0;
      if (numeric >= 90) return 3.7;
      if (numeric >= 87) return 3.3;
      if (numeric >= 83) return 3.0;
      if (numeric >= 80) return 2.7;
      if (numeric >= 77) return 2.3;
      if (numeric >= 73) return 2.0;
      if (numeric >= 70) return 1.7;
      if (numeric >= 67) return 1.3;
      if (numeric >= 60) return 1.0;
      return 0.0;
    },

    gpaToLetter(gpa) {
      if (gpa >= 4.0) return 'A+';
      if (gpa >= 3.7) return 'A';
      if (gpa >= 3.3) return 'A-';
      if (gpa >= 3.0) return 'B+';
      if (gpa >= 2.7) return 'B';
      if (gpa >= 2.3) return 'B-';
      if (gpa >= 2.0) return 'C+';
      if (gpa >= 1.7) return 'C';
      if (gpa >= 1.3) return 'C-';
      if (gpa >= 1.0) return 'D';
      return 'F';
    },

    calculateAverageGPA() {
      if (this.filteredStudents.length === 0) return 0;
      const totalGpa = this.filteredStudents.reduce((sum, student) => sum + (student.gpa || 0), 0);
      const avg = totalGpa / this.filteredStudents.length;
      return parseFloat(avg.toFixed(2));
    },

    getAverageGPALetter() {
      return this.gpaToLetter(this.calculateAverageGPA());
    },

    syncProgramFilter(source) {
      if (source === 'dropdown') {
        if (this.filters.program === 'bachelor') this.programFilter = 'BSGM';
        else if (this.filters.program === 'associate') this.programFilter = 'ASSD';
        else this.programFilter = 'all';
      } else if (source === 'buttons') {
        if (this.programFilter === 'BSGM') this.filters.program = 'bachelor';
        else if (this.programFilter === 'ASSD') this.filters.program = 'associate';
        else this.filters.program = '';
      }
    },

    async setStudentStatus(studentToUpdate, newStatus) {
      try {
        const response = await fetch(`${API_BASE_URL}/students/${studentToUpdate.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: newStatus.toLowerCase().replace(' ', '_') 
          })
        });
        
        if (response.ok) {
          studentToUpdate.status = newStatus;
          this.applyFilters();
          console.log(`✅ Student ${studentToUpdate.id} status updated to: ${newStatus}`);
        }
      } catch (error) {
        console.error('Error updating student status:', error);
        alert('Failed to update student status. Please try again.');
      }
    },

    hasMissingSubjects(student) {
      // ✅ Usar programType
      const relevantSubjects = this.subjects.filter(s => s.program === student.programType);
      
      return relevantSubjects.some(subject => {
        const status = student.progress[subject.id];
        return status === 0 || typeof status === 'undefined';
      });
    },

    getStatusColor(status) {
      switch(status) {
        case 0: return 'bg-gray-400';
        case 1: return 'bg-[#F69A1C]';
        case 2: return 'bg-[#D41736]';
        case 3: return 'bg-[#252121]';
        case 4: return 'bg-[#E35E26]';
        default: return 'bg-gray-400';
      }
    },

    getStatusIcon(status) {
      switch(status) {
        case 0: return 'fa-solid fa-clock';
        case 1: return 'fa-solid fa-book-open';
        case 2: return 'fa-solid fa-check-circle';
        case 3: return 'fa-solid fa-times-circle';
        case 4: return 'fa-solid fa-exchange-alt';
        default: return 'fa-solid fa-clock';
      }
    },

    getStatusText(status) {
      switch(status) {
        case 0: return 'Not Started';
        case 1: return 'In Progress';
        case 2: return 'Completed';
        case 3: return 'Failed';
        case 4: return 'Transferred';
        default: return 'Not Started';
      }
    },

    getStatusColorWithGrade(status, grade) {
      return this.getStatusColor(status);
    },

    getStatusIconWithGrade(status, grade) {
      return this.getStatusIcon(status);
    },

    async countMissingStudentsByCourse() {
      const courseCounts = {};
      const genEdCodes = ['ALG1', 'ALG2', 'QR', 'ENG1', 'SPE', 'ENG2', 'ART', 'PHI', 'WH', 'PS', 'PH', 'ES'];
      
      this.subjects.forEach(subject => {
        let missingCount = 0;
        const isGenEd = genEdCodes.includes(subject.courseCode);
        
        this.students.forEach(student => {
          // ✅ Usar programType
          const belongsToProgram = subject.program === student.programType;
          
          if (isGenEd || belongsToProgram) {
            const status = student.progress[subject.id];
            if (status === 0 || typeof status === 'undefined') {
              missingCount++;
            }
          }
        });
        
        courseCounts[subject.id] = missingCount;
      });
      
      return courseCounts;
    },

    calculateProgress(student) {
      // ✅ Usar programType
      const relevantSubjects = this.subjects.filter(s => s.program === student.programType);
      if (relevantSubjects.length === 0) return 0;
      
      const completed = Object.entries(student.progress)
        .filter(([id, status]) => {
          const subjectId = parseInt(id);
          return relevantSubjects.some(s => s.id === subjectId) && status === 2;
        }).length;
      
      return (completed / relevantSubjects.length) * 100;
    },

    getCompletedCount(student) {
      // ✅ Usar programType
      const relevantSubjects = this.subjects.filter(s => s.program === student.programType);
      
      return Object.entries(student.progress)
        .filter(([id, status]) => {
          const subjectId = parseInt(id);
          return relevantSubjects.some(s => s.id === subjectId) && status === 2;
        }).length;
    },

    getTotalSubjects(student) {
      // ✅ Usar programType
      return this.subjects.filter(s => s.program === student.programType).length;
    },

    getFilteredSubjects() {
      if (this.programFilter === 'all') return this.subjects;
      if (this.programFilter === 'GEN_ED') {
        const genEdCodes = ['ALG1', 'ALG2', 'QR', 'ENG1', 'SPE', 'ENG2', 'ART', 'PHI', 'WH', 'PS', 'PH', 'ES'];
        return this.subjects.filter(s => genEdCodes.includes(s.courseCode));
      }
      return this.subjects.filter(s => s.program === this.programFilter);
    },

    getFilteredStudentsByProgram() {
      if (this.programFilter === 'all') return this.filteredStudents;
      // ✅ Usar programType directamente
      return this.filteredStudents.filter(s => s.programType === this.programFilter);
    },

    getSortedAndFilteredCourses(student) {
      if (!student || !student.progress) return [];
      
      // ✅ Usar programType
      const relevantSubjects = this.subjects.filter(s => s.program === student.programType);

      const filteredSubjects = relevantSubjects.filter(subject => {
        const status = student.progress[subject.id];
        
        if (this.courseStatusFilter === 'all') return true;
        if (status === undefined && this.courseStatusFilter === 0) return true;
        
        return status === this.courseStatusFilter;
      });

      const sortOrder = { 0: 1, 3: 2, 1: 3, 2: 4, undefined: 1 };
      
      return filteredSubjects.sort((a, b) => {
        const statusA = student.progress[a.id];
        const statusB = student.progress[b.id];
        
        const orderA = sortOrder[statusA] || 1;
        const orderB = sortOrder[statusB] || 1;
        
        return orderA - orderB;
      });
    },

    getBehindStudents() {
      return this.filteredStudents.filter(s => this.calculateProgress(s) < 50).length;
    },

    applyFilters() {
      this.filteredStudents = this.students.filter(student => {
        let match = true;
        
        // ✅ Usar programType directamente
        if (this.programFilter !== 'all') {
          match = match && student.programType === this.programFilter;
        }
        
        if (this.filters.status) {
          const progress = this.calculateProgress(student);
          if (this.filters.status === 'complete') match = match && progress === 100;
          else if (this.filters.status === 'ontrack') match = match && progress >= 50 && progress < 100;
          else if (this.filters.status === 'behind') match = match && progress < 50;
        }
        
        if (this.filters.missingSubjects) {
          match = match && this.hasMissingSubjects(student);
        }
        
        if (this.searchTerm) {
          const search = this.searchTerm.toLowerCase();
          match = match && (
            student.name.toLowerCase().includes(search) ||
            student.studentId.toLowerCase().includes(search) ||
            (student.emailSDGKU && student.emailSDGKU.toLowerCase().includes(search))
          );
        }
        
        return match;
      });
      this.currentPage = 1;
    },

    clearFilters() {
      this.filters = {
        program: '',
        status: '',
        missingSubjects: false
      };
      this.searchTerm = '';
      this.programFilter = 'all';
      this.currentPage = 1;
      this.applyFilters();
    },

    // Pagination methods
    getTotalPages() {
      const students = this.getFilteredStudentsByProgram();
      return Math.ceil(students.length / this.itemsPerPage);
    },

    getStartIndex() {
      return (this.currentPage - 1) * this.itemsPerPage;
    },

    getEndIndex() {
      const students = this.getFilteredStudentsByProgram();
      const end = this.currentPage * this.itemsPerPage;
      return Math.min(end, students.length);
    },

    getPaginatedStudents() {
      const students = this.getFilteredStudentsByProgram();
      const start = this.getStartIndex();
      const end = this.getEndIndex();
      return students.slice(start, end);
    },

    nextPage() {
      if (this.currentPage < this.getTotalPages()) {
        this.currentPage++;
      }
    },

    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },

    goToPage(page) {
      this.currentPage = page;
    },

    exportStudentReport(student) {
      if (!student) return;
      
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      const primaryColor = [166, 25, 46]; // #A6192E
      
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
        ['GPA:', normalizeText(student.gpa ? student.gpa.toFixed(2) : 'N/A')]
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
      
      // Obtener todas las materias relevantes del estudiante
      const relevantSubjects = this.subjects.filter(s => s.program === student.programType);
      
      const tableData = relevantSubjects.map(subject => {
        const gradeInfo = student.grades[subject.id];
        const status = student.progress[subject.id];
        
        return [
          normalizeText(subject.name || 'Unknown'),
          normalizeText('3'), // Units por defecto
          gradeInfo?.grade ? normalizeText(gradeInfo.grade) : '-',
          gradeInfo?.letter || '-',
          normalizeText(this.getStatusText(status))
        ];
      });
      
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
    }

  }
}
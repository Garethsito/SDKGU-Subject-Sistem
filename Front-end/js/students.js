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

    async init() {
      try {
        this.loading = true;
        
        await Promise.all([
          this.loadCourses(),
          this.loadStudents()
        ]);
        
        this.filteredStudents = [...this.students];
        this.missingCounts = await this.countMissingStudentsByCourse();
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
          if (course.program.includes('ASSD')) {
            program = 'ASSD';
          }
          
          return {
            id: parseInt(course.id),
            name: course.name,
            program: program,
            courseCode: course.code
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
          
          // ✅ FIXED: Verificar que student.grades existe y es un objeto
          if (student.grades && typeof student.grades === 'object') {
            Object.entries(student.grades).forEach(([courseId, gradeInfo]) => {
              // Verificar que gradeInfo existe antes de acceder a sus propiedades
              if (gradeInfo && typeof gradeInfo === 'object') {
                const id = parseInt(courseId);
                progress[id] = this.gradeStatusToProgressStatus(
                  gradeInfo.status || 'Not Started', 
                  gradeInfo.letter || '-'
                );
                grades[id] = {
                  grade: gradeInfo.grade || null,
                  letter: gradeInfo.letter || '-',
                  status: gradeInfo.status || 'Not Started',
                  courseCode: gradeInfo.courseCode || '',
                  courseName: gradeInfo.courseName || '',
                  sessionName: gradeInfo.sessionName || 'N/A'
                };
              }
            });
          }
          
          const studentProgram = student.program && student.program.includes('Bachelor') ? 'BSGM' : 'ASSD';
          
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
            name: student.name || 'Unknown',
            studentId: student.studentId || 'N/A',
            firstName: student.firstName || '',
            middleName: student.middleName || '',
            lastName: student.lastName || '',
            phone: student.phone || 'N/A',
            emailPersonal: student.emailPersonal || 'N/A',
            emailSDGKU: student.emailSDGKU || 'N/A',
            status: student.status || 'Active',
            program: student.program || 'Unknown',
            modality: student.modality || 'Online',
            cohort: student.cohort || 'N/A',
            language: student.language || 'English',
            totalUnits: student.totalUnits || 0,
            transferredUnits: student.transferredUnits || 0,
            unitsEarned: student.unitsEarned || 0,
            startDate: student.startDate || 'N/A',
            scheduledCompletion: student.scheduledCompletion || 'N/A',
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
      if (!status || status === 'Not Started') return 0;
      if (status === 'In Progress') return 1;
      if (status === 'Completed' && letter === 'P') return 4; // Transfer
      if (status === 'Completed' && letter !== 'F') return 2;
      if (letter === 'F' || status === 'Failed') return 3;
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
      const studentProgram = student.program.includes('Bachelor') ? 'BSGM' : 'ASSD';
      const relevantSubjects = this.subjects.filter(s => s.program === studentProgram);
      
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
          const studentProgram = student.program.includes('Bachelor') ? 'BSGM' : 'ASSD';
          const belongsToProgram = subject.program === studentProgram;
          
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
      const studentProgram = student.program.includes('Bachelor') ? 'BSGM' : 'ASSD';
      const relevantSubjects = this.subjects.filter(s => s.program === studentProgram);
      if (relevantSubjects.length === 0) return 0;
      
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
      if (this.programFilter === 'GEN_ED') {
        const genEdCodes = ['ALG1', 'ALG2', 'QR', 'ENG1', 'SPE', 'ENG2', 'ART', 'PHI', 'WH', 'PS', 'PH', 'ES'];
        return this.subjects.filter(s => genEdCodes.includes(s.courseCode));
      }
      return this.subjects.filter(s => s.program === this.programFilter);
    },

    getFilteredStudentsByProgram() {
      if (this.programFilter === 'all') return this.filteredStudents;
      const programType = this.programFilter === 'BSGM' ? 'Bachelor' : 'Associate';
      return this.filteredStudents.filter(s => s.program.includes(programType));
    },

    getSortedAndFilteredCourses(student) {
      if (!student || !student.progress) return [];
      
      const studentProgram = student.program.includes('Bachelor') ? 'BSGM' : 'ASSD';
      const relevantSubjects = this.subjects.filter(s => s.program === studentProgram);

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
        
        if (this.filters.program) {
          match = match && student.program.toLowerCase().includes(this.filters.program);
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
    },

    clearFilters() {
      this.filters = {
        program: '',
        status: '',
        missingSubjects: false
      };
      this.searchTerm = '';
      this.programFilter = 'all';
      this.applyFilters();
    }
  }
}
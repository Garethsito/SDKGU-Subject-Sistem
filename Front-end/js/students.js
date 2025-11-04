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
        courseStatusFilter: 'all', 
        filters: {
          program: '', 
          status: '',
          missingSubjects: false // Este filtro ahora solo controla la VISTA del heatmap
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
          // (Los datos de los estudiantes permanecen igual)
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
            
            const randomGpa = (Math.random() * 2.0) + 2.0; 
            student.gpa = parseFloat(randomGpa.toFixed(2));
            student.letterGrade = this.gpaToLetter(student.gpa);
          });
          this.filteredStudents = [...this.students];
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

        setStudentStatus(studentToUpdate, newStatus) {
            studentToUpdate.status = newStatus;
            this.applyFilters();
        },
        
        // (Esta función 'hasMissingSubjects' ya no se usa para filtrar, pero no hace daño)
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
            default: return 'Not Started'; 
          }
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
          return this.subjects.filter(s => s.program === this.programFilter);
        },
        
        getFilteredStudentsByProgram() {
          if (this.programFilter === 'all') return this.filteredStudents;
          const programType = this.programFilter === 'BSGM' ? 'Bachelor' : 'Associate';
          return this.filteredStudents.filter(s => s.program.includes(programType));
        },

        getSortedAndFilteredCourses(student) {
          if (!student) return []; 
          
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
            
            const orderA = sortOrder[statusA];
            const orderB = sortOrder[statusB];
            
            return orderA - orderB;
          });
        },
        
        getBehindStudents() {
          return this.filteredStudents.filter(s => this.calculateProgress(s) < 50).length;
        },
        
        applyFilters() {
          this.filteredStudents = this.students.filter(student => {
            let match = true;
            
            // Filtro por Programa (del dropdown)
            if (this.filters.program) {
              match = match && student.program.toLowerCase().includes(this.filters.program);
            }
            
            // Filtro por Estatus de Progreso
            if (this.filters.status) {
              const progress = this.calculateProgress(student);
              if (this.filters.status === 'complete') match = match && progress === 100;
              else if (this.filters.status === 'ontrack') match = match && progress >= 50 && progress < 100;
              else if (this.filters.status === 'behind') match = match && progress < 50;
            }
            
            // Filtro por Término de Búsqueda
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
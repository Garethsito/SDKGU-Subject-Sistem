function coursesData() {
  return {
    open: false,
    message: '',
    showFilters: false,
    selectedCourse: null,
    searchQuery: '',
    totalActiveStudents: 0,

    filters: {
      program: 'all',
      session: 'all',
      occupancy: 'all',
      prerequisites: 'all'
    },

    modalStudentFilter: 'current',

    showCreateSessionModal: false,
    newSessionTemplate: null,
    newSession: { number: null, startDate: '', endDate: '', status: 'Planning', courses: [] },
    newSessionCoursesInput: '',

    toast: { show: false, message: '', type: 'success' },

    programConfig: {
      'ASSD': { label: 'ASSD', color: 'B34B20' },
      'BGSM': { label: 'BSGM', color: 'D41736' },
      'BSGM & ASSD': { label: 'EDU-GEN', color: '4D4E4E' }
    },

    allCourses: [],
    courses: [],
    availablePrograms: [],
    availableSessions: [],

    async init() {
      await this.fetchCourses();
      this.courses = [...this.allCourses];
      
      // Extract unique programs and sessions for filters
      this.availablePrograms = [...new Set(this.allCourses.map(c => c.program))];
      this.availableSessions = [...new Set(this.allCourses.map(c => c.session))];
      
      // Get total active students
      try {
        const studentsRes = await fetch('http://localhost:3000/api/students/count');
        const result = await studentsRes.json();
        this.totalActiveStudents = result.total;
      } catch (error) {
        console.error('❌ Error getting students:', error);
      }
    },

    async fetchCourses() {
      try {
        const res = await fetch('http://localhost:3000/api/courses'); 
        const data = await res.json();
        
        if (!Array.isArray(data)) {
          console.error('❌ Expected array but got:', data);
          this.allCourses = [];
          return;
        }
        
        // Get total active students in the system
        const studentsRes = await fetch('http://localhost:3000/api/students/count');
        const result = await studentsRes.json();
        const totalActiveStudents = result.total;
        
        this.allCourses = data.map(c => {
          const missingCount = c.courseData?.missingStudents?.length || 0;
          const missingPercent = totalActiveStudents > 0 
            ? Math.round((missingCount / totalActiveStudents) * 100) 
            : 0;
          
          return {
            ...c,
            occupancy: c.maxStudents ? Math.round((c.students.length / c.maxStudents) * 100) : 0,
            missingCount: missingCount,
            missingPercent: missingPercent
          };
        });
        
        console.log('✅ Loaded courses:', this.allCourses);
      } catch (error) {
        console.error('❌ Error loading courses from backend:', error);
        this.allCourses = [];
      }
    },
    
    getProgramConfig(program) {
      return this.programConfig[program] || { label: program, color: 'A6192E' };
    },
    
    getCardBg(occupancy) {
      if (occupancy >= 70) return 'rgba(255, 255, 255, 0.6)';
      if (occupancy >= 40) return 'rgba(255, 255, 255, 0.4)';
      return 'rgba(255, 194, 194, 0.4)';
    },

    showStudents(course) {
      this.selectedCourse = course;
      this.modalStudentFilter = 'current';
    },

    recalculateMetrics(course) {
      this.allCourses.forEach(c => {
        if (c.code === course.code) {
          const missing = c.courseData?.missingStudents?.length || 0;
          
          c.missingCount = missing;
          c.missingPercent = this.totalActiveStudents > 0 
            ? Math.round((missing / this.totalActiveStudents) * 100) 
            : 0;
          c.occupancy = c.maxStudents ? Math.round((c.students.length / c.maxStudents) * 100) : 0;
        }
      });
    },

    enrollStudent(student) {
      if (!this.selectedCourse) return;

      this.selectedCourse.courseData.missingStudents = this.selectedCourse.courseData.missingStudents.filter(s => s.id !== student.id);
      this.selectedCourse.students.push(student);
      this.recalculateMetrics(this.selectedCourse);
    },

    removeStudent(studentId) {
      if (!this.selectedCourse) return;

      const student = this.selectedCourse.students.find(s => s.id === studentId);
      if (!student) return;

      this.selectedCourse.students = this.selectedCourse.students.filter(s => s.id !== studentId);
      this.selectedCourse.courseData.missingStudents.push(student);
      this.recalculateMetrics(this.selectedCourse);
    },

    openCreateSessionModal() {
      this.newSessionTemplate = this.selectedCourse;
      this.newSession = {
        number: null,
        startDate: '',
        endDate: '',
        status: 'Planning',
        courses: [this.selectedCourse.code]
      };
      this.newSessionCoursesInput = this.selectedCourse.code;
      this.selectedCourse = null;
      this.showCreateSessionModal = true;
    },

    updateNewSessionCoursesArray() {
      this.newSession.courses = this.newSessionCoursesInput.split(',').map(s => s.trim()).filter(Boolean);
    },

    saveNewSession() {
      console.log('Simulating session creation:', this.newSession);
      this.showCreateSessionModal = false;
      this.showToast(`Session ${this.newSession.number} for ${this.newSessionCoursesInput} created successfully!`);
      this.newSession = { number: null, startDate: '', endDate: '', status: 'Planning', courses: [] };
      this.newSessionCoursesInput = '';
      this.newSessionTemplate = null;
    },

    showToast(message, type = 'success') {
      this.toast.message = message;
      this.toast.type = type;
      this.toast.show = true;
      setTimeout(() => { this.toast.show = false; }, 3000);
    },

    clearFilters() {
      this.filters = { program: 'all', session: 'all', occupancy: 'all', prerequisites: 'all' };
      this.courses = [...this.allCourses];
      this.message = '';
    },

    applyFilters() {
      let filtered = [...this.allCourses];

      // Filter by Program (exact match with real program names)
      if (this.filters.program !== 'all') {
        filtered = filtered.filter(c => c.program === this.filters.program);
      }

      // Filter by Session (exact match with real session names)
      if (this.filters.session !== 'all') {
        filtered = filtered.filter(c => c.session === this.filters.session);
      }

      // Filter by Occupancy/Demand Level (based on missingPercent)
      if (this.filters.occupancy !== 'all') {
        filtered = filtered.filter(c => {
          const perc = c.missingPercent;
          switch(this.filters.occupancy) {
            case 'critical': return perc >= 75;
            case 'low': return perc >= 40 && perc < 75;
            case 'optimal': return perc >= 10 && perc < 40;
            case 'full': return perc < 10;
            default: return true;
          }
        });
      }

      // Filter by Prerequisites
      if (this.filters.prerequisites !== 'all') {
        filtered = filtered.filter(c => {
          const hasPrereqs = c.prerequisites && c.prerequisites.length > 0;
          return (this.filters.prerequisites === 'yes') ? hasPrereqs : !hasPrereqs;
        });
      }

      this.courses = filtered;
      this.showFilters = false;
      this.message = `${filtered.length} course${filtered.length !== 1 ? 's' : ''} found`;
      
      console.log('🔍 Applied filters:', this.filters);
      console.log('📊 Filtered results:', filtered.length);
    }
  }
}
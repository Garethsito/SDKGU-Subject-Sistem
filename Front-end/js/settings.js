
function settingsData() {
  return {
    activeTab: 'activity', // Tab por defecto
    
    // ⭐ DATOS PARA ADMINISTRATORS (AHORA EN ACTIVITY LOG)
    newAdmin: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      status: 'Active'
    },
    administrators: [
      { id: 1, firstName: 'John', lastName: 'Doe', email: 'john.doe@sdgku.edu', phone: '+1 (619) 555-0100', role: 'Super Admin', status: 'Active' },
      { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@sdgku.edu', phone: '+1 (619) 555-0101', role: 'Admin', status: 'Active' }
    ],
    
    // ⭐ DATOS PARA ACTIVITY LOG
    activityLog: [],

    activityFilters: {
      user: '',
      action: '',
      dateFrom: '',
      dateTo: ''
    },

    currentPage: 1,
    itemsPerPage: 10, // o 100 si quieres, pero 10 es más usable

    isLoadingActivity: false,
    activityError: null,

    // Cargar actividades desde el backend
    async loadActivityLog() {
      this.isLoadingActivity = true;
      this.activityError = null;

      try {
        console.log('🔄 Loading activity timeline...');
        // OJO: el controller es 'activity-timeline', con guión
        const res = await fetch('http://localhost:3000/activityTimeline/recent');
        console.log('Status:', res.status);

        if (!res.ok) {
          throw new Error(`Failed to load activity timeline: ${res.status}`);
        }

        const data = await res.json();
        console.log('✅ Timeline data:', data);

        this.activityLog = data;
        this.currentPage = 1;

      } catch (e) {
        console.error('❌ Error loading activity timeline:', e);
        this.activityError = 'Could not load activity timeline';
      } finally {
        this.isLoadingActivity = false;
      }
    },

    // 🔹 LISTA FILTRADA COMPLETA (sin paginar)
    get filteredActivityLogAll() {
      let filtered = this.activityLog;

      if (this.activityFilters.user) {
        filtered = filtered.filter(a => a.user === this.activityFilters.user);
      }

      if (this.activityFilters.action) {
        filtered = filtered.filter(a => a.type === this.activityFilters.action);
      }

      if (this.activityFilters.dateFrom) {
        filtered = filtered.filter(a => a.date >= this.activityFilters.dateFrom);
      }

      if (this.activityFilters.dateTo) {
        filtered = filtered.filter(a => a.date <= this.activityFilters.dateTo);
      }

      return filtered;
    },

    // 🔹 LISTA FILTRADA + PAGINADA (esta es la que usa el x-for)
    get filteredActivityLog() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end   = this.currentPage * this.itemsPerPage;
      return this.filteredActivityLogAll.slice(start, end);
    },

    // 🔹 Cantidad total filtrada (para "Showing X of Y")
    get filteredActivityCount() {
      return this.filteredActivityLogAll.length;
    },

    applyActivityFilters() {
      this.currentPage = 1;
      console.log('Filters applied:', this.activityFilters);
    },

    clearActivityFilters() {
      this.activityFilters = {
        user: '',
        action: '',
        dateFrom: '',
        dateTo: ''
      };
      this.currentPage = 1;
    },

    exportActivityLog() {
      alert('Exporting activity log to Excel...');
      console.log('Activity log data:', this.activityLog);
    },

    
    // ⭐ MÉTODOS PARA ADMINISTRATORS
    addAdministrator() {
      const newId = this.administrators.length > 0 ? Math.max(...this.administrators.map(a => a.id)) + 1 : 1;
      this.administrators.push({
        id: newId,
        ...this.newAdmin
      });
      
      // Agregar actividad al log
      this.activityLog.unshift({
        id: this.activityLog.length + 1,
        user: 'Current User', // Cambiar por usuario actual
        type: 'Student Added',
        description: `Added new administrator: ${this.newAdmin.firstName} ${this.newAdmin.lastName}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        ipAddress: '192.168.1.100',
        details: {
          'Name': `${this.newAdmin.firstName} ${this.newAdmin.lastName}`,
          'Email': this.newAdmin.email,
          'Role': this.newAdmin.role
        }
      });
      
      alert('Administrator added successfully!');
      this.resetAdminForm();
    },
    
    resetAdminForm() {
      this.newAdmin = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        status: 'Active'
      };
    },
    
    deleteAdmin(id) {
      if (confirm('Are you sure you want to delete this administrator?')) {
        const admin = this.administrators.find(a => a.id === id);
        this.administrators = this.administrators.filter(a => a.id !== id);
        
        // Agregar actividad al log
        if (admin) {
          this.activityLog.unshift({
            id: this.activityLog.length + 1,
            user: 'Current User',
            type: 'Student Added',
            description: `Deleted administrator: ${admin.firstName} ${admin.lastName}`,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            ipAddress: '192.168.1.100',
            details: {
              'Name': `${admin.firstName} ${admin.lastName}`,
              'Email': admin.email,
              'Role': admin.role
            }
          });
        }
      }
    },
    
    // ⭐ MÉTODOS PARA ESTADÍSTICAS
    getTodayLogins() {
      const today = new Date().toISOString().split('T')[0];
      return this.activityLog.filter(a => a.type === 'Login' && a.date === today).length;
    },
    
    getActiveUsers() {
      const uniqueUsers = [...new Set(this.activityLog.map(a => a.user))];
      return uniqueUsers.length;
    },
    
    getRecentChanges() {
      const today = new Date().toISOString().split('T')[0];
      return this.activityLog.filter(a => a.date === today && a.type !== 'Login' && a.type !== 'Logout').length;
    },
    
    applyActivityFilters() {
      this.currentPage = 1;
      console.log('Filters applied:', this.activityFilters);
    },
    
    clearActivityFilters() {
      this.activityFilters = {
        user: '',
        action: '',
        dateFrom: '',
        dateTo: ''
      };
      this.currentPage = 1;
    },
    
    exportActivityLog() {
      alert('Exporting activity log to Excel...');
      // Aquí implementarías la exportación con XLSX
      console.log('Activity log data:', this.activityLog);
    },
    
    // ⭐ DATOS PARA TEACHERS
    newTeacher: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      specialization: ''
    },
    teachers: [
      { id: 1, firstName: 'Robert', lastName: 'Johnson', email: 'r.johnson@sdgku.edu', phone: '+1 (619) 555-0200', department: 'Computer Science', specialization: 'AI & Machine Learning' },
      { id: 2, firstName: 'Maria', lastName: 'Garcia', email: 'm.garcia@sdgku.edu', phone: '+1 (619) 555-0201', department: 'Mathematics', specialization: 'Statistics' }
    ],
    
    addTeacher() {
      const newId = this.teachers.length > 0 ? Math.max(...this.teachers.map(t => t.id)) + 1 : 1;
      this.teachers.push({
        id: newId,
        ...this.newTeacher
      });
      alert('Teacher added successfully!');
      this.resetTeacherForm();
    },
    
    resetTeacherForm() {
      this.newTeacher = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        specialization: ''
      };
    },
    
    deleteTeacher(id) {
      if (confirm('Are you sure you want to delete this teacher?')) {
        this.teachers = this.teachers.filter(t => t.id !== id);
      }
    },
    
    // ⭐ DATOS PARA PROGRAMS
    newProgram: {
      name: '',
      type: '',
      totalUnits: '',
      duration: '',
      description: ''
    },
    programs: [
      { id: 1, name: 'Computer Science', type: "Bachelor's", totalUnits: 120, duration: 4, description: 'Comprehensive program in computer science and software development' },
      { id: 2, name: 'Business Administration', type: 'Associate', totalUnits: 60, duration: 2, description: 'Foundational business principles and practices' }
    ],
    
    addProgram() {
      const newId = this.programs.length > 0 ? Math.max(...this.programs.map(p => p.id)) + 1 : 1;
      this.programs.push({
        id: newId,
        ...this.newProgram
      });
      alert('Program added successfully!');
      this.resetProgramForm();
    },
    
    resetProgramForm() {
      this.newProgram = {
        name: '',
        type: '',
        totalUnits: '',
        duration: '',
        description: ''
      };
    },
    
    deleteProgram(id) {
      if (confirm('Are you sure you want to delete this program?')) {
        this.programs = this.programs.filter(p => p.id !== id);
      }
    },
    
    // ⭐ DATOS PARA SUBJECTS
    newSubject: {
      name: '',
      code: '',
      units: '',
      department: '',
      description: ''
    },
    subjects: [
      { id: 1, name: 'Introduction to Programming', code: 'CS101', units: 4, department: 'Computer Science' },
      { id: 2, name: 'Calculus I', code: 'MATH101', units: 4, department: 'Mathematics' }
    ],
    
    addSubject() {
      const newId = this.subjects.length > 0 ? Math.max(...this.subjects.map(s => s.id)) + 1 : 1;
      this.subjects.push({
        id: newId,
        ...this.newSubject
      });
      alert('Subject added successfully!');
      this.resetSubjectForm();
    },
    
    resetSubjectForm() {
      this.newSubject = {
        name: '',
        code: '',
        units: '',
        department: '',
        description: ''
      };
    },
    
    deleteSubject(id) {
      if (confirm('Are you sure you want to delete this subject?')) {
        this.subjects = this.subjects.filter(s => s.id !== id);
      }
    },
    
    // ⭐ DATOS PARA IMPORT
    selectedFile: null,
    importType: '',
    importResult: null,
    importHistory: [
      { id: 1, date: '2025-01-10', fileName: 'students_fall_2024.xlsx', type: 'Students', records: 150, status: 'Success' },
      { id: 2, date: '2025-01-05', fileName: 'subjects_2024.xlsx', type: 'Subjects', records: 45, status: 'Success' }
    ],
    
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) { // 10MB
          alert('File size exceeds 10MB limit');
          return;
        }
        this.selectedFile = file;
      }
    },
    
    clearFile() {
      this.selectedFile = null;
      document.getElementById('fileUpload').value = '';
    },
    
    formatFileSize(bytes) {
      if (!bytes) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
    
  async processImport() {
    if (!this.selectedFile || !this.importType) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    try {
      // Para el caso de grades, procesamos el Excel en el frontend
      if (this.importType === 'grades') {
        const data = await this.readExcelFile(this.selectedFile);
        const results = [];

        for (const row of data) {
          // Mapear columnas del Excel a propiedades del backend
          const studentId = row['Students ID Number'];
          const courseCode = row['Course'];
          const grade = row['Grade'];
          const status = row['Status'] || 'Completed'; // valor por defecto si no hay status

          if (!studentId || !courseCode || !grade) {
            console.warn('Fila incompleta, se omite:', row);
            continue; // saltar filas incompletas
          }

          // Llamar al endpoint de grades (puedes usar fetch o axios)
          const res = await fetch(`http://localhost:3000/api/students/${studentId}/grades`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseCode, grade, status })
          });
          let result = {};
          if (res.ok) {
            result = await res.json();
          } else {
            console.error('HTTP error:', res.status, res.statusText);
            result = { success: false };
          }
        }

        this.importResult = {
          success: true,
          message: 'Grades imported successfully',
          recordsProcessed: results.length
        };

        this.importHistory.unshift({
          id: Date.now(),
          date: new Date().toLocaleString(),
          fileName: this.selectedFile.name,
          type: this.importType,
          records: results.length,
          status: 'Success'
        });

        this.selectedFile = null;
        this.importType = '';

        return;
      }

      // Para otros tipos de import (students, teachers, etc.)
      const url = `${this.apiUrl}/import/${this.importType}`;
      console.log('📤 Importando archivo...', this.importType);

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      this.importResult = result;
      this.importHistory.unshift({
        id: Date.now(),
        date: new Date().toLocaleString(),
        fileName: this.selectedFile.name,
        type: this.importType,
        records: result?.recordsProcessed || 0,
        status: result?.success ? 'Success' : 'Failed'
      });

      if (result.success) {
        this.selectedFile = null;
        this.importType = '';
      }

    } catch (error) {
      console.error('❌ Error importing file:', error);
      this.importResult = {
        success: false,
        message: 'Error importing file',
        details: error.message
      };
    }
  },

  // Método auxiliar para leer Excel en el frontend
  async readExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        resolve(rows);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  },
      downloadTemplate() {
        alert('Template download feature will be implemented with actual Excel generation');
      }
  };
}

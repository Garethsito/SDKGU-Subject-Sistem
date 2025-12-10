function settingsData() {
  return {
    init() {
      this.loadActivityLog();
      this.loadTeachers();
      this.loadPrograms();
      this.loadSubjects();
      this.loadAdministrators(); // 🆕 Agregar esta línea
    },
    open: false,
    activeTab: 'activity', // Tab por defecto
    searchQuery: '',
    showFilters: false,

    filters: {
      user: '',
      action: '',
      dateFrom: '',
      dateTo: ''
    },

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
    
    activityLog: [],

    activityFilters: {
      user: '',
      action: '',
      dateFrom: '',
      dateTo: ''
    },

    currentPage: 1,
    itemsPerPage: 10, 

    isLoadingActivity: false,
    activityError: null,

    // ======================
    // ⭐ Activity Timeline
    // ======================
    async loadActivityLog() {
      this.isLoadingActivity = true;
      this.activityError = null;

      try {
        console.log('🔄 Loading activity timeline...');

        const res = await fetch('http://localhost:3000/activityTimeline/recent');
        console.log('Status:', res.status);

        if (!res.ok) {
          throw new Error(`Failed to load activity timeline: ${res.status}`);
        }

        const data = await res.json();
        console.log('✅ Timeline data:', data);

        const array = Array.isArray(data) ? data : [];

        // 🔥 Aquí mapeamos entityCode/activityCode → type amigable
        this.activityLog = array.map(a => ({
          ...a,
          type: this.mapActivityType(a),
        }));

      } catch (e) {
        console.error('❌ Error loading activity timeline:', e);
        this.activityError = 'Could not load activity timeline';
      } finally {
        this.isLoadingActivity = false;
      }
    },

    // Traductor de entityCode/activityCode → type (lo que usa el HTML, filtros, iconos)
    mapActivityType(activity) {
      const entity  = activity.entityCode;
      const code    = activity.activityCode;
      const rawType = (activity.type || '').toLowerCase();

      // 🎓 Maestros
      if (entity === 'TEACHER') {
        // CREATE → usar el estilo de Teacher Assignment
        if (
          code === 'CREATE' ||
          rawType === 'teacher created' ||
          rawType === 'teacher added'
        ) {
          return 'Teacher Assignment';
        }

        // DELETE → Teacher Removed
        if (
          code === 'DELETE' ||
          rawType === 'teacher removed' ||
          rawType === 'teacher deleted'
        ) {
          return 'Teacher Removed';
        }

        // UPDATE → Teacher Update
        if (
          code === 'UPDATE' ||
          rawType === 'teacher updated' ||
          rawType === 'teacher update'
        ) {
          return 'Teacher Update';
        }
      }

      // 📘 Materias / Courses
      if (entity === 'COURSE') {
        if (code === 'CREATE') return 'Subject Added';
        if (code === 'DELETE') return 'Subject Removed';
        if (code === 'UPDATE') return 'Subject Update';
      }

      // 📚 Calificaciones
      if (entity === 'ACADEMIC_RECORD') {
        return 'Grade Update';
      }

      // 👨‍🎓 Estudiantes
      if (entity === 'STUDENT') {
        if (code === 'CREATE') return 'Student Added';
        if (code === 'DELETE') return 'Student Removed';
        if (code === 'UPDATE') return 'Student Update';
      }

      // 📊 Reportes
      if (entity === 'REPORT') {
        return 'Report Request';
      }

      // Si ya viene un type usable (Login, Logout, etc.), lo respetamos
      if (activity.type) return activity.type;

      return 'Other';
    },

    // LISTA FILTRADA COMPLETA (sin paginar)
    get filteredActivityLogAll() {
      let filtered = this.activityLog || [];

      // Filtro por usuario (select User)
      if (this.activityFilters.user) {
        filtered = filtered.filter(a => a.user === this.activityFilters.user);
      }

      // Filtro por tipo/acción (select Action Type)
      if (this.activityFilters.action) {
        filtered = filtered.filter(a => a.type === this.activityFilters.action);
      }

      // Filtro por fecha desde
      if (this.activityFilters.dateFrom) {
        filtered = filtered.filter(a => a.date >= this.activityFilters.dateFrom);
      }

      // Filtro por fecha hasta
      if (this.activityFilters.dateTo) {
        filtered = filtered.filter(a => a.date <= this.activityFilters.dateTo);
      }

      // Búsqueda por texto
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        filtered = filtered.filter(a =>
          (a.description || '').toLowerCase().includes(q) ||
          (a.user || '').toLowerCase().includes(q) ||
          (a.type || '').toLowerCase().includes(q)
        );
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
      this.searchQuery = '';
      this.currentPage = 1;
      console.log('Filters cleared');
    },

    exportActivityLog() {
      alert('Exporting activity log to Excel...');
      console.log('Activity log data:', this.filteredActivityLogAll);
    },

   // Actualizar la función loadAdministrators
async loadAdministrators() {
  try {
    const res = await fetch("http://localhost:3000/api/administrators");
    const data = await res.json();
    this.administrators = data;
    console.log('✅ Administrators loaded:', this.administrators.length);
  } catch (error) {
    console.error("❌ Error loading administrators:", error);
  }
},

// Actualizar la función addAdministrator
async addAdministrator() {
  try {
    // Validación básica
    if (!this.newAdmin.firstName || !this.newAdmin.lastName || 
        !this.newAdmin.email || !this.newAdmin.role) {
      alert("Please fill in all required fields");
      return;
    }

    // Generar username automáticamente si no existe
    const username = this.newAdmin.email.split('@')[0];
    
    // Contraseña temporal (en producción, esto debería ser más seguro)
    const tempPassword = 'SDGKU' + Math.random().toString(36).substring(7);

    const payload = {
      firstName: this.newAdmin.firstName,
      lastName: this.newAdmin.lastName,
      email: this.newAdmin.email,
      phone: this.newAdmin.phone,
      role: this.newAdmin.role,
      status: this.newAdmin.status || 'Active',
      username: username,
      password: tempPassword,
    };

    const res = await fetch("http://localhost:3000/api/administrators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Error adding administrator: " + (data.message || JSON.stringify(data)));
      return;
    }

    alert(`Administrator added successfully!\n\nUsername: ${username}\nTemporary Password: ${tempPassword}\n\nPlease save these credentials and change the password after first login.`);
    
    // Recargar la lista
    await this.loadAdministrators();
    this.resetAdminForm();

  } catch (error) {
    console.error("❌ Error adding administrator:", error);
    alert("Error adding administrator. Please try again.");
  }
},
resetAdminForm(){
this.newAdmin = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      status: 'Active'
    };
},

// Actualizar la función deleteAdmin
async deleteAdmin(id) {
  if (!confirm("Are you sure you want to delete this administrator?")) return;

  try {
    const res = await fetch(`http://localhost:3000/api/administrators/${id}`, { 
      method: "DELETE" 
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Error deleting administrator: " + (data.message || JSON.stringify(data)));
      return;
    }

    alert("Administrator deleted successfully!");
    await this.loadAdministrators();

  } catch (error) {
    console.error("❌ Error deleting administrator:", error);
    alert("Error deleting administrator. Please try again.");
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

    // ⭐ DATOS PARA TEACHERS
    newTeacher: {
      teacherIdNumber: '',
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      specialization: '',
      hireDate: new Date().toISOString()
    },

    teachers: [],

    // ⭐ Cargar maestros
    async loadTeachers() {
      try {
        const res = await fetch("http://localhost:3000/teachers");
        const data = await res.json();
        this.teachers = data;
      } catch (error) {
        console.error("❌ Error loading teachers:", error);
      }
    },

    // ⭐ Añadir maestro
    async addTeacher() {
      try {
        this.newTeacher.hireDate = new Date().toISOString();
        const res = await fetch("http://localhost:3000/teachers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.newTeacher)
        });

        const data = await res.json();

        if (!res.ok) {
          alert("Error adding teacher: " + data.message);
          return;
        }

        alert("Teacher added successfully!");
        this.loadTeachers();
        this.resetTeacherForm();

      } catch (error) {
        console.error("❌ Error adding teacher:", error);
      }
    },

    resetTeacherForm() {
      this.newTeacher = {
        teacherIdNumber: "",
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        phone: "",
        department: "",
        specialization: "",
        hireDate: new Date().toISOString()
      };
    },

    // ⭐ Eliminar maestro
    async deleteTeacher(id) {
      if (!confirm("Are you sure you want to delete this teacher?")) return;

      try {
        const res = await fetch(`http://localhost:3000/teachers/${id}`, { 
          method: "DELETE" 
        });

        const data = await res.json();

        if (!res.ok) {
          alert("Error deleting teacher: " + data.message);
          return;
        }

        alert("Teacher deleted!");
        this.loadTeachers();

      } catch (error) {
        console.error("❌ Error deleting teacher:", error);
      }
    },

    // ⭐ DATOS PARA PROGRAMS
    newProgram: {
      programName: '',
      programType: '',
      totalUnits: 0,
      totalCourses: 0,
      description:''
    },
    programs: [],

    // ⭐ Cargar programas desde la API
    async loadPrograms() {
      try {
        const res = await fetch("http://localhost:3000/api/programs");
        const data = await res.json();
        this.programs = data.map(p => ({
          id: p.id,
          name: p.programName,
          type: p.programType,
          totalUnits: p.totalUnits,
          totalCourses: p.totalCourses
        }));
      } catch (error) {
        console.error("❌ Error loading programs:", error);
      }
    },

    // ⭐ Añadir programa
    async addProgram() {
      try {
        const payload = {
          programName: this.newProgram.name,
          programType: this.newProgram.type,
          totalUnits: Number(this.newProgram.totalUnits),
          totalCourses: Number(this.newProgram.totalCourses || 0),
          description: this.newProgram.description
        };

        const res = await fetch("http://localhost:3000/api/programs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
          alert("Error adding program: " + (data.message || JSON.stringify(data)));
          return;
        }

        alert("Program added successfully!");
        this.loadPrograms(); 
        this.resetProgramForm();

      } catch (error) {
        console.error("❌ Error adding program:", error);
      }
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

    // ⭐ Eliminar programa
    async deleteProgram(id) {
      if (!confirm("Are you sure you want to delete this program?")) return;

      try {
        const res = await fetch(`http://localhost:3000/api/programs/${id}`, { 
          method: "DELETE" 
        });

        const data = await res.json();

        if (!res.ok) {
          alert("Error deleting program: " + (data.message || JSON.stringify(data)));
          return;
        }

        alert("Program deleted!");
        this.loadPrograms();

      } catch (error) {
        console.error("❌ Error deleting program:", error);
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

    subjects: [],

    // ⭐ Cargar materias desde la API
    async loadSubjects() {
      try {
        const res = await fetch("http://localhost:3000/api/courses");
        const data = await res.json();

        this.subjects = data.map(s => ({
          id: s.id,
          name: s.name,
          code: s.code,
          units: s.units || s.credits,
          department: s.department || "General",
          description: s.description || ""
        }));

      } catch (error) {
        console.error("❌ Error loading subjects:", error);
      }
    },

    // ⭐ Añadir materia
    async addSubject() {
      try {
        const payload = {
          courseCode: this.newSubject.code,
          courseName: this.newSubject.name,
          credits: Number(this.newSubject.units) || 3,
          language: "English",
          isTransferable: true,
          maxCapacity: 30
        };

        const res = await fetch("http://localhost:3000/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
          alert("Error adding subject: " + (data.message || JSON.stringify(data)));
          return;
        }

        alert("Subject added successfully!");

        this.loadSubjects();
        this.resetSubjectForm();

      } catch (error) {
        console.error("❌ Error adding subject:", error);
      }
    },

    // ⭐ Reset form materias
    resetSubjectForm() {
      this.newSubject = {
        name: '',
        code: '',
        units: '',
        department: '',
        description: ''
      };
    },

    // ⭐ Eliminar materia
    async deleteSubject(id) {
      if (!confirm("Are you sure you want to delete this subject?")) return;

      try {
        const res = await fetch(`http://localhost:3000/api/courses/${id}`, {
          method: "DELETE"
        });

        const data = await res.json();

        if (!res.ok) {
          alert("Error deleting subject: " + (data.message || JSON.stringify(data)));
          return;
        }

        alert("Subject deleted!");

        this.loadSubjects();

      } catch (error) {
        console.error("❌ Error deleting subject:", error);
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
        if (file.size > 10 * 1024 * 1024) {
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
        // ⭐ Import GRADES desde Excel
        if (this.importType === 'grades') {
          const data = await this.readExcelFile(this.selectedFile);
          const results = [];

          for (const row of data) {
            const studentId = row['Students ID Number'];
            const courseCode = row['Course'];
            const grade = row['Grade'];

            let rawStatus = (row['Status'] || '').toString().trim().toLowerCase();
            let status = 'Completed';

            if (rawStatus === 'f' || rawStatus === 'failed') {
              status = 'Failed';
            } else if (
              rawStatus === 't' || rawStatus === 'p' || 
              rawStatus === 'transferred' || rawStatus === 'transfer'
            ) {
              status = 'Transferred';
            } else if (rawStatus === 'completed' || rawStatus === 'c') {
              status = 'Completed';
            }

            if (!studentId || !courseCode || !grade) {
              console.warn('Fila incompleta, se omite:', row);
              continue;
            }

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

            results.push(result);
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

        // ⭐ IMPORTACIÓN DE STUDENTS (desde Excel en el frontend)
    if (this.importType === 'students') {
      const data = await this.readExcelFile(this.selectedFile);
      const results = [];
      const errors = [];

      for (const row of data) {
        try {
          // Mapear campos del Excel a la estructura del backend
          const studentData = {
            studentIdNumber: row['Students ID Number']?.toString().trim(),
            firstName: row['First Name']?.toString().trim(),
            middleName: row['Middle Name']?.toString().trim() || null,
            lastName: row['Last Name']?.toString().trim(),
            email: row['Email']?.toString().trim() || null,
            sdgkuEmail: row['SDGKU EMAIL']?.toString().trim() || null,
            phone: row['Phone #']?.toString().trim() || null,
            rgmKey: row['RGM#']?.toString().trim() || null,
            programName: row['Program']?.toString().trim() || 'BSGM',
            modality: row['Modality']?.toString().trim() || 'Online',
            cohort: row['Cohort']?.toString().trim() || null,
            language: row['Language']?.toString().trim() || 'English',
            status: row['Status']?.toString().trim().toLowerCase() || 'active',
            startDate: this.parseExcelDate(row['Start Date']),
            scheduledCompletionDate: this.parseExcelDate(row['Scheduled Completion Date']) || null,
            graduationDate: this.parseExcelDate(row['Graduation Date']) || null,
            totalUnits: parseInt(row['Total Units']) || 126,
            transferredUnits: parseInt(row['Transfered Units']) || 0,
            unitQuantity: parseInt(row['Unit Quantity']) || 0,
            totalUnitsEarned: parseInt(row['Total Units Earned']) || 0,
          };

          // Validar campos requeridos
          if (!studentData.studentIdNumber || !studentData.firstName || !studentData.lastName) {
            errors.push(`Fila con datos incompletos: ${row['Students ID Number'] || 'Sin ID'}`);
            continue;
          }

          // Enviar al backend
          const res = await fetch('http://localhost:3000/api/students/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
          });

          if (res.ok) {
            const result = await res.json();
            results.push(result);
          } else {
            const errorData = await res.json();
            errors.push(`Error en estudiante ${studentData.studentIdNumber}: ${errorData.message}`);
          }

        } catch (error) {
          errors.push(`Error procesando fila: ${error.message}`);
        }
      }

      this.importResult = {
        success: true,
        message: `estudiantes importados exitosamente`,
        recordsProcessed: results.length,
        errors: errors.length > 0 ? errors : undefined
      };

      this.importHistory.unshift({
        id: Date.now(),
        date: new Date().toLocaleString(),
        fileName: this.selectedFile.name,
        type: this.importType,
        records: results.length,
        status: errors.length > 0 ? 'Partial Success' : 'Success'
      });

      this.selectedFile = null;
      this.importType = '';
      return;
    }

    // ⭐ IMPORTACIÓN DE TEACHERS
    if (this.importType === 'teachers') {
      const data = await this.readExcelFile(this.selectedFile);
      const results = [];
      const errors = [];

      for (const row of data) {
        try {
          const teacherData = {
            teacherIdNumber: row['Teacher ID']?.toString().trim(),
            firstName: row['First Name']?.toString().trim(),
            middleName: row['Middle Name']?.toString().trim() || null,
            lastName: row['Last Name']?.toString().trim(),
            email: row['Email']?.toString().trim() || null,
            phone: row['Phone']?.toString().trim() || null,
            department: row['Department']?.toString().trim() || null,
            specialization: row['Specialization']?.toString().trim() || null,
          };

          if (!teacherData.firstName || !teacherData.lastName) {
            errors.push(`Teacher con datos incompletos: ${row['Teacher ID'] || 'Sin ID'}`);
            continue;
          }

          const res = await fetch('http://localhost:3000/teachers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teacherData)
          });

          if (res.ok) {
            const result = await res.json();
            results.push(result);
          } else {
            const errorData = await res.json();
            errors.push(`Error en teacher: ${errorData.message}`);
          }

        } catch (error) {
          errors.push(`Error procesando fila: ${error.message}`);
        }
      }

      this.importResult = {
        success: true,
        message: `${results.length} teachers importados exitosamente`,
        recordsProcessed: results.length,
        errors: errors.length > 0 ? errors : undefined
      };

      this.importHistory.unshift({
        id: Date.now(),
        date: new Date().toLocaleString(),
        fileName: this.selectedFile.name,
        type: this.importType,
        records: results.length,
        status: errors.length > 0 ? 'Partial Success' : 'Success'
      });

      this.selectedFile = null;
      this.importType = '';
      return;
    }

    // Importaciones normales (otros tipos)
    const url = `http://localhost:3000/api/import/${this.importType}`;
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
      details: error.message || 'Unknown error'
    };
  }
},

// 🔧 Método auxiliar para leer Excel en el frontend
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

// 🔧 Método auxiliar para parsear fechas de Excel
parseExcelDate(value) {
  if (!value) return null;
  
  if (typeof value === 'number') {
    // Fecha serial de Excel
    return new Date((value - 25569) * 86400 * 1000).toISOString().split('T')[0];
  } else if (typeof value === 'string' && value.trim() !== '') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
  }
  return null;
},

   // Agregar esta función al objeto settingsData() en settings.js

downloadTemplate() {
  if (!this.importType) {
    alert('Please select a data type first');
    return;
  }

  let templateData = [];
  let fileName = '';

  // 📚 PLANTILLA PARA STUDENTS
  if (this.importType === 'students') {
    fileName = 'Students_Import_Template.xlsx';
    
    templateData = [
      {
        'Students ID Number': '123456789',
        'First Name': 'John',
        'Middle Name': 'Michael',
        'Last Name': 'Doe',
        'Email': 'john.doe@email.com',
        'SDGKU EMAIL': 'john.doe@sdgku.edu',
        'Phone #': '(619) 555-0100',
        'RGM#': 'RGM001',
        'Program': 'BSGM',
        'Modality': 'Online',
        'Cohort': 'Fall 2024',
        'Language': 'English',
        'Status': 'active',
        'Start Date': '2024-01-15',
        'Scheduled Completion Date': '2028-05-30',
        'Graduation Date': '',
        'Total Units': 126,
        'Transfered Units': 0,
        'Unit Quantity': 3,
        'Total Units Earned': 9
      },
      {
        'Students ID Number': '987654321',
        'First Name': 'Jane',
        'Middle Name': 'Marie',
        'Last Name': 'Smith',
        'Email': 'jane.smith@email.com',
        'SDGKU EMAIL': 'jane.smith@sdgku.edu',
        'Phone #': '(619) 555-0200',
        'RGM#': 'RGM002',
        'Program': 'ASSD',
        'Modality': 'Hybrid',
        'Cohort': 'Spring 2024',
        'Language': 'Spanish',
        'Status': 'active',
        'Start Date': '2024-03-01',
        'Scheduled Completion Date': '2026-12-15',
        'Graduation Date': '',
        'Total Units': 60,
        'Transfered Units': 6,
        'Unit Quantity': 3,
        'Total Units Earned': 15
      }
    ];
  }

  // 📝 PLANTILLA PARA GRADES
  else if (this.importType === 'grades') {
    fileName = 'Grades_Import_Template.xlsx';
    
    templateData = [
      {
        'Students ID Number': '123456789',
        'Course': 'MATH 201',
        'Grade': 'A',
        'Status': 'Completed'
      },
      {
        'Students ID Number': '123456789',
        'Course': 'ENGL 201',
        'Grade': 'B+',
        'Status': 'Completed'
      },
      {
        'Students ID Number': '123456789',
        'Course': 'GBUS 301',
        'Grade': 'IP',
        'Status': 'In Progress'
      },
      {
        'Students ID Number': '987654321',
        'Course': 'FSDI 101',
        'Grade': 'A-',
        'Status': 'Completed'
      },
      {
        'Students ID Number': '987654321',
        'Course': 'FSDI 102',
        'Grade': 'T',
        'Status': 'Transferred'
      }
    ];
  }

  // 👨‍🏫 PLANTILLA PARA TEACHERS
  else if (this.importType === 'teachers') {
    fileName = 'Teachers_Import_Template.xlsx';
    
    templateData = [
      {
        'Teacher ID': 'TCH-001',
        'First Name': 'Robert',
        'Middle Name': 'James',
        'Last Name': 'Johnson',
        'Email': 'robert.johnson@sdgku.edu',
        'Phone': '(619) 555-0300',
        'Department': 'Business',
        'Specialization': 'Global Management'
      },
      {
        'Teacher ID': 'TCH-002',
        'First Name': 'Maria',
        'Middle Name': 'Elena',
        'Last Name': 'Garcia',
        'Email': 'maria.garcia@sdgku.edu',
        'Phone': '(619) 555-0400',
        'Department': 'Technology',
        'Specialization': 'Software Development'
      }
    ];
  }

  // 📖 PLANTILLA PARA SUBJECTS
  else if (this.importType === 'subjects') {
    fileName = 'Subjects_Import_Template.xlsx';
    
    templateData = [
      {
        'Course Code': 'MATH 201',
        'Course Name': 'College Algebra',
        'Credits': 3,
        'Program': 'BSGM',
        'Language': 'English',
        'Max Capacity': 30,
        'Transferable': 'true'
      },
      {
        'Course Code': 'FSDI 101',
        'Course Name': 'Intro to Web Development',
        'Credits': 3,
        'Program': 'ASSD',
        'Language': 'English',
        'Max Capacity': 25,
        'Transferable': 'false'
      }
    ];
  }

  // 📅 PLANTILLA PARA SESSIONS
  else if (this.importType === 'sessions') {
    fileName = 'Sessions_Import_Template.xlsx';
    
    templateData = [
      {
        'Session Name': 'Session 1',
        'Program': 'BSGM',
        'Start Date': '2025-01-15',
        'End Date': '2025-03-15',
        'Courses': 'MATH 201,ENGL 201,GBUS 301',
        'Teachers': 'TCH-001,TCH-002,TCH-003'
      },
      {
        'Session Name': 'Session 2',
        'Program': 'ASSD',
        'Start Date': '2025-02-01',
        'End Date': '2025-04-01',
        'Courses': 'FSDI 101,FSDI 102',
        'Teachers': 'TCH-004,TCH-005'
      }
    ];
  }

  // ❌ Si no hay plantilla disponible
  else {
    alert(`Template for "${this.importType}" is not available yet`);
    return;
  }

  // 📦 Crear el archivo Excel
  try {
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    // 🎨 Ajustar ancho de columnas automáticamente
    const maxWidth = 20;
    const colWidths = Object.keys(templateData[0]).map(key => ({
      wch: Math.min(Math.max(key.length, 10), maxWidth)
    }));
    ws['!cols'] = colWidths;

    // 💾 Descargar el archivo
    XLSX.writeFile(wb, fileName);
    
    console.log(`✅ Template downloaded: ${fileName}`);
    
    // Mostrar mensaje de éxito
    alert(`Template "${fileName}" downloaded successfully!`);
    
  } catch (error) {
    console.error('❌ Error generating template:', error);
    alert('Error generating template. Please try again.');
  }
},
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const phoneInputs = document.querySelectorAll('input[type="tel"]');

  phoneInputs.forEach(input => {
    input.setAttribute("maxlength", "14");
    input.setAttribute("required", true);
    input.setAttribute("pattern", "\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}");

    input.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length > 10) value = value.slice(0, 10);

      if (value.length > 6) {
        e.target.value = `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6)}`;
      } else if (value.length > 3) {
        e.target.value = `(${value.slice(0,3)}) ${value.slice(3)}`;
      } else if (value.length > 0) {
        e.target.value = `(${value}`;
      }
    });

    input.addEventListener("keypress", (e) => {
      if (!/[0-9]/.test(e.key)) e.preventDefault();
    });

    input.addEventListener("invalid", () => {
      input.setCustomValidity("Ingrese un número válido de 10 dígitos (ejemplo: (123) 456-7890)");
    });

    input.addEventListener("input", () => input.setCustomValidity(""));
  });
});

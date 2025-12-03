function settingsData() {
  return {
    init() {
      this.loadActivityLog();
      this.loadTeachers();
      this.loadPrograms();
      this.loadSubjects();
    },

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

        this.activityLog = Array.isArray(data) ? data : [];

      } catch (e) {
        console.error('❌ Error loading activity timeline:', e);
        this.activityError = 'Could not load activity timeline';
      } finally {
        this.isLoadingActivity = false;
      }
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
        // En tus datos de demo usabas "type" (Login, Grade Update, etc.)
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

      // Búsqueda por texto (si en algún lado usas searchQuery)
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
      // Aquí implementarías la exportación real con XLSX si quieres
    },

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
    // ⭐ DATOS PARA TEACHERS
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

// ======================
// ⭐ Cargar maestros
// ======================
async loadTeachers() {
  try {
    const res = await fetch("http://localhost:3000/teachers");
    const data = await res.json();
    this.teachers = data;
  } catch (error) {
    console.error("❌ Error loading teachers:", error);
  }
},

// ======================
// ⭐ Añadir maestro
// ======================
async addTeacher() {
  try {
    this.newTeacher.hireDate = new Date().toISOString(); // actualizar fecha
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

// ======================
// ⭐ Eliminar maestro
// ======================
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
    // Lista de programas
    programs: [],
    // ⭐ Cargar programas desde la API
async loadPrograms() {
  try {
    const res = await fetch("http://localhost:3000/api/programs");
    const data = await res.json();
    this.programs = data.map(p => ({
      id: p.id,
      name: p.programName,      // renombrar
      type: p.programType,      // renombrar
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
      totalCourses: Number(this.newProgram.totalCourses || 0), // si lo tienes
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
    this.loadPrograms(); // recargar lista desde DB

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
      name: s.name,             // courseName
      code: s.code,             // courseCode
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

// ⭐ Reset form
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
    // ⭐ Importación especial para GRADES (desde Excel en el frontend)
    if (this.importType === 'grades') {
      const data = await this.readExcelFile(this.selectedFile);
      const results = [];

      for (const row of data) {
        // Mapear columnas del Excel a propiedades del backend
        const studentId = row['Students ID Number'];
        const courseCode = row['Course'];
        const grade = row['Grade'];

        // 🔍 Normalizar status del Excel
        let rawStatus = (row['Status'] || '').toString().trim().toLowerCase();
        let status = 'Completed'; // default

        if (rawStatus === 'f' || rawStatus === 'failed') {
          status = 'Failed';
        } 
        else if (
          rawStatus === 't' || rawStatus === 'p' || 
          rawStatus === 'transferred' || rawStatus === 'transfer'
        ) {
          status = 'Transferred';
        } 
        else if (rawStatus === 'completed' || rawStatus === 'c') {
          status = 'Completed';
        }

        // Validación mínima
        if (!studentId || !courseCode || !grade) {
          console.warn('Fila incompleta, se omite:', row);
          continue;
        }

        // 📤 Enviar al backend
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

        // ⭐ IMPORTANTE: agregar resultado al arreglo
        results.push(result);
      }

      // 🟢 Resultado final
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

    // -------------------------------------------------------------------------------------
    // ⭐ Importaciones normales (students, teachers, etc.)
    // -------------------------------------------------------------------------------------

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

  } 
  catch (error) {
    console.error('❌ Error importing file:', error);

    this.importResult = {
      success: false,
      message: 'Error importing file',
      details: error.message || 'Unknown error'
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

document.addEventListener("DOMContentLoaded", () => {

  // Selecciona TODOS los campos de teléfono
  const phoneInputs = document.querySelectorAll('input[type="tel"]');

  phoneInputs.forEach(input => {
    input.setAttribute("maxlength", "14"); // Formato (xxx) xxx-xxxx

    // Validación de HTML
    input.setAttribute("required", true);
    input.setAttribute("pattern", "\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}");

    // Al escribir
    input.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, ""); // remover NO números

      if (value.length > 10) value = value.slice(0, 10);

      // Aplicar formato (XXX) XXX-XXXX
      if (value.length > 6) {
        e.target.value = `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6)}`;
      } else if (value.length > 3) {
        e.target.value = `(${value.slice(0,3)}) ${value.slice(3)}`;
      } else if (value.length > 0) {
        e.target.value = `(${value}`;
      }
    });

    // Evitar letras
    input.addEventListener("keypress", (e) => {
      if (!/[0-9]/.test(e.key)) e.preventDefault();
    });

    // Validación al enviar
    input.addEventListener("invalid", () => {
      input.setCustomValidity("Ingrese un número válido de 10 dígitos (ejemplo: (123) 456-7890)");
    });

    input.addEventListener("input", () => input.setCustomValidity(""));
  });

});


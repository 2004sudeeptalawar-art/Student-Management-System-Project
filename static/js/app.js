/**
 * Student Management System - Frontend Application Logic
 */

// Global State
const state = {
    currentPage: 1,
    limit: 8,
    search: '',
    department: '',
    course: '',
    gender: '',
    sortBy: 'created_at',
    order: 'desc',
    activeView: 'dashboard', // 'dashboard' or 'students'
    students: [],
    selectedStudentId: null
};

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    checkDbHealth();
    loadDashboardStats();
    loadDropdownOptions();
    loadStudents();
});

/* ==========================================================================
   Theme Management
   ========================================================================== */
function initTheme() {
    const savedTheme = localStorage.getItem('sms-theme') || 'light';
    setTheme(savedTheme);

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('sms-theme', theme);
    const themeIcon = document.getElementById('themeToggleIcon');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    }
}

/* ==========================================================================
   Navigation & View Switching
   ========================================================================== */
function switchView(viewName) {
    state.activeView = viewName;

    const navDashboard = document.getElementById('navDashboard');
    const navStudents = document.getElementById('navStudents');
    const dashboardSection = document.getElementById('dashboardSection');
    const studentsSection = document.getElementById('studentsSection');

    if (viewName === 'dashboard') {
        navDashboard?.classList.add('active');
        navStudents?.classList.remove('active');
        dashboardSection?.classList.remove('d-none');
        studentsSection?.classList.add('d-none');
        loadDashboardStats();
    } else {
        navDashboard?.classList.remove('active');
        navStudents?.classList.add('active');
        dashboardSection?.classList.add('d-none');
        studentsSection?.classList.remove('d-none');
        loadStudents();
    }

    // Close mobile sidebar if open
    const sidebar = document.getElementById('appSidebar');
    sidebar?.classList.remove('show');
}

/* ==========================================================================
   API Calls & Data Loading
   ========================================================================== */
async function checkDbHealth() {
    const statusText = document.getElementById('dbStatusText');
    const statusDot = document.getElementById('dbStatusDot');
    try {
        const res = await fetch('/api/health');
        const data = await res.json();
        if (data.success && data.status === 'healthy') {
            if (statusText) statusText.textContent = `MySQL Connected (${data.database})`;
            if (statusDot) statusDot.style.backgroundColor = 'var(--success)';
        } else {
            if (statusText) statusText.textContent = 'MySQL Disconnected';
            if (statusDot) statusDot.style.backgroundColor = 'var(--danger)';
        }
    } catch (err) {
        if (statusText) statusText.textContent = 'Connection Error';
        if (statusDot) statusDot.style.backgroundColor = 'var(--danger)';
    }
}

async function loadDashboardStats() {
    try {
        const res = await fetch('/api/stats');
        const json = await res.json();
        if (!json.success) return;

        const data = json.data;
        document.getElementById('statTotalStudents').textContent = data.total_students;
        document.getElementById('statTotalDepts').textContent = data.total_departments;
        document.getElementById('statTotalCourses').textContent = data.courses.length;
        document.getElementById('statRecentCount').textContent = data.recent_students.length;

        // Render Recent Students Table
        renderRecentStudents(data.recent_students);
        // Render Department breakdown bars
        renderDepartmentBreakdown(data.departments, data.total_students);
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
    }
}

function renderRecentStudents(recentList) {
    const tbody = document.getElementById('recentStudentsTableBody');
    if (!tbody) return;

    if (!recentList || recentList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No students added yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = recentList.map(s => `
        <tr>
            <td>
                <div class="d-flex align-items-center gap-3">
                    <div class="student-avatar">${getInitials(s.full_name)}</div>
                    <div>
                        <span class="student-meta-title">${escapeHtml(s.full_name)}</span>
                        <span class="student-meta-subtitle">${escapeHtml(s.email)}</span>
                    </div>
                </div>
            </td>
            <td><span class="id-badge">${escapeHtml(s.student_id)}</span></td>
            <td><span class="dept-badge">${escapeHtml(s.department)}</span></td>
            <td>${escapeHtml(s.course)}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-custom" onclick="viewStudentDetails(${s.id})" title="View Details">
                    <i class="bi bi-eye"></i> View
                </button>
            </td>
        </tr>
    `).join('');
}

function renderDepartmentBreakdown(depts, total) {
    const container = document.getElementById('deptBreakdownContainer');
    if (!container) return;

    if (!depts || depts.length === 0) {
        container.innerHTML = `<div class="text-muted text-center py-4">No department data available.</div>`;
        return;
    }

    container.innerHTML = depts.map(d => {
        const percent = total > 0 ? Math.round((d.count / total) * 100) : 0;
        return `
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-semibold small">${escapeHtml(d.department)}</span>
                    <span class="badge bg-light text-dark border">${d.count} students (${percent}%)</span>
                </div>
                <div class="progress" style="height: 8px; border-radius: 999px;">
                    <div class="progress-bar bg-primary" role="progressbar" style="width: ${percent}%;"></div>
                </div>
            </div>
        `;
    }).join('');
}

async function loadDropdownOptions() {
    try {
        const res = await fetch('/api/departments');
        const data = await res.json();
        if (!data.success) return;

        const filterDept = document.getElementById('filterDepartment');
        const filterCourse = document.getElementById('filterCourse');
        const addDept = document.getElementById('studentDepartment');
        const addCourse = document.getElementById('studentCourse');

        // Populate filter departments
        if (filterDept) {
            filterDept.innerHTML = `<option value="">All Departments</option>` +
                data.departments.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
        }

        // Populate filter courses
        if (filterCourse) {
            filterCourse.innerHTML = `<option value="">All Courses</option>` +
                data.courses.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
        }

        // Populate Add form datalists or options
        const deptDatalist = document.getElementById('departmentDatalist');
        if (deptDatalist) {
            deptDatalist.innerHTML = data.departments.map(d => `<option value="${escapeHtml(d)}">`).join('');
        }

        const courseDatalist = document.getElementById('courseDatalist');
        if (courseDatalist) {
            courseDatalist.innerHTML = data.courses.map(c => `<option value="${escapeHtml(c)}">`).join('');
        }
    } catch (err) {
        console.error('Error loading dropdown options:', err);
    }
}

async function loadStudents() {
    const tableBody = document.getElementById('studentsTableBody');
    const emptyState = document.getElementById('studentsEmptyState');
    const tableContainer = document.getElementById('studentsTableContainer');

    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><div class="mt-2 text-muted small">Loading students...</div></td></tr>`;

    try {
        const params = new URLSearchParams({
            page: state.currentPage,
            limit: state.limit,
            search: state.search,
            department: state.department,
            course: state.course,
            gender: state.gender,
            sort_by: state.sortBy,
            order: state.order
        });

        const res = await fetch(`/api/students?${params.toString()}`);
        const result = await res.json();

        if (!result.success) {
            showToast('Error', result.message || 'Failed to load students', 'error');
            return;
        }

        state.students = result.data;
        renderStudentsTable(result.data);
        renderPagination(result.pagination);

        if (result.data.length === 0) {
            tableContainer?.classList.add('d-none');
            emptyState?.classList.remove('d-none');
        } else {
            tableContainer?.classList.remove('d-none');
            emptyState?.classList.add('d-none');
        }
    } catch (err) {
        console.error('Error fetching students:', err);
        showToast('Network Error', 'Could not connect to the API server.', 'error');
    }
}

function renderStudentsTable(students) {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    if (!students || students.length === 0) {
        tbody.innerHTML = '';
        return;
    }

    tbody.innerHTML = students.map(s => `
        <tr>
            <td>
                <div class="d-flex align-items-center gap-3">
                    <div class="student-avatar">${getInitials(s.full_name)}</div>
                    <div>
                        <span class="student-meta-title">${escapeHtml(s.full_name)}</span>
                        <span class="student-meta-subtitle"><i class="bi bi-calendar3 me-1"></i>Enrolled: ${formatDate(s.enrollment_date)}</span>
                    </div>
                </div>
            </td>
            <td><span class="id-badge">${escapeHtml(s.student_id)}</span></td>
            <td>
                <div><i class="bi bi-envelope me-1 text-muted"></i>${escapeHtml(s.email)}</div>
                <div class="small text-muted"><i class="bi bi-telephone me-1 text-muted"></i>${escapeHtml(s.phone)}</div>
            </td>
            <td>
                <div class="fw-semibold">${escapeHtml(s.course)}</div>
                <span class="dept-badge mt-1">${escapeHtml(s.department)}</span>
            </td>
            <td>
                <span class="badge ${s.gender === 'Female' ? 'bg-danger-subtle text-danger' : s.gender === 'Male' ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary'} border">
                    ${escapeHtml(s.gender)}
                </span>
            </td>
            <td>${formatDate(s.enrollment_date)}</td>
            <td class="text-end">
                <div class="action-btn-group justify-content-end">
                    <button class="btn-action btn-action-view" title="View Profile" onclick="viewStudentDetails(${s.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn-action btn-action-edit" title="Edit Student" onclick="openEditStudentModal(${s.id})">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn-action btn-action-delete" title="Delete Student" onclick="confirmDeleteStudent(${s.id}, '${escapeHtml(s.full_name)}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderPagination(p) {
    const container = document.getElementById('paginationControls');
    const summary = document.getElementById('paginationSummary');
    if (!container) return;

    if (p.total === 0) {
        container.innerHTML = '';
        if (summary) summary.textContent = 'Showing 0 records';
        return;
    }

    const start = (p.page - 1) * p.limit + 1;
    const end = Math.min(p.page * p.limit, p.total);
    if (summary) summary.textContent = `Showing ${start} to ${end} of ${p.total} records`;

    let html = '';

    // Previous button
    html += `
        <li class="page-item ${!p.has_prev ? 'disabled' : ''}">
            <button class="page-link" onclick="goToPage(${p.page - 1})" aria-label="Previous">
                <i class="bi bi-chevron-left"></i>
            </button>
        </li>
    `;

    // Page Numbers
    for (let i = 1; i <= p.total_pages; i++) {
        if (i === 1 || i === p.total_pages || (i >= p.page - 1 && i <= p.page + 1)) {
            html += `
                <li class="page-item ${i === p.page ? 'active' : ''}">
                    <button class="page-link" onclick="goToPage(${i})">${i}</button>
                </li>
            `;
        } else if (i === p.page - 2 || i === p.page + 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // Next button
    html += `
        <li class="page-item ${!p.has_next ? 'disabled' : ''}">
            <button class="page-link" onclick="goToPage(${p.page + 1})" aria-label="Next">
                <i class="bi bi-chevron-right"></i>
            </button>
        </li>
    `;

    container.innerHTML = html;
}

function goToPage(page) {
    state.currentPage = page;
    loadStudents();
}

/* ==========================================================================
   Search & Filter Event Listeners
   ========================================================================== */
function setupEventListeners() {
    // Navigation clicks
    document.getElementById('navDashboard')?.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('dashboard');
    });

    document.getElementById('navStudents')?.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('students');
    });

    // Mobile Sidebar toggle
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebar = document.getElementById('appSidebar');
    toggleBtn?.addEventListener('click', () => {
        sidebar?.classList.toggle('show');
    });

    // Live search input with debounce
    const searchInput = document.getElementById('searchInput');
    let debounceTimer;
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            state.search = e.target.value.trim();
            state.currentPage = 1;
            loadStudents();
        }, 300);
    });

    // Filter dropdowns
    document.getElementById('filterDepartment')?.addEventListener('change', (e) => {
        state.department = e.target.value;
        state.currentPage = 1;
        loadStudents();
    });

    document.getElementById('filterCourse')?.addEventListener('change', (e) => {
        state.course = e.target.value;
        state.currentPage = 1;
        loadStudents();
    });

    document.getElementById('filterGender')?.addEventListener('change', (e) => {
        state.gender = e.target.value;
        state.currentPage = 1;
        loadStudents();
    });

    document.getElementById('pageSizeSelect')?.addEventListener('change', (e) => {
        state.limit = parseInt(e.target.value, 10);
        state.currentPage = 1;
        loadStudents();
    });

    // Reset Filters button
    document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        document.getElementById('filterDepartment').value = '';
        document.getElementById('filterCourse').value = '';
        document.getElementById('filterGender').value = '';
        state.search = '';
        state.department = '';
        state.course = '';
        state.gender = '';
        state.currentPage = 1;
        loadStudents();
    });

    // Add Student Form submit
    document.getElementById('studentForm')?.addEventListener('submit', handleSaveStudent);

    // Auto-generate ID button in modal
    document.getElementById('btnAutoGenerateId')?.addEventListener('click', () => {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const autoId = `STU-2026-${randomNum}`;
        document.getElementById('formStudentId').value = autoId;
    });

    // Set today as default enrollment date for new student
    const enrollInput = document.getElementById('formEnrollmentDate');
    if (enrollInput && !enrollInput.value) {
        enrollInput.value = new Date().toISOString().split('T')[0];
    }
}

/* ==========================================================================
   CRUD Actions: Add, Edit, View, Delete
   ========================================================================== */

// Open modal for Adding a new student
function openAddStudentModal() {
    state.selectedStudentId = null;
    const form = document.getElementById('studentForm');
    form.reset();
    document.getElementById('studentModalTitle').textContent = 'Add New Student';
    document.getElementById('studentFormSubmitBtn').innerHTML = '<i class="bi bi-person-plus-fill me-1"></i> Save Student';
    
    // Default enrollment date to today
    document.getElementById('formEnrollmentDate').value = new Date().toISOString().split('T')[0];
    
    // Auto-suggest an ID
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    document.getElementById('formStudentId').value = `STU-2026-${randomNum}`;

    const modal = new bootstrap.Modal(document.getElementById('studentFormModal'));
    modal.show();
}

// Open modal for Editing an existing student
async function openEditStudentModal(id) {
    try {
        const res = await fetch(`/api/students/${id}`);
        const json = await res.json();
        if (!json.success || !json.data) {
            showToast('Error', 'Student record not found.', 'error');
            return;
        }

        const student = json.data;
        state.selectedStudentId = student.id;

        document.getElementById('studentModalTitle').textContent = 'Edit Student Details';
        document.getElementById('studentFormSubmitBtn').innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> Update Changes';

        // Pre-fill form fields
        document.getElementById('formStudentId').value = student.student_id;
        document.getElementById('formFullName').value = student.full_name;
        document.getElementById('formEmail').value = student.email;
        document.getElementById('formPhone').value = student.phone;
        document.getElementById('formDob').value = student.date_of_birth;
        document.getElementById('formGender').value = student.gender;
        document.getElementById('formCourse').value = student.course;
        document.getElementById('formDepartment').value = student.department;
        document.getElementById('formAddress').value = student.address;
        document.getElementById('formEnrollmentDate').value = student.enrollment_date;

        const modal = new bootstrap.Modal(document.getElementById('studentFormModal'));
        modal.show();
    } catch (err) {
        showToast('Error', 'Failed to retrieve student information.', 'error');
    }
}

// Handle Form Submission (Save or Update)
async function handleSaveStudent(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('studentFormSubmitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;

    const payload = {
        student_id: document.getElementById('formStudentId').value.trim(),
        full_name: document.getElementById('formFullName').value.trim(),
        email: document.getElementById('formEmail').value.trim(),
        phone: document.getElementById('formPhone').value.trim(),
        date_of_birth: document.getElementById('formDob').value.trim(),
        gender: document.getElementById('formGender').value.trim(),
        course: document.getElementById('formCourse').value.trim(),
        department: document.getElementById('formDepartment').value.trim(),
        address: document.getElementById('formAddress').value.trim(),
        enrollment_date: document.getElementById('formEnrollmentDate').value.trim()
    };

    const isUpdate = Boolean(state.selectedStudentId);
    const url = isUpdate ? `/api/students/${state.selectedStudentId}` : '/api/students';
    const method = isUpdate ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success) {
            showToast('Success', data.message || (isUpdate ? 'Student updated!' : 'Student added!'), 'success');

            // Hide modal
            const modalEl = document.getElementById('studentFormModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal?.hide();

            // Refresh view & dropdowns
            loadStudents();
            loadDashboardStats();
            loadDropdownOptions();
        } else {
            const errorMsg = data.errors ? data.errors.join('<br>') : (data.message || 'Validation error');
            showToast('Validation Error', errorMsg, 'error');
        }
    } catch (err) {
        console.error('Error saving student:', err);
        showToast('Server Error', 'Failed to save record to MySQL database.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// View Student Profile in Details Modal
async function viewStudentDetails(id) {
    try {
        const res = await fetch(`/api/students/${id}`);
        const json = await res.json();
        if (!json.success || !json.data) {
            showToast('Error', 'Unable to retrieve student profile.', 'error');
            return;
        }

        const s = json.data;
        state.selectedStudentId = s.id;

        document.getElementById('viewAvatar').textContent = getInitials(s.full_name);
        document.getElementById('viewFullName').textContent = s.full_name;
        document.getElementById('viewStudentId').textContent = s.student_id;
        document.getElementById('viewEmail').textContent = s.email;
        document.getElementById('viewPhone').textContent = s.phone;
        document.getElementById('viewDob').textContent = formatDate(s.date_of_birth);
        document.getElementById('viewGender').textContent = s.gender;
        document.getElementById('viewCourse').textContent = s.course;
        document.getElementById('viewDepartment').textContent = s.department;
        document.getElementById('viewAddress').textContent = s.address;
        document.getElementById('viewEnrollmentDate').textContent = formatDate(s.enrollment_date);
        document.getElementById('viewCreatedAt').textContent = formatDateTime(s.created_at);

        // Wire modal action buttons
        const editBtn = document.getElementById('viewModalEditBtn');
        if (editBtn) {
            editBtn.onclick = () => {
                const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewStudentModal'));
                viewModal?.hide();
                openEditStudentModal(s.id);
            };
        }

        const deleteBtn = document.getElementById('viewModalDeleteBtn');
        if (deleteBtn) {
            deleteBtn.onclick = () => {
                const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewStudentModal'));
                viewModal?.hide();
                confirmDeleteStudent(s.id, s.full_name);
            };
        }

        const modal = new bootstrap.Modal(document.getElementById('viewStudentModal'));
        modal.show();
    } catch (err) {
        showToast('Error', 'Failed to fetch student details.', 'error');
    }
}

// Confirm Delete Dialog
function confirmDeleteStudent(id, studentName) {
    state.selectedStudentId = id;
    document.getElementById('deleteStudentName').textContent = studentName;

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    confirmBtn.onclick = executeDeleteStudent;

    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
}

// Execute Delete API Call
async function executeDeleteStudent() {
    if (!state.selectedStudentId) return;

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Deleting...`;

    try {
        const res = await fetch(`/api/students/${state.selectedStudentId}`, {
            method: 'DELETE'
        });
        const data = await res.json();

        if (res.ok && data.success) {
            showToast('Deleted', data.message || 'Student deleted successfully.', 'success');
            const modalEl = document.getElementById('deleteConfirmModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal?.hide();

            loadStudents();
            loadDashboardStats();
            loadDropdownOptions();
        } else {
            showToast('Error', data.message || 'Failed to delete student.', 'error');
        }
    } catch (err) {
        showToast('Server Error', 'Failed to delete student from database.', 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = 'Delete Student';
    }
}

/* ==========================================================================
   Export to CSV Feature
   ========================================================================== */
async function exportStudentsToCsv() {
    try {
        showToast('Exporting', 'Preparing student dataset for download...', 'info');
        const res = await fetch('/api/students?limit=0');
        const json = await res.json();
        if (!json.success || !json.data) {
            showToast('Export Failed', 'No student records found to export.', 'error');
            return;
        }

        const rows = json.data;
        const headers = ['Student ID', 'Full Name', 'Email', 'Phone', 'Date of Birth', 'Gender', 'Course', 'Department', 'Address', 'Enrollment Date'];
        const csvContent = [
            headers.join(','),
            ...rows.map(r => [
                `"${r.student_id}"`,
                `"${r.full_name}"`,
                `"${r.email}"`,
                `"${r.phone}"`,
                `"${r.date_of_birth}"`,
                `"${r.gender}"`,
                `"${r.course}"`,
                `"${r.department}"`,
                `"${(r.address || '').replace(/"/g, '""')}"`,
                `"${r.enrollment_date}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Students_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Success', 'Student records exported successfully as CSV.', 'success');
    } catch (err) {
        showToast('Error', 'Failed to generate CSV export.', 'error');
    }
}

/* ==========================================================================
   Toast Notification System
   ========================================================================== */
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const iconMap = {
        success: 'bi-check-circle-fill',
        error: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    };

    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    toast.innerHTML = `
        <i class="bi ${iconMap[type] || 'bi-info-circle-fill'} toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-msg">${message}</div>
        </div>
        <button type="button" class="btn-close ms-2 small" onclick="this.parentElement.remove()"></button>
    `;

    container.appendChild(toast);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/* ==========================================================================
   Helper Utilities
   ========================================================================== */
function getInitials(name) {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return 'N/A';
    try {
        const d = new Date(dateTimeStr);
        return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
        return dateTimeStr;
    }
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

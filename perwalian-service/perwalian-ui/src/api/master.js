import api from './client';

// ===== AUTH =====
export const login = (username, password) =>
  api.post('/login', { username, password }).then(r => r.data);

// ===== ACADEMIC UNITS =====
export const getAllUnits = () => api.get('/master/units').then(r => r.data);
export const getUnitById = (id) => api.get(`/master/units/${id}`).then(r => r.data);
export const createUnit = (data) => api.post('/master/units', data).then(r => r.data);
export const updateUnit = (id, data) => api.put(`/master/units/${id}`, data).then(r => r.data);
export const deleteUnit = (id) => api.delete(`/master/units/${id}`).then(r => r.data);

// ===== LECTURERS =====
export const getAllLecturers = () => api.get('/master/lecturers').then(r => r.data);
export const getLecturerById = (id) => api.get(`/master/lecturers/${id}`).then(r => r.data);
export const getLecturersByUnit = (unitId) => api.get(`/master/units/${unitId}/lecturers`).then(r => r.data);
export const createLecturer = (data) => api.post('/master/lecturers', data).then(r => r.data);
export const updateLecturer = (id, data) => api.put(`/master/lecturers/${id}`, data).then(r => r.data);
export const deleteLecturer = (id) => api.delete(`/master/lecturers/${id}`).then(r => r.data);

// ===== STUDENTS =====
export const getAllStudents = () => api.get('/master/students').then(r => r.data);
export const getStudentById = (id) => api.get(`/master/students/${id}`).then(r => r.data);
export const getStudentsByUnit = (unitId) => api.get(`/master/units/${unitId}/students`).then(r => r.data);
export const createStudent = (data) => api.post('/master/students', data).then(r => r.data);
export const updateStudent = (id, data) => api.put(`/master/students/${id}`, data).then(r => r.data);
export const deleteStudent = (id) => api.delete(`/master/students/${id}`).then(r => r.data);

// ===== ROLES =====
export const getAllRoles = () => api.get('/master/roles').then(r => r.data);
export const createRole = (data) => api.post('/master/roles', data).then(r => r.data);
export const updateRole = (id, data) => api.put(`/master/roles/${id}`, data).then(r => r.data);
export const deleteRole = (id) => api.delete(`/master/roles/${id}`).then(r => r.data);
export const assignRoleToLecturer = (lecturerId, data) => api.post(`/master/lecturers/${lecturerId}/roles`, data).then(r => r.data);
export const getRolesByLecturer = (lecturerId) => api.get(`/master/lecturers/${lecturerId}/roles`).then(r => r.data);

// ===== COURSES =====
export const getAllCourses = () => api.get('/master/courses').then(r => r.data);
export const getCourseById = (id) => api.get(`/master/courses/${id}`).then(r => r.data);
export const getCoursesByUnit = (unitId) => api.get(`/master/units/${unitId}/courses`).then(r => r.data);
export const createCourse = (data) => api.post('/master/courses', data).then(r => r.data);
export const updateCourse = (id, data) => api.put(`/master/courses/${id}`, data).then(r => r.data);
export const deleteCourse = (id) => api.delete(`/master/courses/${id}`).then(r => r.data);

// ===== SEMESTERS =====
export const getAllSemesters = () => api.get('/master/semesters').then(r => r.data);
export const getSemesterById = (id) => api.get(`/master/semesters/${id}`).then(r => r.data);
export const getActiveSemester = () => api.get('/master/semesters/active').then(r => r.data);
export const createSemester = (data) => api.post('/master/semesters', data).then(r => r.data);
export const updateSemester = (id, data) => api.put(`/master/semesters/${id}`, data).then(r => r.data);

// ===== CURRICULUMS =====
export const getAllCurriculums = () => api.get('/master/curriculums').then(r => r.data);
export const getCurriculumsByUnit = (unitId) => api.get(`/master/units/${unitId}/curriculums`).then(r => r.data);
export const createCurriculum = (data) => api.post('/master/curriculums', data).then(r => r.data);

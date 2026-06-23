import api from './client';

// ===== DOSEN WALI =====
export const getAllDosenWali = () => api.get('/perwalian/dosen-wali').then(r => r.data);
export const getDosenWaliById = (id) => api.get(`/perwalian/dosen-wali/${id}`).then(r => r.data);
export const assignDosenWali = (data) => api.post('/perwalian/dosen-wali', data).then(r => r.data);
export const updateDosenWali = (id, data) => api.put(`/perwalian/dosen-wali/${id}`, data).then(r => r.data);
export const deleteDosenWali = (id) => api.delete(`/perwalian/dosen-wali/${id}`).then(r => r.data);
export const getStudentsByLecturer = (lecturerId) => api.get(`/perwalian/lecturers/${lecturerId}/students`).then(r => r.data);
export const getLecturerByStudent = (studentId) => api.get(`/perwalian/students/${studentId}/lecturer`).then(r => r.data);
export const getCountStudentsPerLecturer = () => api.get('/perwalian/laporan/jumlah-mahasiswa-per-dosen').then(r => r.data);

// ===== PERWALIAN =====
export const getAllPerwalian = () => api.get('/perwalian/perwalians').then(r => r.data);
export const getPerwalianById = (id) => api.get(`/perwalian/perwalians/${id}`).then(r => r.data);
export const createPerwalian = (data) => api.post('/perwalian/perwalians', data).then(r => r.data);
export const getPerwalianByStudent = (studentId, semesterId) => {
  const params = semesterId ? { semester_id: semesterId } : {};
  return api.get(`/perwalian/students/${studentId}/perwalians`, { params }).then(r => r.data);
};
export const validatePerwalian = (id) => api.post(`/perwalian/perwalians/${id}/validate`).then(r => r.data);
export const unvalidatePerwalian = (id) => api.post(`/perwalian/perwalians/${id}/unvalidate`).then(r => r.data);
export const getRekapPerwalian = (semesterId) => api.get(`/perwalian/laporan/rekap/${semesterId}`).then(r => r.data);
export const deletePerwalian = (id) => api.delete(`/perwalian/perwalians/${id}`).then(r => r.data);

// ===== CATATAN PERWALIAN =====
export const getCatatanByPerwalian = (perwalianId) => api.get(`/perwalian/perwalians/${perwalianId}/catatan`).then(r => r.data);
export const getCatatanById = (id) => api.get(`/perwalian/catatan/${id}`).then(r => r.data);
export const createCatatan = (data) => api.post('/perwalian/catatan', data).then(r => r.data);
export const updateCatatan = (id, data) => api.put(`/perwalian/catatan/${id}`, data).then(r => r.data);
export const deleteCatatan = (id) => api.delete(`/perwalian/catatan/${id}`).then(r => r.data);

import axios from 'axios';

const API_BASE = 'http://13.220.219.2:8004/perwalian';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ===== DOSEN WALI =====
export const getAllDosenWali = () => api.get('/dosen-wali').then(r => r.data);
export const getDosenWaliById = (id) => api.get(`/dosen-wali/${id}`).then(r => r.data);
export const assignDosenWali = (data) => api.post('/dosen-wali', data).then(r => r.data);
export const updateDosenWali = (id, data) => api.put(`/dosen-wali/${id}`, data).then(r => r.data);
export const deleteDosenWali = (id) => api.delete(`/dosen-wali/${id}`).then(r => r.data);
export const getStudentsByLecturer = (lecturerId) => api.get(`/lecturers/${lecturerId}/students`).then(r => r.data);
export const getLecturerByStudent = (studentId) => api.get(`/students/${studentId}/lecturer`).then(r => r.data);
export const getCountStudentsPerLecturer = () => api.get('/laporan/jumlah-mahasiswa-per-dosen').then(r => r.data);

// ===== PERWALIAN =====
export const getAllPerwalian = () => api.get('/perwalians').then(r => r.data);
export const getPerwalianById = (id) => api.get(`/perwalians/${id}`).then(r => r.data);
export const createPerwalian = (data) => api.post('/perwalians', data).then(r => r.data);
export const getPerwalianByStudent = (studentId, semesterId) => {
  const params = semesterId ? `?semester_id=${semesterId}` : '';
  return api.get(`/students/${studentId}/perwalians${params}`).then(r => r.data);
};
export const validatePerwalian = (id) => api.post(`/perwalians/${id}/validate`).then(r => r.data);
export const unvalidatePerwalian = (id) => api.post(`/perwalians/${id}/unvalidate`).then(r => r.data);
export const getRekapPerwalian = (semesterId) => api.get(`/laporan/rekap/${semesterId}`).then(r => r.data);
export const deletePerwalian = (id) => api.delete(`/perwalians/${id}`).then(r => r.data);

// ===== CATATAN =====
export const getCatatanByPerwalian = (perwalianId) => api.get(`/perwalians/${perwalianId}/catatan`).then(r => r.data);
export const getCatatanById = (id) => api.get(`/catatan/${id}`).then(r => r.data);
export const createCatatan = (data) => api.post('/catatan', data).then(r => r.data);
export const updateCatatan = (id, data) => api.put(`/catatan/${id}`, data).then(r => r.data);
export const deleteCatatan = (id) => api.delete(`/catatan/${id}`).then(r => r.data);
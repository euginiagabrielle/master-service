import api from './client';

// ===== RUANG =====
export const getAllRuang = (params = {}) => api.get('/penawaran/ruang', { params }).then(r => r.data);
export const getRuangById = (id) => api.get(`/penawaran/ruang/${id}`).then(r => r.data);
export const createRuang = (data) => api.post('/penawaran/ruang', data).then(r => r.data);
export const updateRuang = (id, data) => api.put(`/penawaran/ruang/${id}`, data).then(r => r.data);
export const deleteRuang = (id) => api.delete(`/penawaran/ruang/${id}`).then(r => r.data);

// ===== KELAS =====
export const getAllKelas = (params = {}) => api.get('/penawaran/kelas', { params }).then(r => r.data);
export const getKelasById = (id) => api.get(`/penawaran/kelas/${id}`).then(r => r.data);
export const getKelasTersedia = (semesterId) => api.get('/penawaran/kelas/tersedia', { params: { semester_id: semesterId } }).then(r => r.data);
export const createKelas = (data) => {
  const payload = {
    ...data,
    kode_kelas: data.kode_kelas || data.kelas_no,
  };
  return api.post('/penawaran/kelas', payload).then(r => r.data);
};
export const updateKelas = (id, data) => api.put(`/penawaran/kelas/${id}`, data).then(r => r.data);
export const deleteKelas = (id) => api.delete(`/penawaran/kelas/${id}`).then(r => r.data);

// ===== DOSEN KELAS =====
export const assignDosenKelas = (kelasId, data) => api.post(`/penawaran/kelas/${kelasId}/dosen`, data).then(r => r.data);
export const getDosenKelas = (kelasId) => api.get(`/penawaran/kelas/${kelasId}/dosen`).then(r => r.data);
export const removeDosenKelas = (kelasDosenId) => api.delete(`/penawaran/kelas/dosen/${kelasDosenId}`).then(r => r.data);

// ===== JADWAL =====
export const createJadwal = (kelasId, data) => api.post(`/penawaran/kelas/${kelasId}/jadwal`, data).then(r => r.data);
export const getJadwalKelas = (kelasId) => api.get(`/penawaran/kelas/${kelasId}/jadwal`).then(r => r.data);
export const deleteJadwal = (jadwalId) => api.delete(`/penawaran/jadwal/${jadwalId}`).then(r => r.data);

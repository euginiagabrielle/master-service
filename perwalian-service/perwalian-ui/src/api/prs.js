import api from './client';

// ===== CREATE PRS =====
// Body: { id_mahasiswa, id_semester, dosen_wali_id }
export const createPrs = (data) => api.post('/prs', data).then(r => r.data);

// ===== CREATE PRS DETAIL =====
// Body: { id_kelas, id_mata_kuliah, sks, prioritas? }
export const createPrsDetail = (idPrs, data) =>
  api.post(`/prs/${idPrs}/detail`, data).then(r => r.data);

// ===== GET PRS =====
export const getPrs = (idMahasiswa, idSemester) =>
  api.get(`/prs/${idMahasiswa}/${idSemester}`).then(r => r.data);

export const getPrsDetailBySemester = (idSemester) =>
  api.get(`/prs/detail/${idSemester}`).then(r => r.data);

export const getPrsDetail = (idPrs) =>
  api.get(`/prs/${idPrs}/detail`).then(r => r.data);

export const getPrsDetailByKelas = (idKelas) =>
  api.get(`/prs/detail/kelas/${idKelas}`).then(r => r.data);

// ===== STATISTIK KELAS =====
export const getJumlahPerKelas = (idKelas) =>
  api.get(`/prs/kelas/${idKelas}/jumlah`).then(r => r.data);

export const getJumlahAllKelas = () =>
  api.get('/prs/kelas/jumlah').then(r => r.data);

// ===== VERIFICATION =====
export const verifyPrs = (idPrs) =>
  api.put(`/prs/${idPrs}/verify`).then(r => r.data);

export const verifyPrsBySemester = (idSemester) =>
  api.put(`/prs/semester/${idSemester}/verify`).then(r => r.data);

// ===== TRANSKRIP =====
export const pushPesertaToTranskrip = (idSemester) =>
  api.post(`/prs/transkrip/${idSemester}`).then(r => r.data);

// ===== JADWAL SNAPSHOT =====
export const invalidateJadwal = (idKelas) =>
  api.put(`/prs/jadwal/invalidate/${idKelas}`).then(r => r.data);

export const snapshotJadwal = (idDetailPrs, jadwalList) =>
  api.post(`/prs/detail/${idDetailPrs}/jadwal/snapshot`, { jadwal: jadwalList }).then(r => r.data);
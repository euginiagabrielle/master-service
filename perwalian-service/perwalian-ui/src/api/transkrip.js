import api from './client';

// ===== TRANSKRIP =====
export const getTranskrip = (idMahasiswa) => api.get(`/transkrip/${idMahasiswa}`).then(r => r.data);

// ===== KRS =====
export const getKrs = (idMahasiswa) => api.get(`/krs/${idMahasiswa}`).then(r => r.data);

// ===== KHS =====
export const getKhs = (idMahasiswa, semester, tahunAjaran) =>
  api.get(`/khs/${idMahasiswa}`, { params: { semester, tahun_ajaran: tahunAjaran } }).then(r => r.data);

// ===== IPS / IPK =====
export const getIps = (idMahasiswa) => api.get(`/ips/${idMahasiswa}`).then(r => r.data);
export const getIpk = (idMahasiswa) => api.get(`/ipk/${idMahasiswa}`).then(r => r.data);

// ===== NILAI =====
export const getNilaiByKelas = (idKelas) => api.get(`/nilai/kelas/${idKelas}`).then(r => r.data);
export const inputNilai = (data) => api.post('/input_nilai', data).then(r => r.data);

// ===== ADMIN ACTION =====
export const pushSemesterToKrs = (idSemester) => api.post('/push_semester_ke_krs', { id_semester: idSemester }).then(r => r.data);

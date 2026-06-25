import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import * as masterApi from '../api/master';
import * as perwalianApi from '../api/perwalian';
import * as penawaranApi from '../api/penawaran';
import * as transkripApi from '../api/transkrip';
import * as prsApi from '../api/prs';

const TABS = [
  // === DOSEN ===
  { id: 'mahasiswa-wali', label: 'Mahasiswa Wali', icon: '🎓' },
  { id: 'assign', label: 'Assign Wali Baru', icon: '➕' },
  { id: 'perwalian', label: 'Perwalian & Validasi', icon: '✅' },
  { id: 'catatan', label: 'Catatan Bimbingan', icon: '📝' },
  { id: 'prs-mahasiswa', label: 'PRS Mahasiswa Wali', icon: '📑' },
  { id: 'nilai', label: 'Input Nilai', icon: '🔢' },
  // === ADMIN MASTER DATA ===
  { id: 'lecturers', label: 'Master: Dosen', icon: '👨‍🏫' },
  { id: 'students', label: 'Master: Mahasiswa', icon: '🧑‍🎓' },
  { id: 'courses', label: 'Master: Mata Kuliah', icon: '📚' },
  { id: 'semesters', label: 'Master: Semester', icon: '📅' },
  { id: 'units', label: 'Master: Unit', icon: '🏛️' },
  // === PENAWARAN ===
  { id: 'ruang', label: 'Ruang', icon: '🏫' },
  { id: 'kelas', label: 'Kelas', icon: '📖' },
  { id: 'jadwal', label: 'Jadwal', icon: '🗓️' },
  // === PRS ADMIN ===
  { id: 'prs-verify', label: 'Verifikasi PRS', icon: '✅' },
  { id: 'prs-stats', label: 'Statistik Kelas', icon: '📊' },
  { id: 'krs-push', label: 'Push KRS', icon: '🚀' },
];

export default function DosenDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('mahasiswa-wali');
  const [loading, setLoading] = useState(false);

  // Master data
  const [units, setUnits] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [ruang, setRuang] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [perwalians, setPerwalians] = useState([]);
  const [dosenWalis, setDosenWalis] = useState([]);

  // Dosen tab state
  const [mahasiswaWali, setMahasiswaWali] = useState([]);
  const [catatans, setCatatans] = useState([]);
  const [selectedPerwalianId, setSelectedPerwalianId] = useState(null);

  // PRS state
  const [prsSemId, setPrsSemId] = useState('');
  const [prsLookupStudent, setPrsLookupStudent] = useState('');
  const [prsResult, setPrsResult] = useState(null);
  const [prsDetailItems, setPrsDetailItems] = useState([]);
  const [prsList, setPrsList] = useState([]);
  const [verifyTargetPrs, setVerifyTargetPrs] = useState('');
  const [jumlahPerKelas, setJumlahPerKelas] = useState([]);
  const [pushSemId, setPushSemId] = useState('');

  // Forms - Dosen
  const [formAssign, setFormAssign] = useState({ lecturer_id: user.user_id, student_id: '' });
  const [formPerwalian, setFormPerwalian] = useState({ dosen_wali_id: '', semester_id: '' });
  const [formCatatan, setFormCatatan] = useState({ perwalian_id: '', note_content: '' });
  const [formNilai, setFormNilai] = useState({ id_nilai: '', komponen: 'uts', nilai: '' });
  const [idKelas, setIdKelas] = useState('');
  const [nilaiKelas, setNilaiKelas] = useState([]);

  // Forms - Admin
  const [formUnit, setFormUnit] = useState({ unit_name: '', unit_type: 'study_program', parent_id: '' });
  const [formLecturer, setFormLecturer] = useState({ nip: '', name: '', email: '', password: '', status: 'active', unit_id: '' });
  const [formStudent, setFormStudent] = useState({ nrp: '', name: '', email: '', password: '', status: 'active', unit_id: '' });
  const [formCourse, setFormCourse] = useState({ course_code: '', course_name: '', sks: 3, unit_id: '' });
  const [formSemester, setFormSemester] = useState({ name: 'Gasal', year: '2025/2026', is_active: false });
  const [formRuang, setFormRuang] = useState({ kode_ruang: '', nama_ruang: '', tipe: 'kelas', gedung: '', kapasitas: 40, status: 'tersedia' });
  const [formKelas, setFormKelas] = useState({ course_id: '', semester_id: '', unit_id: '', kuota: 40, kode_kelas: '' });

  // ===== Penawaran Kelas UI state (desain mengikuti penawaran_kelas service) =====
  const [showRuangModal, setShowRuangModal] = useState(false);
  const [showKelasModal, setShowKelasModal] = useState(false);
  const [ruangFilter, setRuangFilter] = useState({ tipe: '', status: '', gedung: '' });
  const [kelasFilter, setKelasFilter] = useState({ semester_id: '', unit_id: '' });
  const [jadwalKelasId, setJadwalKelasId] = useState('');
  const [jadwalList, setJadwalList] = useState([]);
  const [showJadwalModal, setShowJadwalModal] = useState(false);
  const [formJadwal, setFormJadwal] = useState({ tipe: 'kuliah', hari: '', tanggal: '', jam_mulai: '', jam_selesai: '', ruang_id: '' });

  const lecturerId = user.user_id;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [u, l, s, c, sm, r, k, p, dw, mw] = await Promise.all([
          masterApi.getAllUnits().catch(() => []),
          masterApi.getAllLecturers().catch(() => []),
          masterApi.getAllStudents().catch(() => []),
          masterApi.getAllCourses().catch(() => []),
          masterApi.getAllSemesters().catch(() => []),
          penawaranApi.getAllRuang().catch(() => []),
          penawaranApi.getAllKelas().catch(() => []),
          perwalianApi.getAllPerwalian().catch(() => []),
          perwalianApi.getAllDosenWali().catch(() => []),
          perwalianApi.getStudentsByLecturer(lecturerId).catch(() => null),
        ]);
        setUnits(u); setLecturers(l); setStudents(s); setCourses(c); setSemesters(sm);
        setRuang(r); setKelas(k); setPerwalians(p); setDosenWalis(dw);
        setMahasiswaWali(mw?.data || mw || []);
        const active = sm.find(x => x.is_active);
        if (active) setPrsSemId(active.id);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [lecturerId]);

  // ===== Reload helpers =====
  const reload = async (key) => {
    try {
      if (key === 'units') setUnits(await masterApi.getAllUnits());
      if (key === 'lecturers') setLecturers(await masterApi.getAllLecturers());
      if (key === 'students') setStudents(await masterApi.getAllStudents());
      if (key === 'courses') setCourses(await masterApi.getAllCourses());
      if (key === 'semesters') setSemesters(await masterApi.getAllSemesters());
      if (key === 'ruang') setRuang(await penawaranApi.getAllRuang());
      if (key === 'kelas') setKelas(await penawaranApi.getAllKelas());
    } catch (e) { console.error(e); }
  };

  const reloadMahasiswaWali = async () => {
    const data = await perwalianApi.getStudentsByLecturer(lecturerId).catch(() => null);
    setMahasiswaWali(data?.data || data || []);
  };

  const reloadPerwalians = async () => {
    setPerwalians(await perwalianApi.getAllPerwalian().catch(() => []));
  };

  // ===== Helpers =====
  const getLecturerName = (id) => lecturers.find(l => l.id === id)?.name || `Lecturer #${id}`;
  const getStudentName = (id) => students.find(s => s.id === id)?.name || `Student #${id}`;
  const getSemesterName = (id) => {
    const s = semesters.find(s => s.id === id);
    return s ? `${s.name} ${s.year}` : `Semester #${id}`;
  };

  // ===== Penawaran Kelas helpers (status badge ala penawaran_kelas service) =====
  const getCourseName = (id) => {
    const c = courses.find(c => c.id === id);
    return c ? `${c.course_code || c.code || ''} ${c.course_name || c.name || ''}`.trim() : `Course #${id}`;
  };
  const penawaranStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'nonaktif' || s === 'inactive') return 'bg-red-100 text-red-800';
    if (s === 'aktif' || s === 'active') return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800'; // tersedia / default
  };
  const getRuangName = (id) => {
    if (!id) return 'TBD';
    const r = ruang.find(r => (r.id || r.ruang_id) === id);
    return r ? (r.nama_ruang || r.kode_ruang || `Ruang #${id}`) : `Ruang #${id}`;
  };
  const getKelasLabel = (k) => `${k.kode_kelas || `#${k.kelas_id || k.id}`} — ${getCourseName(k.course_id)}`;

  // ===== Jadwal (penawaran_kelas) handlers =====
  const loadJadwal = async (kelasId) => {
    if (!kelasId) { setJadwalList([]); return; }
    try {
      const data = await penawaranApi.getJadwalKelas(kelasId);
      setJadwalList(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); setJadwalList([]); }
  };

  const handleSelectJadwalKelas = (kelasId) => {
    setJadwalKelasId(kelasId);
    loadJadwal(kelasId);
  };

  const handleCreateJadwal = async (e) => {
    e.preventDefault();
    if (!jadwalKelasId) return alert('Pilih kelas dulu');
    const payload = {
      tipe: formJadwal.tipe,
      jam_mulai: formJadwal.jam_mulai,
      jam_selesai: formJadwal.jam_selesai,
    };
    // Hanya kirim ruang_id bila dipilih (sama seperti UI penawaran asli — jangan kirim null)
    if (formJadwal.ruang_id) payload.ruang_id = parseInt(formJadwal.ruang_id);
    if (formJadwal.tipe === 'kuliah') payload.hari = formJadwal.hari;
    else payload.tanggal = formJadwal.tanggal;
    try {
      const res = await penawaranApi.createJadwal(parseInt(jadwalKelasId), payload);
      if (res?.status === 'error') return alert('Error: ' + res.message);
      setShowJadwalModal(false);
      setFormJadwal({ tipe: 'kuliah', hari: '', tanggal: '', jam_mulai: '', jam_selesai: '', ruang_id: '' });
      loadJadwal(jadwalKelasId);
    } catch (e) { alert('Error: ' + (e.response?.data?.error || e.message)); }
  };

  const handleDeleteJadwal = async (jadwalId) => {
    if (!confirm('Hapus jadwal ini?')) return;
    try {
      await penawaranApi.deleteJadwal(jadwalId);
      loadJadwal(jadwalKelasId);
    } catch (e) { alert('Error: ' + e.message); }
  };

  const getPerwalianInfo = (perwalianId) => {
    const p = perwalians.find(p => p.id === perwalianId);
    if (!p) return `Perwalian #${perwalianId}`;
    const dw = dosenWalis.find(d => d.id === p.dosen_wali_id);
    if (!dw) return `#${perwalianId} - ${getSemesterName(p.semester_id)}`;
    const student = students.find(s => s.id === dw.student_id);
    const lecturer = lecturers.find(l => l.id === dw.lecturer_id);
    const studentName = student?.name || `Student #${dw.student_id}`;
    const lecturerName = lecturer?.name || `Lecturer #${dw.lecturer_id}`;
    const nrp = student?.nrp || '';
    return `${studentName}${nrp ? ` (${nrp})` : ''} - Dosen: ${lecturerName} | ${getSemesterName(p.semester_id)}`;
  };

  // ===== PRS handlers =====
  const handleLookupPrs = async () => {
    if (!prsLookupStudent || !prsSemId) return alert('Pilih mahasiswa & semester');
    setLoading(true);
    try {
      const res = await prsApi.getPrs(parseInt(prsLookupStudent), parseInt(prsSemId));
      if (res.success && res.data) {
        setPrsResult(res.data);
        const idPrs = res.data.id_prs || res.data.prs?.id_prs;
        if (idPrs) {
          const det = await prsApi.getPrsDetail(idPrs).catch(() => ({ data: [] }));
          setPrsDetailItems(det.data || []);
        }
      } else {
        setPrsResult(null);
        setPrsDetailItems([]);
        alert('PRS tidak ditemukan');
      }
    } catch (e) {
      alert('Error: ' + (e.response?.data?.error || e.message));
      setPrsResult(null);
      setPrsDetailItems([]);
    } finally { setLoading(false); }
  };

  const loadPrsBySemester = async () => {
    if (!prsSemId) return;
    setLoading(true);
    try {
      const res = await prsApi.getPrsDetailBySemester(prsSemId);
      setPrsList(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadJumlahPerKelas = async () => {
    setLoading(true);
    try {
      const res = await prsApi.getJumlahAllKelas();
      setJumlahPerKelas(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'prs-verify' && prsSemId) loadPrsBySemester();
    if (activeTab === 'prs-stats') loadJumlahPerKelas();
  }, [activeTab, prsSemId]);

  const handleVerifyPrs = async () => {
    if (!verifyTargetPrs) return alert('Input ID PRS dulu');
    try {
      const res = await prsApi.verifyPrs(parseInt(verifyTargetPrs));
      alert(res.success ? 'PRS berhasil di-verify' : 'Error: ' + (res.error || 'gagal'));
      loadPrsBySemester();
    } catch (e) { alert('Error: ' + (e.response?.data?.error || e.message)); }
  };

  const handleVerifyAllBySemester = async () => {
    if (!prsSemId) return alert('Pilih semester dulu');
    if (!confirm(`Verify SEMUA PRS di semester #${prsSemId}?`)) return;
    try {
      const res = await prsApi.verifyPrsBySemester(parseInt(prsSemId));
      alert(res.success ? 'Bulk verify selesai' : 'Error: ' + (res.error || 'gagal'));
      loadPrsBySemester();
    } catch (e) { alert('Error: ' + (e.response?.data?.error || e.message)); }
  };

  const handlePushToTranskrip = async () => {
    if (!prsSemId) return alert('Pilih semester dulu');
    if (!confirm(`Push semua peserta PRS tervalidasi di semester #${prsSemId}?`)) return;
    try {
      const res = await transkripApi.pushSemesterToKrs(parseInt(prsSemId));
      alert(res.success ? 'Push ke transkrip berhasil' : 'Error: ' + (res.error || 'gagal'));
    } catch (e) { alert('Error: ' + (e.response?.data?.error || e.message)); }
  };

  // ===== Dosen handlers =====
  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      const res = await perwalianApi.assignDosenWali({
        lecturer_id: parseInt(formAssign.lecturer_id),
        student_id: parseInt(formAssign.student_id),
      });
      alert(res.message || 'Success');
      setFormAssign({ ...formAssign, student_id: '' });
      reloadMahasiswaWali();
    } catch (e) { alert('Error: ' + (e.response?.data?.message || e.message)); }
  };

  const handleCreatePerwalian = async (e) => {
    e.preventDefault();
    try {
      const res = await perwalianApi.createPerwalian({
        dosen_wali_id: parseInt(formPerwalian.dosen_wali_id),
        semester_id: parseInt(formPerwalian.semester_id),
      });
      alert(res.message || 'Success');
      setFormPerwalian({ dosen_wali_id: '', semester_id: '' });
      reloadPerwalians();
    } catch (e) { alert('Error: ' + (e.response?.data?.message || e.message)); }
  };

  const handleValidate = async (id) => {
    try {
      const res = await perwalianApi.validatePerwalian(id);
      alert(res.message || 'Success');
      reloadPerwalians();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const handleUnvalidate = async (id) => {
    try {
      const res = await perwalianApi.unvalidatePerwalian(id);
      alert(res.message || 'Success');
      reloadPerwalians();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const loadCatatan = async (perwalianId) => {
    setSelectedPerwalianId(perwalianId);
    try {
      setCatatans(await perwalianApi.getCatatanByPerwalian(perwalianId));
    } catch (e) { console.error(e); }
  };

  const handleCreateCatatan = async (e) => {
    e.preventDefault();
    try {
      const res = await perwalianApi.createCatatan({
        perwalian_id: parseInt(formCatatan.perwalian_id),
        note_content: formCatatan.note_content,
      });
      alert(res.message || 'Success');
      setFormCatatan({ perwalian_id: '', note_content: '' });
      if (selectedPerwalianId) loadCatatan(selectedPerwalianId);
    } catch (e) { alert('Error: ' + (e.response?.data?.message || e.message)); }
  };

  const handleDeleteCatatan = async (id) => {
    if (!confirm('Hapus catatan ini?')) return;
    try {
      await perwalianApi.deleteCatatan(id);
      if (selectedPerwalianId) loadCatatan(selectedPerwalianId);
    } catch (e) { alert('Error: ' + e.message); }
  };

  // idKelas menyimpan KODE kelas (mis. "IF301-A"); cari nilai by kode via gateway
  const handleLoadNilai = async () => {
    if (!idKelas) return;
    try {
      const data = await transkripApi.getNilaiByKodeKelas(idKelas);
      if (Array.isArray(data)) {
        setNilaiKelas(data);
      } else {
        setNilaiKelas([]);
        alert(data?.message || 'Kelas tidak ditemukan');
      }
    } catch (e) { alert('Error: ' + (e.response?.data?.message || e.message)); }
  };

  const handleInputNilai = async (e) => {
    e.preventDefault();
    try {
      const res = await transkripApi.inputNilai({
        id_nilai: parseInt(formNilai.id_nilai),
        komponen: formNilai.komponen,
        nilai: parseFloat(formNilai.nilai),
      });
      alert(res.message || 'Nilai berhasil diinput');
      setFormNilai({ id_nilai: '', komponen: 'uts', nilai: '' });
      if (idKelas) handleLoadNilai();
    } catch (e) { alert('Error: ' + (e.response?.data?.message || e.message)); }
  };

  // ===== Admin CRUD handlers =====
  const handleCreate = async (type, e) => {
    e.preventDefault();
    try {
      let res;
      if (type === 'unit') res = await masterApi.createUnit({ ...formUnit, parent_id: formUnit.parent_id ? parseInt(formUnit.parent_id) : null });
      if (type === 'lecturer') res = await masterApi.createLecturer({ ...formLecturer, unit_id: parseInt(formLecturer.unit_id) });
      if (type === 'student') res = await masterApi.createStudent({ ...formStudent, unit_id: parseInt(formStudent.unit_id) });
      if (type === 'course') res = await masterApi.createCourse({ ...formCourse, sks: parseInt(formCourse.sks), unit_id: parseInt(formCourse.unit_id) });
      if (type === 'semester') res = await masterApi.createSemester(formSemester);
      if (type === 'ruang') res = await penawaranApi.createRuang({ ...formRuang, kapasitas: parseInt(formRuang.kapasitas) });
      if (type === 'kelas') res = await penawaranApi.createKelas({
        kode_kelas: formKelas.kode_kelas,
        course_id: parseInt(formKelas.course_id),
        semester_id: parseInt(formKelas.semester_id),
        unit_id: parseInt(formKelas.unit_id),
        kuota: parseInt(formKelas.kuota),
      });
      alert(res?.message || 'Berhasil ditambahkan');
      reload(type === 'unit' ? 'units' : type === 'lecturer' ? 'lecturers' : type === 'student' ? 'students' :
             type === 'course' ? 'courses' : type === 'semester' ? 'semesters' : type === 'ruang' ? 'ruang' : 'kelas');
    } catch (e) { alert('Error: ' + (e.response?.data?.message || e.message)); }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Hapus item ini?')) return;
    try {
      if (type === 'unit') await masterApi.deleteUnit(id);
      if (type === 'lecturer') await masterApi.deleteLecturer(id);
      if (type === 'student') await masterApi.deleteStudent(id);
      if (type === 'course') await masterApi.deleteCourse(id);
      if (type === 'ruang') await penawaranApi.deleteRuang(id);
      if (type === 'kelas') await penawaranApi.deleteKelas(id);
      reload(type === 'unit' ? 'units' : type === 'lecturer' ? 'lecturers' : type === 'student' ? 'students' :
             type === 'course' ? 'courses' : type === 'ruang' ? 'ruang' : 'kelas');
    } catch (e) { alert('Error: ' + e.message); }
  };

  const handlePushKrs = async () => {
    if (!pushSemId) return alert('Pilih semester dulu');
    if (!confirm(`Push semester #${pushSemId} ke KRS?`)) return;
    try {
      const res = await transkripApi.pushSemesterToKrs(parseInt(pushSemId));
      alert(res.message || `Push KRS: ${res.status}`);
    } catch (e) { alert('Error: ' + (e.response?.data?.message || e.message)); }
  };

  // Derived (client-side) filtered lists for Penawaran Kelas section
  const filteredRuang = ruang.filter(r =>
    (!ruangFilter.tipe || (r.tipe || '') === ruangFilter.tipe) &&
    (!ruangFilter.status || (r.status || '').toLowerCase() === ruangFilter.status) &&
    (!ruangFilter.gedung || (r.gedung || '').toLowerCase().includes(ruangFilter.gedung.toLowerCase()))
  );
  const filteredKelas = kelas.filter(k =>
    (!kelasFilter.semester_id || String(k.semester_id) === String(kelasFilter.semester_id)) &&
    (!kelasFilter.unit_id || String(k.unit_id) === String(kelasFilter.unit_id))
  );

  return (
    <Layout user={user} onLogout={onLogout} tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {loading && <p className="text-gray-500 mb-4">Loading...</p>}

      {/* ========== DOSEN TABS ========== */}

      {activeTab === 'mahasiswa-wali' && (
        <div>
          <PageHeader title="Mahasiswa Wali Saya" description={`${mahasiswaWali.length} mahasiswa yang sedang dibimbing`} />
          <div className="bg-white rounded-xl shadow-sm p-6">
            {mahasiswaWali.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">Mahasiswa</th><th className="px-3 py-2 text-left">NRP</th><th className="px-3 py-2 text-left">Status</th></tr></thead>
                <tbody>
                  {mahasiswaWali.map(mw => {
                    const sid = mw.student_id || mw.id;
                    const student = students.find(s => s.id === sid);
                    return (
                      <tr key={mw.id || mw.dosen_wali_id} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono">#{sid}</td>
                        <td className="px-3 py-2 font-medium">{student?.name || mw.student_name || '-'}</td>
                        <td className="px-3 py-2 font-mono">{student?.nrp || mw.nrp || '-'}</td>
                        <td className="px-3 py-2"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{mw.is_active !== false ? 'Active' : 'Inactive'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : <p className="text-gray-500">Belum ada mahasiswa wali</p>}
          </div>
        </div>
      )}

      {activeTab === 'assign' && (
        <div>
          <PageHeader title="Assign Mahasiswa Wali" />
          <form onSubmit={handleAssign} className="bg-white rounded-xl shadow-sm p-6 max-w-xl space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Dosen</label>
              <select value={formAssign.lecturer_id} onChange={(e) => setFormAssign({ ...formAssign, lecturer_id: e.target.value })} className="w-full px-3 py-2 border rounded">
                <option value={lecturerId}>(Saya) {getLecturerName(lecturerId)}</option>
                {lecturers.filter(l => l.id !== lecturerId).map(l => <option key={l.id} value={l.id}>{l.name} ({l.nip})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mahasiswa</label>
              <select value={formAssign.student_id} onChange={(e) => setFormAssign({ ...formAssign, student_id: e.target.value })} className="w-full px-3 py-2 border rounded" required>
                <option value="">-- Pilih Mahasiswa --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.nrp})</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-700 text-white py-2 rounded">Assign</button>
          </form>
        </div>
      )}

      {activeTab === 'perwalian' && (
        <div>
          <PageHeader title="Perwalian & Validasi PRS" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Buat Perwalian</h3>
              <form onSubmit={handleCreatePerwalian} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Semester</label>
                  <select value={formPerwalian.semester_id} onChange={(e) => setFormPerwalian({ ...formPerwalian, semester_id: e.target.value, dosen_wali_id: '' })} className="w-full px-3 py-2 border rounded" required>
                    <option value="">-- Pilih Semester --</option>
                    {semesters.map(s => <option key={s.id} value={s.id}>{s.is_active ? '🟢 ' : ''}{s.name} {s.year}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mahasiswa Wali</label>
                  <select
                    value={formPerwalian.dosen_wali_id}
                    onChange={(e) => setFormPerwalian({ ...formPerwalian, dosen_wali_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    required
                    disabled={!formPerwalian.semester_id}
                  >
                    <option value="">
                      {!formPerwalian.semester_id ? '-- Pilih semester dulu --' : '-- Pilih Mahasiswa --'}
                    </option>
                    {formPerwalian.semester_id && mahasiswaWali
                      .filter(mw => {
                        const dwId = mw.id || mw.dosen_wali_id;
                        // Filter: hanya mahasiswa wali yang BELUM punya perwalian di semester ini
                        return !perwalians.some(p =>
                          p.dosen_wali_id === dwId &&
                          p.semester_id === parseInt(formPerwalian.semester_id)
                        );
                      })
                      .map(mw => {
                        const sid = mw.student_id || mw.id;
                        const student = students.find(s => s.id === sid);
                        const dwId = mw.id || mw.dosen_wali_id;
                        return (
                          <option key={dwId} value={dwId}>
                            {student?.name || `Student #${sid}`} ({student?.nrp || '-'})
                          </option>
                        );
                      })}
                  </select>
                  {formPerwalian.semester_id && mahasiswaWali.filter(mw => {
                    const dwId = mw.id || mw.dosen_wali_id;
                    return !perwalians.some(p => p.dosen_wali_id === dwId && p.semester_id === parseInt(formPerwalian.semester_id));
                  }).length === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚠️ Semua mahasiswa wali sudah punya perwalian di semester ini.
                    </p>
                  )}
                </div>
                <button type="submit" className="w-full bg-blue-700 text-white py-2 rounded">Buat</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Daftar Perwalian ({perwalians.length})</h3>
              <div className="space-y-2">
                {perwalians.map(p => (
                  <div key={p.id} className="border rounded p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Perwalian #{p.id}</p>
                        <p className="text-sm text-gray-600">{getPerwalianInfo(p.id)}</p>
                        <p className="text-sm mt-1"><span className={`px-2 py-0.5 rounded text-xs ${p.is_prs_allowed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.is_prs_allowed ? '✓ Tervalidasi' : '⏳ Belum'}</span></p>
                      </div>
                      <div className="flex gap-2">
                        {!p.is_prs_allowed
                          ? <button onClick={() => handleValidate(p.id)} className="px-3 py-1 text-sm bg-green-600 text-white rounded">Validasi</button>
                          : <button onClick={() => handleUnvalidate(p.id)} className="px-3 py-1 text-sm bg-yellow-600 text-white rounded">Batal</button>}
                      </div>
                    </div>
                  </div>
                ))}
                {perwalians.length === 0 && <p className="text-gray-500 text-center py-4">Belum ada perwalian</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'catatan' && (
        <div>
          <PageHeader title="Catatan Bimbingan" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Buat Catatan</h3>
              <form onSubmit={handleCreateCatatan} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Perwalian</label>
                  <select value={formCatatan.perwalian_id} onChange={(e) => setFormCatatan({ ...formCatatan, perwalian_id: e.target.value })} className="w-full px-3 py-2 border rounded" required>
                    <option value="">-- Pilih Perwalian --</option>
                    {perwalians.map(p => <option key={p.id} value={p.id}>#{p.id} - {getPerwalianInfo(p.id)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Isi Catatan</label>
                  <textarea value={formCatatan.note_content} onChange={(e) => setFormCatatan({ ...formCatatan, note_content: e.target.value })} rows={5} className="w-full px-3 py-2 border rounded" required />
                </div>
                <button type="submit" className="w-full bg-blue-700 text-white py-2 rounded">Simpan</button>
              </form>
              <div className="mt-4 pt-4 border-t">
                <label className="block text-sm font-medium mb-1">Lihat Catatan:</label>
                <select value={selectedPerwalianId || ''} onChange={(e) => loadCatatan(parseInt(e.target.value))} className="w-full px-3 py-2 border rounded">
                  <option value="">-- Pilih Perwalian --</option>
                  {perwalians.map(p => <option key={p.id} value={p.id}>#{p.id} - {getPerwalianInfo(p.id)}</option>)}
                </select>
              </div>
            </div>
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">
                Catatan Bimbingan
                {selectedPerwalianId && <span className="text-sm font-normal text-gray-600 ml-2">— {getPerwalianInfo(selectedPerwalianId)}</span>}
              </h3>
              <div className="space-y-3">
                {catatans.map(c => (
                  <div key={c.id} className="border rounded p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs text-gray-500">{c.perwalian_date}</p>
                      <button onClick={() => handleDeleteCatatan(c.id)} className="text-red-600 text-xs">Hapus</button>
                    </div>
                    <p className="whitespace-pre-wrap">{c.note_content}</p>
                  </div>
                ))}
                {catatans.length === 0 && <p className="text-center text-gray-500 py-8">{selectedPerwalianId ? 'Belum ada catatan' : 'Pilih perwalian dulu'}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prs-mahasiswa' && (
        <div>
          <PageHeader title="PRS Mahasiswa Wali" description="Lihat PRS mahasiswa wali (read-only)" />
          <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1">Mahasiswa Wali</label>
                <select value={prsLookupStudent} onChange={(e) => setPrsLookupStudent(e.target.value)} className="w-full px-3 py-2 border rounded">
                  <option value="">-- Pilih Mahasiswa --</option>
                  {mahasiswaWali.map(mw => {
                    const sid = mw.student_id || mw.id;
                    const student = students.find(s => s.id === sid);
                    return <option key={sid} value={sid}>{student?.name || `#${sid}`} ({student?.nrp || '-'})</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Semester</label>
                <select value={prsSemId} onChange={(e) => setPrsSemId(e.target.value)} className="w-full px-3 py-2 border rounded">
                  <option value="">-- Pilih Semester --</option>
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.is_active ? '🟢 ' : ''}{s.name} {s.year}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={handleLookupPrs} className="w-full bg-blue-700 text-white py-2 rounded">🔍 Lihat PRS</button>
              </div>
            </div>
          </div>
          {prsResult && (
            <>
              <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
                <h3 className="font-semibold text-lg">PRS</h3>
                <p className="text-sm text-gray-600 mt-1">Status: <span className={`px-2 py-0.5 rounded text-xs ${prsResult.status === 'validated' ? 'bg-green-100 text-green-700' : prsResult.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{prsResult.status || 'draft'}</span></p>
                <p className="text-sm text-gray-600"> Total SKS: {prsDetailItems
                  .filter(d => d.prioritas === 1 || d.status_validasi === 'approved')
                  .reduce((sum, d) => sum + (d.sks || 0), 0)}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold mb-4">Mata Kuliah ({prsDetailItems.length})</h3>
                {prsDetailItems.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">Kelas</th><th className="px-3 py-2 text-left">Matkul</th><th className="px-3 py-2 text-left">SKS</th><th className="px-3 py-2 text-left">Prio</th><th className="px-3 py-2 text-left">Status</th></tr></thead>
                    <tbody>{prsDetailItems.map(d => (
                      <tr key={d.id_detail_prs || d.id} className="border-b">
                        <td className="px-3 py-2 font-mono">#{d.id_detail_prs || d.id}</td>
                        <td className="px-3 py-2 font-mono">#{d.id_kelas}</td>
                        <td className="px-3 py-2">{d.nama_matkul || `#${d.id_mata_kuliah}`}</td>
                        <td className="px-3 py-2">{d.sks}</td>
                        <td className="px-3 py-2">{d.prioritas || '-'}</td>
                        <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs ${(d.status_validasi || d.status) === 'approved' ? 'bg-green-100 text-green-700' : (d.status_validasi || d.status) === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status_validasi || d.status || 'pending'}</span></td>
                      </tr>))}
                    </tbody>
                  </table>
                ) : <p className="text-gray-500">Belum ada mata kuliah</p>}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'nilai' && (
        <div>
          <PageHeader title="Input Nilai" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Cari Nilai per Kelas</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Kelas (kode)</label>
                  <select value={idKelas} onChange={(e) => setIdKelas(e.target.value)} className="w-full px-3 py-2 border rounded">
                    <option value="">-- Pilih Kelas --</option>
                    {kelas.map(k => <option key={k.kelas_id || k.id} value={k.kode_kelas}>{k.kode_kelas} — {getCourseName(k.course_id)}</option>)}
                  </select>
                </div>
                <button onClick={handleLoadNilai} className="w-full bg-blue-700 text-white py-2 rounded">Tampilkan</button>
              </div>
              <hr className="my-4" />
              <h3 className="font-semibold mb-4">Input/Update Nilai</h3>
              <form onSubmit={handleInputNilai} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">ID Nilai</label>
                  <input type="number" value={formNilai.id_nilai} onChange={(e) => setFormNilai({ ...formNilai, id_nilai: e.target.value })} required className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Komponen</label>
                  <select value={formNilai.komponen} onChange={(e) => setFormNilai({ ...formNilai, komponen: e.target.value })} className="w-full px-3 py-2 border rounded">
                    <option value="uts">UTS</option><option value="uas">UAS</option><option value="tes1">Tes 1</option><option value="tes2">Tes 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nilai (0-100)</label>
                  <input type="number" step="0.01" min="0" max="100" value={formNilai.nilai} onChange={(e) => setFormNilai({ ...formNilai, nilai: e.target.value })} required className="w-full px-3 py-2 border rounded" />
                </div>
                <button type="submit" className="w-full bg-blue-700 text-white py-2 rounded">Simpan</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Nilai Kelas {idKelas && `(${idKelas})`}</h3>
              {nilaiKelas.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr><th className="px-3 py-2 text-left">ID Nilai</th><th className="px-3 py-2 text-left">Matkul</th><th className="px-3 py-2 text-left">UTS</th><th className="px-3 py-2 text-left">UAS</th><th className="px-3 py-2 text-left">Tes1</th><th className="px-3 py-2 text-left">Tes2</th><th className="px-3 py-2 text-left">Akhir</th><th className="px-3 py-2 text-left">Huruf</th></tr></thead>
                  <tbody>{nilaiKelas.map(n => (<tr key={n.id_nilai} className="border-b"><td className="px-3 py-2 font-mono">{n.id_nilai}</td><td className="px-3 py-2">{n.nama_matkul || `#${n.id_matkul}`}</td><td className="px-3 py-2">{n.nilai_uts ?? '-'}</td><td className="px-3 py-2">{n.nilai_uas ?? '-'}</td><td className="px-3 py-2">{n.nilai_tes1 ?? '-'}</td><td className="px-3 py-2">{n.nilai_tes2 ?? '-'}</td><td className="px-3 py-2 font-medium">{n.nilai_akhir ?? '-'}</td><td className="px-3 py-2 font-medium">{n.nilai_huruf ?? '-'}</td></tr>))}</tbody>
                </table>
              ) : <p className="text-gray-500">Pilih kelas dulu</p>}
            </div>
          </div>
        </div>
      )}

      {/* ========== ADMIN MASTER TABS ========== */}

      {activeTab === 'units' && (
        <div>
          <PageHeader title="Master: Unit Akademik" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={(e) => handleCreate('unit', e)} className="bg-white rounded-xl shadow-sm p-6 space-y-3">
              <h3 className="font-semibold">Tambah Unit</h3>
              <input value={formUnit.unit_name} onChange={(e) => setFormUnit({...formUnit, unit_name: e.target.value})} placeholder="Nama Unit" required className="w-full px-3 py-2 border rounded" />
              <select value={formUnit.unit_type} onChange={(e) => setFormUnit({...formUnit, unit_type: e.target.value})} className="w-full px-3 py-2 border rounded">
                <option value="faculty">Fakultas</option>
                <option value="study_program">Program Studi</option>
                <option value="department">Departemen</option>
              </select>
              <select value={formUnit.parent_id} onChange={(e) => setFormUnit({...formUnit, parent_id: e.target.value})} className="w-full px-3 py-2 border rounded">
                <option value="">-- Parent (opsional) --</option>
                {units.map(u => <option key={u.unit_id || u.id} value={u.unit_id || u.id}>{u.unit_name || u.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-blue-700 text-white py-2 rounded">Tambah</button>
            </form>
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Daftar Unit ({units.length})</h3>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">Nama</th><th className="px-3 py-2 text-left">Tipe</th><th className="px-3 py-2 text-left">Aksi</th></tr></thead>
                <tbody>{units.map(u => (<tr key={u.unit_id || u.id} className="border-b"><td className="px-3 py-2 font-mono">{u.unit_id || u.id}</td><td className="px-3 py-2">{u.unit_name || u.name}</td><td className="px-3 py-2">{u.unit_type || u.type}</td><td className="px-3 py-2"><button onClick={() => handleDelete('unit', u.unit_id || u.id)} className="text-red-600 text-xs">Hapus</button></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lecturers' && (
        <div>
          <PageHeader title="Master: Dosen" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={(e) => handleCreate('lecturer', e)} className="bg-white rounded-xl shadow-sm p-6 space-y-3">
              <h3 className="font-semibold">Tambah Dosen</h3>
              <input value={formLecturer.nip} onChange={(e) => setFormLecturer({...formLecturer, nip: e.target.value})} placeholder="NIP" required className="w-full px-3 py-2 border rounded" />
              <input value={formLecturer.name} onChange={(e) => setFormLecturer({...formLecturer, name: e.target.value})} placeholder="Nama" required className="w-full px-3 py-2 border rounded" />
              <input type="email" value={formLecturer.email} onChange={(e) => setFormLecturer({...formLecturer, email: e.target.value})} placeholder="Email" required className="w-full px-3 py-2 border rounded" />
              <input type="password" value={formLecturer.password} onChange={(e) => setFormLecturer({...formLecturer, password: e.target.value})} placeholder="Password" required className="w-full px-3 py-2 border rounded" />
              <select value={formLecturer.unit_id} onChange={(e) => setFormLecturer({...formLecturer, unit_id: e.target.value})} required className="w-full px-3 py-2 border rounded">
                <option value="">-- Pilih Unit --</option>
                {units.map(u => <option key={u.unit_id || u.id} value={u.unit_id || u.id}>{u.unit_name || u.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-blue-700 text-white py-2 rounded">Tambah</button>
            </form>
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Daftar Dosen ({lecturers.length})</h3>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">NIP</th><th className="px-3 py-2 text-left">Nama</th><th className="px-3 py-2 text-left">Aksi</th></tr></thead>
                <tbody>{lecturers.map(l => (<tr key={l.id} className="border-b"><td className="px-3 py-2 font-mono">{l.id}</td><td className="px-3 py-2 font-mono">{l.nip}</td><td className="px-3 py-2">{l.name}</td><td className="px-3 py-2"><button onClick={() => handleDelete('lecturer', l.id)} className="text-red-600 text-xs">Hapus</button></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div>
          <PageHeader title="Master: Mahasiswa" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={(e) => handleCreate('student', e)} className="bg-white rounded-xl shadow-sm p-6 space-y-3">
              <h3 className="font-semibold">Tambah Mahasiswa</h3>
              <input value={formStudent.nrp} onChange={(e) => setFormStudent({...formStudent, nrp: e.target.value})} placeholder="NRP" required className="w-full px-3 py-2 border rounded" />
              <input value={formStudent.name} onChange={(e) => setFormStudent({...formStudent, name: e.target.value})} placeholder="Nama" required className="w-full px-3 py-2 border rounded" />
              <input type="email" value={formStudent.email} onChange={(e) => setFormStudent({...formStudent, email: e.target.value})} placeholder="Email" required className="w-full px-3 py-2 border rounded" />
              <input type="password" value={formStudent.password} onChange={(e) => setFormStudent({...formStudent, password: e.target.value})} placeholder="Password" required className="w-full px-3 py-2 border rounded" />
              <select value={formStudent.unit_id} onChange={(e) => setFormStudent({...formStudent, unit_id: e.target.value})} required className="w-full px-3 py-2 border rounded">
                <option value="">-- Pilih Unit --</option>
                {units.map(u => <option key={u.unit_id || u.id} value={u.unit_id || u.id}>{u.unit_name || u.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-blue-700 text-white py-2 rounded">Tambah</button>
            </form>
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Daftar Mahasiswa ({students.length})</h3>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">NRP</th><th className="px-3 py-2 text-left">Nama</th><th className="px-3 py-2 text-left">Aksi</th></tr></thead>
                <tbody>{students.map(s => (<tr key={s.id} className="border-b"><td className="px-3 py-2 font-mono">{s.id}</td><td className="px-3 py-2 font-mono">{s.nrp}</td><td className="px-3 py-2">{s.name}</td><td className="px-3 py-2"><button onClick={() => handleDelete('student', s.id)} className="text-red-600 text-xs">Hapus</button></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div>
          <PageHeader title="Master: Mata Kuliah" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={(e) => handleCreate('course', e)} className="bg-white rounded-xl shadow-sm p-6 space-y-3">
              <h3 className="font-semibold">Tambah Mata Kuliah</h3>
              <input value={formCourse.course_code} onChange={(e) => setFormCourse({...formCourse, course_code: e.target.value})} placeholder="Kode" required className="w-full px-3 py-2 border rounded" />
              <input value={formCourse.course_name} onChange={(e) => setFormCourse({...formCourse, course_name: e.target.value})} placeholder="Nama" required className="w-full px-3 py-2 border rounded" />
              <input type="number" value={formCourse.sks} onChange={(e) => setFormCourse({...formCourse, sks: e.target.value})} placeholder="SKS" min="1" max="6" required className="w-full px-3 py-2 border rounded" />
              <select value={formCourse.unit_id} onChange={(e) => setFormCourse({...formCourse, unit_id: e.target.value})} required className="w-full px-3 py-2 border rounded">
                <option value="">-- Pilih Unit --</option>
                {units.map(u => <option key={u.unit_id || u.id} value={u.unit_id || u.id}>{u.unit_name || u.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-blue-700 text-white py-2 rounded">Tambah</button>
            </form>
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Daftar Mata Kuliah ({courses.length})</h3>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">Kode</th><th className="px-3 py-2 text-left">Nama</th><th className="px-3 py-2 text-left">SKS</th><th className="px-3 py-2 text-left">Aksi</th></tr></thead>
                <tbody>{courses.map(c => (<tr key={c.id} className="border-b"><td className="px-3 py-2 font-mono">{c.id}</td><td className="px-3 py-2 font-mono">{c.course_code || c.code}</td><td className="px-3 py-2">{c.course_name || c.name}</td><td className="px-3 py-2">{c.sks}</td><td className="px-3 py-2"><button onClick={() => handleDelete('course', c.id)} className="text-red-600 text-xs">Hapus</button></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'semesters' && (
        <div>
          <PageHeader title="Master: Semester" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={(e) => handleCreate('semester', e)} className="bg-white rounded-xl shadow-sm p-6 space-y-3">
              <h3 className="font-semibold">Tambah Semester</h3>
              <select value={formSemester.name} onChange={(e) => setFormSemester({...formSemester, name: e.target.value})} className="w-full px-3 py-2 border rounded">
                <option value="Gasal">Gasal</option><option value="Genap">Genap</option><option value="Pendek">Pendek</option>
              </select>
              <input value={formSemester.year} onChange={(e) => setFormSemester({...formSemester, year: e.target.value})} placeholder="2025/2026" required className="w-full px-3 py-2 border rounded" />
              <label className="flex items-center gap-2"><input type="checkbox" checked={formSemester.is_active} onChange={(e) => setFormSemester({...formSemester, is_active: e.target.checked})} /><span className="text-sm">Set sebagai semester aktif</span></label>
              <button type="submit" className="w-full bg-blue-700 text-white py-2 rounded">Tambah</button>
            </form>
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Daftar Semester ({semesters.length})</h3>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">Nama</th><th className="px-3 py-2 text-left">Tahun</th><th className="px-3 py-2 text-left">Status</th></tr></thead>
                <tbody>{semesters.map(s => (<tr key={s.id} className="border-b"><td className="px-3 py-2 font-mono">{s.id}</td><td className="px-3 py-2">{s.name}</td><td className="px-3 py-2">{s.year}</td><td className="px-3 py-2"><span className={`px-2 py-1 rounded text-xs ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{s.is_active ? '🟢 Active' : '⚫ Inactive'}</span></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ruang' && (
        <div>
          {/* Banner ala penawaran_kelas service */}
          <div className="rounded-xl px-6 py-5 mb-4 text-white shadow-sm bg-gradient-to-br from-blue-700 to-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">🏫 Ruang</h2>
                <p className="text-sm text-blue-100 mt-0.5">Manajemen ruang — Penawaran Kelas</p>
              </div>
              <span className="text-2xl font-bold opacity-90">{filteredRuang.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            {/* Toolbar filter */}
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <select value={ruangFilter.tipe} onChange={(e) => setRuangFilter({ ...ruangFilter, tipe: e.target.value })} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
                <option value="">Semua Tipe</option>
                <option value="kelas">Kelas</option>
                <option value="lab">Lab</option>
                <option value="auditorium">Auditorium</option>
                <option value="aula">Aula</option>
              </select>
              <input value={ruangFilter.gedung} onChange={(e) => setRuangFilter({ ...ruangFilter, gedung: e.target.value })} placeholder="Gedung..." className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40" />
              <select value={ruangFilter.status} onChange={(e) => setRuangFilter({ ...ruangFilter, status: e.target.value })} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
                <option value="">Semua Status</option>
                <option value="tersedia">Tersedia</option>
                <option value="active">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
              <button onClick={() => setRuangFilter({ tipe: '', status: '', gedung: '' })} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">↻ Reset</button>
              <button onClick={() => setShowRuangModal(true)} className="ml-auto px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium">+ Tambah Ruang</button>
            </div>

            {/* Tabel */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                    <th className="px-3 py-2.5 text-left font-semibold">Kode</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Nama</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Tipe</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Kapasitas</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Gedung</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Status</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRuang.map(r => (
                    <tr key={r.id || r.ruang_id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-mono text-slate-700">{r.kode_ruang || '-'}</td>
                      <td className="px-3 py-2.5 font-medium">{r.nama_ruang || '-'}</td>
                      <td className="px-3 py-2.5 capitalize">{r.tipe || '-'}</td>
                      <td className="px-3 py-2.5">{r.kapasitas ?? '-'}</td>
                      <td className="px-3 py-2.5">{r.gedung || '-'}</td>
                      <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${penawaranStatusBadge(r.status)}`}>{r.status || 'tersedia'}</span></td>
                      <td className="px-3 py-2.5"><button onClick={() => handleDelete('ruang', r.id || r.ruang_id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Hapus</button></td>
                    </tr>
                  ))}
                  {filteredRuang.length === 0 && (
                    <tr><td colSpan={7} className="text-center text-slate-400 py-6">Tidak ada ruang yang cocok.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Tambah Ruang */}
          {showRuangModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowRuangModal(false)}>
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-3 border-b">
                  <h3 className="font-semibold text-slate-800">Tambah Ruang</h3>
                  <button onClick={() => setShowRuangModal(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
                </div>
                <form onSubmit={(e) => { handleCreate('ruang', e); setShowRuangModal(false); }} className="p-5 space-y-3">
                  <input value={formRuang.kode_ruang} onChange={(e) => setFormRuang({...formRuang, kode_ruang: e.target.value})} placeholder="Kode Ruang (R-101)" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  <input value={formRuang.nama_ruang} onChange={(e) => setFormRuang({...formRuang, nama_ruang: e.target.value})} placeholder="Nama (P-101)" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  <input value={formRuang.gedung} onChange={(e) => setFormRuang({...formRuang, gedung: e.target.value})} placeholder="Gedung" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  <select value={formRuang.tipe} onChange={(e) => setFormRuang({...formRuang, tipe: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option value="kelas">Kelas</option><option value="lab">Lab</option><option value="auditorium">Auditorium</option>
                  </select>
                  <input type="number" value={formRuang.kapasitas} onChange={(e) => setFormRuang({...formRuang, kapasitas: e.target.value})} placeholder="Kapasitas" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowRuangModal(false)} className="px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-100">Batal</button>
                    <button type="submit" className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium">Simpan</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'kelas' && (
        <div>
          {/* Banner ala penawaran_kelas service */}
          <div className="rounded-xl px-6 py-5 mb-4 text-white shadow-sm bg-gradient-to-br from-blue-700 to-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">📖 Kelas</h2>
                <p className="text-sm text-blue-100 mt-0.5">Penawaran kelas per semester</p>
              </div>
              <span className="text-2xl font-bold opacity-90">{filteredKelas.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            {/* Toolbar filter */}
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <select value={kelasFilter.semester_id} onChange={(e) => setKelasFilter({ ...kelasFilter, semester_id: e.target.value })} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
                <option value="">Semua Semester</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name} {s.year}</option>)}
              </select>
              <select value={kelasFilter.unit_id} onChange={(e) => setKelasFilter({ ...kelasFilter, unit_id: e.target.value })} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
                <option value="">Semua Unit</option>
                {units.map(u => <option key={u.unit_id || u.id} value={u.unit_id || u.id}>{u.unit_name || u.name}</option>)}
              </select>
              <button onClick={() => setKelasFilter({ semester_id: '', unit_id: '' })} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">↻ Reset</button>
              <button onClick={() => setShowKelasModal(true)} className="ml-auto px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium">+ Tambah Kelas</button>
            </div>

            {/* Tabel */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                    <th className="px-3 py-2.5 text-left font-semibold">Kode Kelas</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Mata Kuliah</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Semester</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Kuota</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Terisi</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Sisa</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Status</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKelas.map(k => {
                    const kuota = k.kuota ?? k.kapasitas ?? 0;
                    const terisi = k.jumlah_terisi ?? 0;
                    return (
                      <tr key={k.id || k.kelas_id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-mono text-slate-700">{k.kode_kelas || k.kelas_no || '-'}</td>
                        <td className="px-3 py-2.5">{getCourseName(k.course_id)}</td>
                        <td className="px-3 py-2.5">{getSemesterName(k.semester_id)}</td>
                        <td className="px-3 py-2.5">{kuota}</td>
                        <td className="px-3 py-2.5">{terisi}</td>
                        <td className="px-3 py-2.5">{kuota - terisi}</td>
                        <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${penawaranStatusBadge(k.status)}`}>{k.status || 'aktif'}</span></td>
                        <td className="px-3 py-2.5"><button onClick={() => handleDelete('kelas', k.id || k.kelas_id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Hapus</button></td>
                      </tr>
                    );
                  })}
                  {filteredKelas.length === 0 && (
                    <tr><td colSpan={8} className="text-center text-slate-400 py-6">Tidak ada kelas yang cocok.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Tambah Kelas */}
          {showKelasModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowKelasModal(false)}>
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-3 border-b">
                  <h3 className="font-semibold text-slate-800">Tambah Kelas</h3>
                  <button onClick={() => setShowKelasModal(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
                </div>
                <form onSubmit={(e) => { handleCreate('kelas', e); setShowKelasModal(false); }} className="p-5 space-y-3">
                  <select value={formKelas.course_id} onChange={(e) => setFormKelas({...formKelas, course_id: e.target.value})} required className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option value="">-- Pilih Mata Kuliah --</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.course_code || c.code} - {c.course_name || c.name}</option>)}
                  </select>
                  <select value={formKelas.semester_id} onChange={(e) => setFormKelas({...formKelas, semester_id: e.target.value})} required className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option value="">-- Pilih Semester --</option>
                    {semesters.map(s => <option key={s.id} value={s.id}>{s.name} {s.year}</option>)}
                  </select>
                  <select value={formKelas.unit_id} onChange={(e) => setFormKelas({...formKelas, unit_id: e.target.value})} required className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option value="">-- Pilih Unit --</option>
                    {units.map(u => <option key={u.unit_id || u.id} value={u.unit_id || u.id}>{u.unit_name || u.name}</option>)}
                  </select>
                  <input value={formKelas.kode_kelas} onChange={(e) => setFormKelas({...formKelas, kode_kelas: e.target.value})} placeholder="Kode Kelas (IF301-A)" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  <input type="number" value={formKelas.kuota} onChange={(e) => setFormKelas({...formKelas, kuota: e.target.value})} placeholder="Kuota" required min="0" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowKelasModal(false)} className="px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-100">Batal</button>
                    <button type="submit" className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium">Simpan</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'jadwal' && (
        <div>
          {/* Banner ala penawaran_kelas service */}
          <div className="rounded-xl px-6 py-5 mb-4 text-white shadow-sm bg-gradient-to-br from-blue-700 to-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">🗓️ Jadwal</h2>
                <p className="text-sm text-blue-100 mt-0.5">Jadwal kuliah & ujian per kelas</p>
              </div>
              <span className="text-2xl font-bold opacity-90">{jadwalList.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            {/* Toolbar: pilih kelas */}
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <label className="text-sm text-slate-600 font-medium">Kelas:</label>
              <select value={jadwalKelasId} onChange={(e) => handleSelectJadwalKelas(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm min-w-[260px]">
                <option value="">— Pilih kelas —</option>
                {kelas.filter(k => (k.status || 'aktif') === 'aktif').map(k => <option key={k.id || k.kelas_id} value={k.id || k.kelas_id}>{getKelasLabel(k)}</option>)}
              </select>
              <button onClick={() => loadJadwal(jadwalKelasId)} disabled={!jadwalKelasId} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40">↻ Muat</button>
              <button onClick={() => setShowJadwalModal(true)} disabled={!jadwalKelasId} className="ml-auto px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium disabled:opacity-40">+ Tambah Jadwal</button>
            </div>

            {/* Tabel jadwal */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                    <th className="px-3 py-2.5 text-left font-semibold">Tipe</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Hari / Tanggal</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Jam</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Ruang</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Status</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {jadwalList.map(j => (
                    <tr key={j.jadwal_id} className={`border-b border-slate-100 hover:bg-slate-50 ${j.is_outdated ? 'opacity-50' : ''}`}>
                      <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 uppercase">{j.tipe}</span></td>
                      <td className="px-3 py-2.5">{j.hari || j.tanggal || '-'}</td>
                      <td className="px-3 py-2.5 font-mono">{(j.jam_mulai || '').slice(0,5)} – {(j.jam_selesai || '').slice(0,5)}</td>
                      <td className="px-3 py-2.5">{getRuangName(j.ruang_id)}</td>
                      <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${j.is_outdated ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{j.is_outdated ? 'Outdated' : 'Aktif'}</span></td>
                      <td className="px-3 py-2.5"><button onClick={() => handleDeleteJadwal(j.jadwal_id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Hapus</button></td>
                    </tr>
                  ))}
                  {jadwalList.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-slate-400 py-6">{jadwalKelasId ? 'Belum ada jadwal untuk kelas ini.' : 'Pilih kelas untuk melihat jadwal.'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Tambah Jadwal */}
          {showJadwalModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowJadwalModal(false)}>
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-3 border-b">
                  <h3 className="font-semibold text-slate-800">Tambah Jadwal</h3>
                  <button onClick={() => setShowJadwalModal(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
                </div>
                <form onSubmit={handleCreateJadwal} className="p-5 space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-600">Tipe</label>
                    <select value={formJadwal.tipe} onChange={(e) => setFormJadwal({ ...formJadwal, tipe: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                      <option value="kuliah">Kuliah (mingguan)</option>
                      <option value="uts">UTS</option>
                      <option value="uas">UAS</option>
                    </select>
                  </div>
                  {formJadwal.tipe === 'kuliah' ? (
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-600">Hari</label>
                      <select value={formJadwal.hari} onChange={(e) => setFormJadwal({ ...formJadwal, hari: e.target.value })} required className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                        <option value="">— pilih hari —</option>
                        {['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'].map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-600">Tanggal</label>
                      <input type="date" value={formJadwal.tanggal} onChange={(e) => setFormJadwal({ ...formJadwal, tanggal: e.target.value })} required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-600">Jam Mulai</label>
                      <input type="time" value={formJadwal.jam_mulai} onChange={(e) => setFormJadwal({ ...formJadwal, jam_mulai: e.target.value })} required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-600">Jam Selesai</label>
                      <input type="time" value={formJadwal.jam_selesai} onChange={(e) => setFormJadwal({ ...formJadwal, jam_selesai: e.target.value })} required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-600">Ruang <span className="text-slate-400 font-normal">(opsional)</span></label>
                    <select value={formJadwal.ruang_id} onChange={(e) => setFormJadwal({ ...formJadwal, ruang_id: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                      <option value="">— tidak ada / pakai ruang ujian kelas —</option>
                      {ruang.map(r => <option key={r.id || r.ruang_id} value={r.id || r.ruang_id}>{r.kode_ruang} {r.nama_ruang ? `- ${r.nama_ruang}` : ''}</option>)}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowJadwalModal(false)} className="px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-100">Batal</button>
                    <button type="submit" className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium">Simpan</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== PRS ADMIN TABS ========== */}

      {activeTab === 'prs-verify' && (
        <div>
          <PageHeader title="Verifikasi PRS" description="Auto-verify dengan check kapasitas & prioritas" />
          <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
            <label className="block text-sm font-medium mb-1">Semester</label>
            <select value={prsSemId} onChange={(e) => setPrsSemId(e.target.value)} className="w-full max-w-md px-3 py-2 border rounded mb-4">
              <option value="">-- Pilih Semester --</option>
              {semesters.map(s => (<option key={s.id} value={s.id}>{s.is_active ? '🟢 ' : ''}{s.name} {s.year}</option>))}
            </select>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-sm font-medium mb-1">Verify Single PRS</label>
                <div className="flex gap-2">
                  <input type="number" value={verifyTargetPrs} onChange={(e) => setVerifyTargetPrs(e.target.value)} placeholder="ID PRS" className="px-3 py-2 border rounded w-32" />
                  <button onClick={handleVerifyPrs} className="px-4 py-2 bg-green-600 text-white rounded">Verify</button>
                </div>
              </div>
              <button onClick={handleVerifyAllBySemester} disabled={!prsSemId} className="px-4 py-2 bg-purple-600 text-white rounded disabled:bg-gray-400">🔄 Verify All</button>
              <button onClick={handlePushToTranskrip} disabled={!prsSemId} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400">📤 Push ke Transkrip</button>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Detail PRS Semester #{prsSemId} ({prsList.length})</h3>
            {prsList.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">PRS</th><th className="px-3 py-2 text-left">Mhs</th><th className="px-3 py-2 text-left">Kelas</th><th className="px-3 py-2 text-left">Matkul</th><th className="px-3 py-2 text-left">SKS</th><th className="px-3 py-2 text-left">Prio</th><th className="px-3 py-2 text-left">Status</th></tr></thead>
                <tbody>{prsList.map(d => (<tr key={d.id_detail_prs || d.id} className="border-b"><td className="px-3 py-2 font-mono">#{d.id_detail_prs || d.id}</td><td className="px-3 py-2 font-mono">#{d.id_prs}</td><td className="px-3 py-2">#{d.id_mahasiswa}</td><td className="px-3 py-2">#{d.id_kelas}</td><td className="px-3 py-2">{d.nama_matkul || `#${d.id_mata_kuliah}`}</td><td className="px-3 py-2">{d.sks}</td><td className="px-3 py-2">{d.prioritas || '-'}</td><td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs ${(d.status_validasi || d.status) === 'approved' ? 'bg-green-100 text-green-700' : (d.status_validasi || d.status) === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status_validasi || d.status || 'pending'}</span></td></tr>))}</tbody>
              </table>
            ) : <p className="text-gray-500">Belum ada data PRS</p>}
          </div>
        </div>
      )}

      {activeTab === 'prs-stats' && (
        <div>
          <PageHeader title="Statistik Kelas" description="Jumlah peminat per kelas" action={<button onClick={loadJumlahPerKelas} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg font-medium">🔄 Refresh</button>} />
          <div className="bg-white rounded-xl shadow-sm p-6">
            {jumlahPerKelas.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr><th className="px-3 py-2 text-left">Kode Kelas</th><th className="px-3 py-2 text-left">Matkul</th><th className="px-3 py-2 text-left">Kuota</th><th className="px-3 py-2 text-left">Peminat</th><th className="px-3 py-2 text-left">Utilization</th></tr></thead>
                <tbody>{jumlahPerKelas.map(stat => {
                  const k = kelas.find(kk => (kk.kelas_id || kk.id) === stat.id_kelas);
                  const kode = k?.kode_kelas || `#${stat.id_kelas}`;
                  const matkul = k ? getCourseName(k.course_id) : `Kelas #${stat.id_kelas}`;
                  const kuota = k?.kuota ?? 0;
                  const jml = stat.jumlah_mahasiswa ?? 0;     // PRS returns jumlah_mahasiswa
                  const pct = kuota > 0 ? Math.round((jml / kuota) * 100) : 0;
                  return (
                    <tr key={stat.id_kelas} className="border-b">
                      <td className="px-3 py-2 font-mono">{kode}</td>
                      <td className="px-3 py-2">{matkul}</td>
                      <td className="px-3 py-2">{kuota || '-'}</td>
                      <td className="px-3 py-2 font-medium">{jml}</td>
                      <td className="px-3 py-2"><div className="flex items-center gap-2"><div className="flex-1 bg-gray-200 rounded h-2 max-w-xs"><div className={`h-2 rounded ${pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div></div><span className="text-xs">{kuota > 0 ? `${pct}%` : '—'}</span></div></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            ) : <p className="text-gray-500">Klik refresh untuk load data</p>}
          </div>
        </div>
      )}

      {activeTab === 'krs-push' && (
        <div>
          <PageHeader title="Push Semester ke KRS" description="Generate KRS untuk mahasiswa tervalidasi" />
          <div className="bg-white rounded-xl shadow-sm p-6 max-w-xl">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm text-yellow-800">
              ⚠️ Generate KRS untuk SEMUA mahasiswa yang punya PRS tervalidasi di semester ini.
            </div>
            <label className="block text-sm font-medium mb-1">Semester</label>
            <select value={pushSemId} onChange={(e) => setPushSemId(e.target.value)} className="w-full px-3 py-2 border rounded mb-4">
              <option value="">-- Pilih Semester --</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.is_active ? '🟢 ' : ''}{s.name} {s.year}</option>)}
            </select>
            <button onClick={handlePushKrs} disabled={!pushSemId} className="w-full bg-blue-700 text-white py-2.5 rounded font-medium disabled:bg-gray-400">🚀 Push ke KRS</button>
          </div>
        </div>
      )}
    </Layout>
  );
}
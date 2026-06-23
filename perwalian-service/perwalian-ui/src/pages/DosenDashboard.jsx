import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import * as masterApi from '../api/master';
import * as penawaranApi from '../api/penawaran';
import * as perwalianApi from '../api/perwalian';
import * as transkripApi from '../api/transkrip';

// Navigasi Terpadu: Menggabungkan Master Data & Manajemen Perwalian Aktif
const TABS = [
  { id: 'units', label: 'Unit Akademik', icon: '🏛️' },
  { id: 'lecturers', label: 'Dosen', icon: '👨‍🏫' },
  { id: 'students', label: 'Mahasiswa', icon: '🎓' },
  { id: 'courses', label: 'Mata Kuliah', icon: '📚' },
  { id: 'semesters', label: 'Semester', icon: '📅' },
  { id: 'ruang', label: 'Ruang', icon: '🏫' },
  { id: 'kelas', label: 'Kelas', icon: '📖' },
  { id: 'dosen-wali', label: 'Assign Wali', icon: '👥' },
  { id: 'perwalian', label: 'Validasi Perwalian', icon: '✅' },
  { id: 'catatan', label: 'Catatan Bimbingan', icon: '📝' },
  { id: 'krs-push', label: 'Push KRS', icon: '🚀' },
];

export default function DosenDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('units');
  const [loading, setLoading] = useState(false);

  // ===== LIVE STATE DATA =====
  const [units, setUnits] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [ruang, setRuang] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [perwalians, setPerwalians] = useState([]);
  const [dosenWalis, setDosenWalis] = useState([]);
  const [catatans, setCatatans] = useState([]);
  const [selectedPerwalianId, setSelectedPerwalianId] = useState(null);

  // ===== FORMS STATE =====
  const [formUnit, setFormUnit] = useState({ unit_name: '', unit_type: 'study_program', parent_id: '' });
  const [formLecturer, setFormLecturer] = useState({ nip: '', name: '', email: '', password: '', status: 'active', unit_id: '' });
  const [formStudent, setFormStudent] = useState({ nrp: '', name: '', email: '', password: '', status: 'active', unit_id: '' });
  const [formCourse, setFormCourse] = useState({ course_code: '', course_name: '', sks: 3, unit_id: '' });
  const [formSemester, setFormSemester] = useState({ name: 'Gasal', year: '2025/2026', is_active: false });
  const [formRuang, setFormRuang] = useState({ nama_ruang: '', tipe: 'kelas', gedung: '', kapasitas: 40, status: 'active' });
  const [formKelas, setFormKelas] = useState({ course_id: '', semester_id: '', unit_id: '', kapasitas: 40, kelas_no: 'A' });
  const [formAssign, setFormAssign] = useState({ lecturer_id: '', student_id: '' });
  const [formPerwalian, setFormPerwalian] = useState({ dosen_wali_id: '', semester_id: '' });
  const [formCatatan, setFormCatatan] = useState({ perwalian_id: '', note_content: '' });
  const [pushSemId, setPushSemId] = useState('');

  // ===== HELPER FUNCTIONS (Mapped to live states) =====
  const getLecturerName = (id) => lecturers.find(l => l.id === id)?.name || `Lecturer #${id}`;
  const getStudentName = (id) => students.find(s => s.id === id)?.name || `Student #${id}`;
  const getStudentNrp = (id) => students.find(s => s.id === id)?.nrp || '-';
  const getSemesterName = (id) => {
    const s = semesters.find(sm => sm.id === id);
    return s ? `${s.name} ${s.year}` : `Semester #${id}`;
  };

  // Load all data on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [u, l, s, c, sm, r, k, p, dw] = await Promise.all([
          masterApi.getAllUnits().catch(() => []),
          masterApi.getAllLecturers().catch(() => []),
          masterApi.getAllStudents().catch(() => []),
          masterApi.getAllCourses().catch(() => []),
          masterApi.getAllSemesters().catch(() => []),
          penawaranApi.getAllRuang().catch(() => []),
          penawaranApi.getAllKelas().catch(() => []),
          perwalianApi.getAllPerwalian().catch(() => []),
          perwalianApi.getAllDosenWali().catch(() => []),
        ]);
        setUnits(u); setLecturers(l); setStudents(s); setCourses(c); setSemesters(sm);
        setRuang(r); setKelas(k); setPerwalians(p); setDosenWalis(dw);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Centralized Reload Handler
  const reload = async (key) => {
    try {
      if (key === 'units') setUnits(await masterApi.getAllUnits());
      if (key === 'lecturers') setLecturers(await masterApi.getAllLecturers());
      if (key === 'students') setStudents(await masterApi.getAllStudents());
      if (key === 'courses') setCourses(await masterApi.getAllCourses());
      if (key === 'semesters') setSemesters(await masterApi.getAllSemesters());
      if (key === 'ruang') setRuang(await penawaranApi.getAllRuang());
      if (key === 'kelas') setKelas(await penawaranApi.getAllKelas());
      if (key === 'dosen-wali') setDosenWalis(await perwalianApi.getAllDosenWali());
      if (key === 'perwalian') setPerwalians(await perwalianApi.getAllPerwalian());
    } catch (e) { console.error(e); }
  };

  const loadCatatan = async (perwalianId) => {
    if (!perwalianId) return;
    try {
      const data = await perwalianApi.getCatatanByPerwalian(perwalianId);
      setCatatans(data);
      setSelectedPerwalianId(perwalianId);
    } catch (e) { console.error(e); }
  };

  // ===== HANDLERS (Master & Penawaran) =====
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
        ...formKelas,
        course_id: parseInt(formKelas.course_id),
        semester_id: parseInt(formKelas.semester_id),
        unit_id: parseInt(formKelas.unit_id),
        kapasitas: parseInt(formKelas.kapasitas),
      });

      alert(res?.message || 'Berhasil ditambahkan');
      reload(type === 'unit' ? 'units' : type === 'lecturer' ? 'lecturers' : type === 'student' ? 'students' :
             type === 'course' ? 'courses' : type === 'semester' ? 'semesters' : type === 'ruang' ? 'ruang' : 'kelas');
    } catch (e) {
      alert('Error: ' + (e.response?.data?.message || e.message));
    }
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

  // ===== HANDLERS (Perwalian Services) =====
  const handleAssignDosenWali = async (e) => {
    e.preventDefault();
    try {
      const res = await perwalianApi.assignDosenWali({
        lecturer_id: parseInt(formAssign.lecturer_id),
        student_id: parseInt(formAssign.student_id),
      });
      alert(res.message || 'Berhasil melakukan assignment');
      setFormAssign({ lecturer_id: '', student_id: '' });
      reload('dosen-wali');
    } catch (e) {
      alert('Error: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleCreatePerwalian = async (e) => {
    e.preventDefault();
    try {
      const res = await perwalianApi.createPerwalian({
        dosen_wali_id: parseInt(formPerwalian.dosen_wali_id),
        semester_id: parseInt(formPerwalian.semester_id),
      });
      alert(res.message || 'Perwalian berhasil dibuat');
      setFormPerwalian({ dosen_wali_id: '', semester_id: '' });
      reload('perwalian');
    } catch (e) {
      alert('Error: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleValidate = async (id) => {
    try {
      const res = await perwalianApi.validatePerwalian(id);
      alert(res.message || 'Validasi sukses');
      reload('perwalian');
    } catch (e) { alert('Error: ' + e.message); }
  };

  const handleUnvalidate = async (id) => {
    try {
      const res = await perwalianApi.unvalidatePerwalian(id);
      alert(res.message || 'Batal validasi sukses');
      reload('perwalian');
    } catch (e) { alert('Error: ' + e.message); }
  };

  const handleCreateCatatan = async (e) => {
    e.preventDefault();
    try {
      const res = await perwalianApi.createCatatan({
        perwalian_id: parseInt(formCatatan.perwalian_id),
        note_content: formCatatan.note_content,
      });
      alert(res.message || 'Catatan bimbingan berhasil disimpan');
      setFormCatatan({ perwalian_id: '', note_content: '' });
      if (selectedPerwalianId) loadCatatan(selectedPerwalianId);
    } catch (e) {
      alert('Error: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleDeleteCatatan = async (id) => {
    if (!confirm('Yakin hapus catatan ini?')) return;
    try {
      await perwalianApi.deleteCatatan(id);
      if (selectedPerwalianId) loadCatatan(selectedPerwalianId);
    } catch (e) { alert('Error: ' + e.message); }
  };

  const handlePushKrs = async () => {
    if (!pushSemId) return alert('Pilih semester dulu');
    if (!confirm(`Push semester #${pushSemId} ke KRS untuk semua mahasiswa tervalidasi?`)) return;
    try {
      const res = await transkripApi.pushSemesterToKrs(parseInt(pushSemId));
      alert(res.message || `Push KRS: ${res.status}`);
    } catch (e) { alert('Error: ' + (e.response?.data?.message || e.message)); }
  };

  return (
    <Layout user={user} onLogout={onLogout} tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {loading && <p className="text-gray-500 mb-4">Loading...</p>}

      {/* UNITS */}
      {activeTab === 'units' && (
        <div>
          <PageHeader title="Unit Akademik" description="Fakultas, Program Studi, dll" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={(e) => handleCreate('unit', e)} className="bg-white rounded-lg shadow p-6 space-y-3">
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
              <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded">Tambah</button>
            </form>

            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Daftar Unit ({units.length})</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">Nama</th><th className="px-3 py-2 text-left">Tipe</th><th className="px-3 py-2 text-left">Aksi</th></tr>
                </thead>
                <tbody>
                  {units.map(u => (
                    <tr key={u.unit_id || u.id} className="border-b">
                      <td className="px-3 py-2 font-mono">{u.unit_id || u.id}</td>
                      <td className="px-3 py-2">{u.unit_name || u.name}</td>
                      <td className="px-3 py-2">{u.unit_type || u.type}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => handleDelete('unit', u.unit_id || u.id)} className="text-red-600 text-xs">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LECTURERS */}
      {activeTab === 'lecturers' && (
        <div>
          <PageHeader title="Dosen" description="Master data dosen" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={(e) => handleCreate('lecturer', e)} className="bg-white rounded-lg shadow p-6 space-y-3">
              <h3 className="font-semibold">Tambah Dosen</h3>
              <input value={formLecturer.nip} onChange={(e) => setFormLecturer({...formLecturer, nip: e.target.value})} placeholder="NIP" required className="w-full px-3 py-2 border rounded" />
              <input value={formLecturer.name} onChange={(e) => setFormLecturer({...formLecturer, name: e.target.value})} placeholder="Nama Lengkap" required className="w-full px-3 py-2 border rounded" />
              <input type="email" value={formLecturer.email} onChange={(e) => setFormLecturer({...formLecturer, email: e.target.value})} placeholder="Email" required className="w-full px-3 py-2 border rounded" />
              <input type="password" value={formLecturer.password} onChange={(e) => setFormLecturer({...formLecturer, password: e.target.value})} placeholder="Password" required className="w-full px-3 py-2 border rounded" />
              <select value={formLecturer.unit_id} onChange={(e) => setFormLecturer({...formLecturer, unit_id: e.target.value})} required className="w-full px-3 py-2 border rounded">
                <option value="">-- Pilih Unit --</option>
                {units.map(u => <option key={u.unit_id || u.id} value={u.unit_id || u.id}>{u.unit_name || u.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded">Tambah</button>
            </form>

            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Daftar Dosen ({lecturers.length})</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">NIP</th><th className="px-3 py-2 text-left">Nama</th><th className="px-3 py-2 text-left">Aksi</th></tr>
                </thead>
                <tbody>
                  {lecturers.map(l => (
                    <tr key={l.id} className="border-b">
                      <td className="px-3 py-2 font-mono">{l.id}</td>
                      <td className="px-3 py-2 font-mono">{l.nip}</td>
                      <td className="px-3 py-2">{l.name}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => handleDelete('lecturer', l.id)} className="text-red-600 text-xs">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STUDENTS */}
      {activeTab === 'students' && (
        <div>
          <PageHeader title="Mahasiswa" description="Master data mahasiswa" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={(e) => handleCreate('student', e)} className="bg-white rounded-lg shadow p-6 space-y-3">
              <h3 className="font-semibold">Tambah Mahasiswa</h3>
              <input value={formStudent.nrp} onChange={(e) => setFormStudent({...formStudent, nrp: e.target.value})} placeholder="NRP (e.g. C14230999)" required className="w-full px-3 py-2 border rounded" />
              <input value={formStudent.name} onChange={(e) => setFormStudent({...formStudent, name: e.target.value})} placeholder="Nama Lengkap" required className="w-full px-3 py-2 border rounded" />
              <input type="email" value={formStudent.email} onChange={(e) => setFormStudent({...formStudent, email: e.target.value})} placeholder="Email" required className="w-full px-3 py-2 border rounded" />
              <input type="password" value={formStudent.password} onChange={(e) => setFormStudent({...formStudent, password: e.target.value})} placeholder="Password" required className="w-full px-3 py-2 border rounded" />
              <select value={formStudent.unit_id} onChange={(e) => setFormStudent({...formStudent, unit_id: e.target.value})} required className="w-full px-3 py-2 border rounded">
                <option value="">-- Pilih Unit --</option>
                {units.map(u => <option key={u.unit_id || u.id} value={u.unit_id || u.id}>{u.unit_name || u.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded">Tambah</button>
            </form>

            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Daftar Mahasiswa ({students.length})</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">NRP</th><th className="px-3 py-2 text-left">Nama</th><th className="px-3 py-2 text-left">Aksi</th></tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className="border-b">
                      <td className="px-3 py-2 font-mono">{s.id}</td>
                      <td className="px-3 py-2 font-mono">{s.nrp}</td>
                      <td className="px-3 py-2">{s.name}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => handleDelete('student', s.id)} className="text-red-600 text-xs">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* COURSES */}
      {activeTab === 'courses' && (
        <div>
          <PageHeader title="Mata Kuliah" description="Daftar mata kuliah" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={(e) => handleCreate('course', e)} className="bg-white rounded-lg shadow p-6 space-y-3">
              <h3 className="font-semibold">Tambah Mata Kuliah</h3>
              <input value={formCourse.course_code} onChange={(e) => setFormCourse({...formCourse, course_code: e.target.value})} placeholder="Kode (e.g. IF1234)" required className="w-full px-3 py-2 border rounded" />
              <input value={formCourse.course_name} onChange={(e) => setFormCourse({...formCourse, course_name: e.target.value})} placeholder="Nama Matkul" required className="w-full px-3 py-2 border rounded" />
              <input type="number" value={formCourse.sks} onChange={(e) => setFormCourse({...formCourse, sks: e.target.value})} placeholder="SKS" min="1" max="6" required className="w-full px-3 py-2 border rounded" />
              <select value={formCourse.unit_id} onChange={(e) => setFormCourse({...formCourse, unit_id: e.target.value})} required className="w-full px-3 py-2 border rounded">
                <option value="">-- Pilih Unit --</option>
                {units.map(u => <option key={u.unit_id || u.id} value={u.unit_id || u.id}>{u.unit_name || u.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded">Tambah</button>
            </form>

            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Daftar Mata Kuliah ({courses.length})</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">Kode</th><th className="px-3 py-2 text-left">Nama</th><th className="px-3 py-2 text-left">SKS</th><th className="px-3 py-2 text-left">Aksi</th></tr></thead>
                <tbody>
                  {courses.map(c => (
                    <tr key={c.id} className="border-b">
                      <td className="px-3 py-2 font-mono">{c.id}</td>
                      <td className="px-3 py-2 font-mono">{c.course_code || c.code}</td>
                      <td className="px-3 py-2">{c.course_name || c.name}</td>
                      <td className="px-3 py-2">{c.sks}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => handleDelete('course', c.id)} className="text-red-600 text-xs">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SEMESTERS */}
      {activeTab === 'semesters' && (
        <div>
          <PageHeader title="Semester Akademik" description="Periode semester" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={(e) => handleCreate('semester', e)} className="bg-white rounded-lg shadow p-6 space-y-3">
              <h3 className="font-semibold">Tambah Semester</h3>
              <select value={formSemester.name} onChange={(e) => setFormSemester({...formSemester, name: e.target.value})} className="w-full px-3 py-2 border rounded">
                <option value="Gasal">Gasal</option>
                <option value="Genap">Genap</option>
                <option value="Pendek">Pendek</option>
              </select>
              <input value={formSemester.year} onChange={(e) => setFormSemester({...formSemester, year: e.target.value})} placeholder="Tahun (e.g. 2025/2026)" required className="w-full px-3 py-2 border rounded" />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formSemester.is_active} onChange={(e) => setFormSemester({...formSemester, is_active: e.target.checked})} />
                <span className="text-sm">Set sebagai semester aktif</span>
              </label>
              <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded">Tambah</button>
            </form>

            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Daftar Semester ({semesters.length})</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">Nama</th><th className="px-3 py-2 text-left">Tahun</th><th className="px-3 py-2 text-left">Status</th></tr></thead>
                <tbody>
                  {semesters.map(s => (
                    <tr key={s.id} className="border-b">
                      <td className="px-3 py-2 font-mono">{s.id}</td>
                      <td className="px-3 py-2">{s.name}</td>
                      <td className="px-3 py-2">{s.year}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {s.is_active ? '🟢 Active' : '⚫ Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RUANG */}
      {activeTab === 'ruang' && (
        <div>
          <PageHeader title="Ruang" description="Master data ruang perkuliahan" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={(e) => handleCreate('ruang', e)} className="bg-white rounded-lg shadow p-6 space-y-3">
              <h3 className="font-semibold">Tambah Ruang</h3>
              <input value={formRuang.nama_ruang} onChange={(e) => setFormRuang({...formRuang, nama_ruang: e.target.value})} placeholder="Nama Ruang (P-101)" required className="w-full px-3 py-2 border rounded" />
              <input value={formRuang.gedung} onChange={(e) => setFormRuang({...formRuang, gedung: e.target.value})} placeholder="Gedung" required className="w-full px-3 py-2 border rounded" />
              <select value={formRuang.tipe} onChange={(e) => setFormRuang({...formRuang, tipe: e.target.value})} className="w-full px-3 py-2 border rounded">
                <option value="kelas">Kelas</option>
                <option value="lab">Lab</option>
                <option value="auditorium">Auditorium</option>
              </select>
              <input type="number" value={formRuang.kapasitas} onChange={(e) => setFormRuang({...formRuang, kapasitas: e.target.value})} placeholder="Kapasitas" required className="w-full px-3 py-2 border rounded" />
              <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded">Tambah</button>
            </form>

            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Daftar Ruang ({ruang.length})</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">Nama</th><th className="px-3 py-2 text-left">Gedung</th><th className="px-3 py-2 text-left">Tipe</th><th className="px-3 py-2 text-left">Kapasitas</th><th className="px-3 py-2 text-left">Aksi</th></tr></thead>
                <tbody>
                  {ruang.map(r => (
                    <tr key={r.id || r.ruang_id} className="border-b">
                      <td className="px-3 py-2 font-mono">{r.id || r.ruang_id}</td>
                      <td className="px-3 py-2">{r.nama_ruang}</td>
                      <td className="px-3 py-2">{r.gedung}</td>
                      <td className="px-3 py-2">{r.tipe}</td>
                      <td className="px-3 py-2">{r.kapasitas}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => handleDelete('ruang', r.id || r.ruang_id)} className="text-red-600 text-xs">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* KELAS */}
      {activeTab === 'kelas' && (
        <div>
          <PageHeader title="Kelas" description="Penawaran kelas per semester" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={(e) => handleCreate('kelas', e)} className="bg-white rounded-lg shadow p-6 space-y-3">
              <h3 className="font-semibold">Tambah Kelas</h3>
              <select value={formKelas.course_id} onChange={(e) => setFormKelas({...formKelas, course_id: e.target.value})} required className="w-full px-3 py-2 border rounded">
                <option value="">-- Pilih Mata Kuliah --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.course_code || c.code} - {c.course_name || c.name}</option>)}
              </select>
              <select value={formKelas.semester_id} onChange={(e) => setFormKelas({...formKelas, semester_id: e.target.value})} required className="w-full px-3 py-2 border rounded">
                <option value="">-- Pilih Semester --</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name} {s.year}</option>)}
              </select>
              <select value={formKelas.unit_id} onChange={(e) => setFormKelas({...formKelas, unit_id: e.target.value})} required className="w-full px-3 py-2 border rounded">
                <option value="">-- Pilih Unit --</option>
                {units.map(u => <option key={u.unit_id || u.id} value={u.unit_id || u.id}>{u.unit_name || u.name}</option>)}
              </select>
              <input value={formKelas.kelas_no} onChange={(e) => setFormKelas({...formKelas, kelas_no: e.target.value})} placeholder="No. Kelas (A/B/C)" required className="w-full px-3 py-2 border rounded" />
              <input type="number" value={formKelas.kapasitas} onChange={(e) => setFormKelas({...formKelas, kapasitas: e.target.value})} placeholder="Kapasitas" required className="w-full px-3 py-2 border rounded" />
              <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded">Tambah</button>
            </form>

            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Daftar Kelas ({kelas.length})</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">Course</th><th className="px-3 py-2 text-left">Semester</th><th className="px-3 py-2 text-left">Kelas</th><th className="px-3 py-2 text-left">Kap.</th><th className="px-3 py-2 text-left">Aksi</th></tr></thead>
                <tbody>
                  {kelas.map(k => (
                    <tr key={k.id || k.kelas_id} className="border-b">
                      <td className="px-3 py-2 font-mono">{k.id || k.kelas_id}</td>
                      <td className="px-3 py-2">#{k.course_id}</td>
                      <td className="px-3 py-2">#{k.semester_id}</td>
                      <td className="px-3 py-2">{k.kelas_no}</td>
                      <td className="px-3 py-2">{k.kapasitas}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => handleDelete('kelas', k.id || k.kelas_id)} className="text-red-600 text-xs">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== PILIHAN PINDAHAN BARU: TAB DOSEN WALI (ASSIGN WALI) ===== */}
      {activeTab === 'dosen-wali' && (
        <div>
          <PageHeader title="Assign Dosen Wali" description="Pasangkan Dosen Pembimbing akademik dengan Mahasiswa bimbingannya" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold mb-4">Assign Dosen Wali Baru</h3>
              <form onSubmit={handleAssignDosenWali} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Dosen</label>
                  <select
                    value={formAssign.lecturer_id}
                    onChange={(e) => setFormAssign({...formAssign, lecturer_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500 text-sm"
                    required
                  >
                    <option value="">-- Pilih Dosen --</option>
                    {lecturers.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.nip})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mahasiswa</label>
                  <select
                    value={formAssign.student_id}
                    onChange={(e) => setFormAssign({...formAssign, student_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500 text-sm"
                    required
                  >
                    <option value="">-- Pilih Mahasiswa --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.nrp})</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
                  Assign Relationship
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold mb-4">Daftar Hubungan Dosen Wali ({dosenWalis.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">ID</th>
                      <th className="px-3 py-2 text-left">Dosen Wali</th>
                      <th className="px-3 py-2 text-left">Mahasiswa Bimbingan</th>
                      <th className="px-3 py-2 text-left">Waktu Assign</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dosenWalis.map(dw => (
                      <tr key={dw.id} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono">{dw.id}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{getLecturerName(dw.lecturer_id)}</div>
                          <div className="text-xs text-gray-500">Lecturer ID: {dw.lecturer_id}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{getStudentName(dw.student_id)}</div>
                          <div className="text-xs text-gray-500">NRP: {getStudentNrp(dw.student_id)}</div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600">{dw.assigned_at || '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${dw.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {dw.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {dosenWalis.length === 0 && (
                      <tr><td colSpan="5" className="px-3 py-8 text-center text-gray-500">Belum ada relasi dosen wali terekam</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== PILIHAN PINDAHAN BARU: TAB PERWALIAN (INTERACTIVE VALIDATION) ===== */}
      {activeTab === 'perwalian' && (
        <div>
          <PageHeader title="Manajemen Validasi Perwalian" description="Buka sesi perwalian mahasiswa dan berikan validasi PRS disetiap semesternya" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-5 shadow">
              <p className="opacity-80 text-xs">Total Relasi Wali</p>
              <p className="text-2xl font-bold mt-1">{dosenWalis.length}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg p-5 shadow">
              <p className="opacity-80 text-xs">Total Sesi Perwalian</p>
              <p className="text-2xl font-bold mt-1">{perwalians.length}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-5 shadow">
              <p className="opacity-80 text-xs">Sesi Tervalidasi (Boleh PRS)</p>
              <p className="text-2xl font-bold mt-1">{perwalians.filter(p => p.is_prs_allowed).length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold mb-4">Buat Sesi Perwalian Baru</h3>
              <form onSubmit={handleCreatePerwalian} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Dosen Wali (Relasi)</label>
                  <select
                    value={formPerwalian.dosen_wali_id}
                    onChange={(e) => setFormPerwalian({...formPerwalian, dosen_wali_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500 text-sm"
                    required
                  >
                    <option value="">-- Pilih Pasangan Hubungan --</option>
                    {dosenWalis.map(dw => (
                      <option key={dw.id} value={dw.id}>
                        #{dw.id} - {getLecturerName(dw.lecturer_id)} → {getStudentName(dw.student_id)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Semester</label>
                  <select
                    value={formPerwalian.semester_id}
                    onChange={(e) => setFormPerwalian({...formPerwalian, semester_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500 text-sm"
                    required
                  >
                    <option value="">-- Pilih Semester Terkait --</option>
                    {semesters.map(s => (
                      <option key={s.id} value={s.id}>{s.is_active ? '🟢 ' : ''}{s.name} {s.year}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 text-sm font-medium">
                  Inisialisasi Sesi Perwalian
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold mb-4">Daftar Validasi Sesi Perwalian ({perwalians.length})</h3>
              <div className="space-y-2.5">
                {perwalians.map(p => {
                  const dw = dosenWalis.find(d => d.id === p.dosen_wali_id);
                  return (
                    <div key={p.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">ID Sesi #{p.id}</span>
                            <span className="text-sm font-medium text-slate-600">{getSemesterName(p.semester_id)}</span>
                          </div>
                          {dw && (
                            <p className="text-sm font-semibold text-slate-800 mt-1.5">
                              {getLecturerName(dw.lecturer_id)} <span className="text-slate-400 font-normal">→</span> {getStudentName(dw.student_id)}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-slate-500">Status Validasi:</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.is_prs_allowed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {p.is_prs_allowed ? '✓ Tervalidasi (Boleh Isi PRS)' : '⏳ Belum Valid'}
                            </span>
                          </div>
                          {p.validated_at && <p className="text-[10px] text-gray-400 mt-1">Disetujui pada: {p.validated_at}</p>}
                        </div>
                        <div className="flex sm:flex-col lg:flex-row gap-2 self-end sm:self-center">
                          {!p.is_prs_allowed ? (
                            <button onClick={() => handleValidate(p.id)} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 font-medium">
                              Validasi
                            </button>
                          ) : (
                            <button onClick={() => handleUnvalidate(p.id)} className="px-3 py-1.5 text-xs bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium">
                              Batal Validasi
                            </button>
                          )}
                          <button onClick={() => { setActiveTab('catatan'); loadCatatan(p.id); }} className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 font-medium">
                            Tulis/Lihat Catatan
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {perwalians.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">Belum ada sesi bimbingan perwalian yang dibuat</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== PILIHAN PINDAHAN BARU: TAB CATATAN BIMBINGAN ===== */}
      {activeTab === 'catatan' && (
        <div>
          <PageHeader title="Catatan Bimbingan Akademik" description="Dokumentasikan riwayat konsultasi dan kendala akademik mahasiswa wali disini" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Buat Catatan Konsultasi Baru</h3>
                <form onSubmit={handleCreateCatatan} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Pilih Sesi Perwalian</label>
                    <select
                      value={formCatatan.perwalian_id}
                      onChange={(e) => setFormCatatan({...formCatatan, perwalian_id: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500 text-sm"
                      required
                    >
                      <option value="">-- Pilih Sesi Perwalian --</option>
                      {perwalians.map(p => {
                        const dw = dosenWalis.find(d => d.id === p.dosen_wali_id);
                        return (
                          <option key={p.id} value={p.id}>
                          {dw ? getStudentName(dw.student_id) : '-'} ({getSemesterName(p.semester_id)})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Isi Catatan Bimbingan</label>
                    <textarea
                      value={formCatatan.note_content}
                      onChange={(e) => setFormCatatan({...formCatatan, note_content: e.target.value})}
                      rows={5}
                      placeholder="Contoh: Mahasiswa berencana mengambil 24 SKS, IPK memadai, kendala pada matkul prasyarat..."
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500 text-sm"
                      required
                    />
                  </div>
                  <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 text-sm font-medium">
                    Simpan Catatan Bimbingan
                  </button>
                </form>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Filter Riwayat Catatan:</label>
                <select
                  value={selectedPerwalianId || ''}
                  onChange={(e) => loadCatatan(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded text-sm bg-slate-50"
                >
                  <option value="">-- Pilih Sesi Perwalian Mahasiswa --</option>
                  {perwalians.map(p => {
                    const dw = dosenWalis.find(d => d.id === p.dosen_wali_id);
                    return (
                      <option key={p.id} value={p.id}>
                      {dw ? getStudentName(dw.student_id) : '-'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold mb-4">
                Riwayat Rekam Medis Akademik {selectedPerwalianId && `(Sesi Perwalian #${selectedPerwalianId})`}
              </h3>
              <div className="space-y-3">
                {catatans.map(c => (
                  <div key={c.id} className="border border-slate-100 rounded-lg p-4 bg-slate-50 relative hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded font-medium">Tanggal: {c.perwalian_date || 'Hari ini'}</span>
                      <button onClick={() => handleDeleteCatatan(c.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">
                        Hapus Catatan
                      </button>
                    </div>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{c.note_content}</p>
                  </div>
                ))}
                {catatans.length === 0 && (
                  <p className="text-center text-gray-400 py-12 text-sm border-2 border-dashed border-slate-100 rounded-lg">
                    {selectedPerwalianId ? 'Belum ada catatan bimbingan tersimpan pada sesi ini' : 'Silakan pilih atau filter berdasarkan Sesi Perwalian Mahasiswa terlebih dahulu untuk melihat histori bimbingan'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PUSH KRS */}
      {activeTab === 'krs-push' && (
        <div>
          <PageHeader title="Push Semester ke KRS" description="Generate KRS otomatis untuk mahasiswa dengan PRS tervalidasi" />
          <div className="bg-white rounded-lg shadow p-6 max-w-xl">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm text-yellow-800">
              ⚠️ Aksi ini akan generate KRS untuk SEMUA mahasiswa yang punya PRS tervalidasi di semester ini. Pastikan validasi sudah selesai.
            </div>
            <label className="block text-sm font-medium mb-1">Semester</label>
            <select value={pushSemId} onChange={(e) => setPushSemId(e.target.value)} className="w-full px-3 py-2 border rounded mb-4">
              <option value="">-- Pilih Semester --</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.is_active ? '🟢 ' : ''}{s.name} {s.year}</option>)}
            </select>
            <button onClick={handlePushKrs} disabled={!pushSemId} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded font-medium disabled:bg-gray-400">
              🚀 Push Semester ke KRS
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
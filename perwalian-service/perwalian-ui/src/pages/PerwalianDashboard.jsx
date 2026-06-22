import { useState, useEffect } from 'react';
import * as api from '../api/perwalian';
import { LECTURERS, STUDENTS, SEMESTERS } from '../data/masterReference';

export default function PerwalianDashboard() {
  // ===== STATE =====
  const [activeTab, setActiveTab] = useState('dosen-wali');
  const [dosenWalis, setDosenWalis] = useState([]);
  const [perwalians, setPerwalians] = useState([]);
  const [catatans, setCatatans] = useState([]);
  const [selectedPerwalianId, setSelectedPerwalianId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Master data (static)
  const lecturers = LECTURERS;
  const students = STUDENTS;
  const semesters = SEMESTERS;

  // Form inputs
  const [formAssign, setFormAssign] = useState({ lecturer_id: '', student_id: '' });
  const [formPerwalian, setFormPerwalian] = useState({ dosen_wali_id: '', semester_id: '' });
  const [formCatatan, setFormCatatan] = useState({ perwalian_id: '', note_content: '' });

  // ===== HELPER FUNCTIONS =====
  const getLecturerName = (id) => lecturers.find(l => l.id === id)?.name || `Lecturer #${id}`;
  const getStudentName = (id) => students.find(s => s.id === id)?.name || `Student #${id}`;
  const getStudentNrp = (id) => students.find(s => s.id === id)?.nrp || '-';
  const getSemesterName = (id) => {
    const s = semesters.find(s => s.id === id);
    return s ? `${s.name} ${s.year}` : `Semester #${id}`;
  };

  // ===== LOAD DATA =====
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [dwData, pData] = await Promise.all([
          api.getAllDosenWali(),
          api.getAllPerwalian(),
        ]);
        setDosenWalis(dwData);
        setPerwalians(pData);
      } catch (e) {
        console.error('Error loading data:', e);
        alert('Error loading data: ' + e.message);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const loadDosenWalis = async () => {
    try {
      const data = await api.getAllDosenWali();
      setDosenWalis(data);
    } catch (e) { console.error(e); }
  };

  const loadPerwalians = async () => {
    try {
      const data = await api.getAllPerwalian();
      setPerwalians(data);
    } catch (e) { console.error(e); }
  };

  const loadCatatan = async (perwalianId) => {
    if (!perwalianId) return;
    try {
      const data = await api.getCatatanByPerwalian(perwalianId);
      setCatatans(data);
      setSelectedPerwalianId(perwalianId);
    } catch (e) { console.error(e); }
  };

  // ===== HANDLERS =====
  const handleAssignDosenWali = async (e) => {
    e.preventDefault();
    try {
      const res = await api.assignDosenWali({
        lecturer_id: parseInt(formAssign.lecturer_id),
        student_id: parseInt(formAssign.student_id),
      });
      alert(res.message || 'Success');
      setFormAssign({ lecturer_id: '', student_id: '' });
      loadDosenWalis();
    } catch (e) {
      alert('Error: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleCreatePerwalian = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createPerwalian({
        dosen_wali_id: parseInt(formPerwalian.dosen_wali_id),
        semester_id: parseInt(formPerwalian.semester_id),
      });
      alert(res.message || 'Success');
      setFormPerwalian({ dosen_wali_id: '', semester_id: '' });
      loadPerwalians();
    } catch (e) {
      alert('Error: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleValidate = async (id) => {
    try {
      const res = await api.validatePerwalian(id);
      alert(res.message || 'Success');
      loadPerwalians();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const handleUnvalidate = async (id) => {
    try {
      const res = await api.unvalidatePerwalian(id);
      alert(res.message || 'Success');
      loadPerwalians();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const handleCreateCatatan = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createCatatan({
        perwalian_id: parseInt(formCatatan.perwalian_id),
        note_content: formCatatan.note_content,
      });
      alert(res.message || 'Success');
      setFormCatatan({ perwalian_id: '', note_content: '' });
      if (selectedPerwalianId) loadCatatan(selectedPerwalianId);
    } catch (e) {
      alert('Error: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleDeleteCatatan = async (id) => {
    if (!confirm('Yakin hapus catatan ini?')) return;
    try {
      await api.deleteCatatan(id);
      if (selectedPerwalianId) loadCatatan(selectedPerwalianId);
    } catch (e) { alert('Error: ' + e.message); }
  };

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Perwalian Service Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Standalone version — data referensi dari static dataset</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {['dosen-wali', 'perwalian', 'catatan', 'referensi'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'dosen-wali' && 'Dosen Wali'}
              {tab === 'perwalian' && 'Perwalian'}
              {tab === 'catatan' && 'Catatan Bimbingan'}
              {tab === 'referensi' && 'Referensi Master'}
            </button>
          ))}
        </div>

        {loading && <p className="text-gray-500 mb-4">Loading...</p>}

        {/* ===== TAB DOSEN WALI ===== */}
        {activeTab === 'dosen-wali' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Assign Dosen Wali</h2>
              <form onSubmit={handleAssignDosenWali} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Dosen</label>
                  <select
                    value={formAssign.lecturer_id}
                    onChange={(e) => setFormAssign({...formAssign, lecturer_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Pilih Dosen --</option>
                    {lecturers.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.nip})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mahasiswa</label>
                  <select
                    value={formAssign.student_id}
                    onChange={(e) => setFormAssign({...formAssign, student_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Pilih Mahasiswa --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.nrp})
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                  Assign
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Daftar Dosen Wali ({dosenWalis.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">ID</th>
                      <th className="px-3 py-2 text-left">Dosen</th>
                      <th className="px-3 py-2 text-left">Mahasiswa</th>
                      <th className="px-3 py-2 text-left">Assigned</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dosenWalis.map(dw => (
                      <tr key={dw.id} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2">{dw.id}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{getLecturerName(dw.lecturer_id)}</div>
                          <div className="text-xs text-gray-500">ID: {dw.lecturer_id}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{getStudentName(dw.student_id)}</div>
                          <div className="text-xs text-gray-500">{getStudentNrp(dw.student_id)}</div>
                        </td>
                        <td className="px-3 py-2">{dw.assigned_at}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            dw.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {dw.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {dosenWalis.length === 0 && (
                      <tr><td colSpan="5" className="px-3 py-8 text-center text-gray-500">Belum ada data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB PERWALIAN ===== */}
        {activeTab === 'perwalian' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Buat Perwalian</h2>
              <form onSubmit={handleCreatePerwalian} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Dosen Wali</label>
                  <select
                    value={formPerwalian.dosen_wali_id}
                    onChange={(e) => setFormPerwalian({...formPerwalian, dosen_wali_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Pilih Dosen Wali --</option>
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
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Pilih Semester --</option>
                    {semesters.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.is_active ? '🟢 ' : ''}{s.name} {s.year}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                  Buat
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Daftar Perwalian ({perwalians.length})</h2>
              <div className="space-y-2">
                {perwalians.map(p => {
                  const dw = dosenWalis.find(d => d.id === p.dosen_wali_id);
                  return (
                    <div key={p.id} className="border rounded p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Perwalian #{p.id}</p>
                          {dw && (
                            <p className="text-sm text-gray-700 mt-1">
                              {getLecturerName(dw.lecturer_id)} → {getStudentName(dw.student_id)}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            {getSemesterName(p.semester_id)}
                          </p>
                          <p className="text-sm mt-1">
                            Status:{' '}
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              p.is_prs_allowed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {p.is_prs_allowed ? '✓ Tervalidasi (Boleh PRS)' : '⏳ Belum Tervalidasi'}
                            </span>
                          </p>
                          {p.validated_at && (
                            <p className="text-xs text-gray-500 mt-1">Validated: {p.validated_at}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {!p.is_prs_allowed ? (
                            <button onClick={() => handleValidate(p.id)} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                              Validasi
                            </button>
                          ) : (
                            <button onClick={() => handleUnvalidate(p.id)} className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700">
                              Batal Validasi
                            </button>
                          )}
                          <button onClick={() => { setActiveTab('catatan'); loadCatatan(p.id); }} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                            Lihat Catatan
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {perwalians.length === 0 && (
                  <p className="text-center text-gray-500 py-8">Belum ada perwalian</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB CATATAN ===== */}
        {activeTab === 'catatan' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Buat Catatan</h2>
              <form onSubmit={handleCreateCatatan} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Perwalian</label>
                  <select
                    value={formCatatan.perwalian_id}
                    onChange={(e) => setFormCatatan({...formCatatan, perwalian_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Pilih Perwalian --</option>
                    {perwalians.map(p => {
                      const dw = dosenWalis.find(d => d.id === p.dosen_wali_id);
                      return (
                        <option key={p.id} value={p.id}>
                          #{p.id} - {dw ? getStudentName(dw.student_id) : '-'} ({getSemesterName(p.semester_id)})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Isi Catatan</label>
                  <textarea
                    value={formCatatan.note_content}
                    onChange={(e) => setFormCatatan({...formCatatan, note_content: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                  Simpan
                </button>
              </form>

              <div className="mt-4 pt-4 border-t">
                <label className="block text-sm font-medium mb-1">Filter berdasarkan Perwalian:</label>
                <select
                  value={selectedPerwalianId || ''}
                  onChange={(e) => loadCatatan(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">-- Pilih Perwalian --</option>
                  {perwalians.map(p => {
                    const dw = dosenWalis.find(d => d.id === p.dosen_wali_id);
                    return (
                      <option key={p.id} value={p.id}>
                        #{p.id} - {dw ? getStudentName(dw.student_id) : '-'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">
                Catatan {selectedPerwalianId && `(Perwalian #${selectedPerwalianId})`}
              </h2>
              <div className="space-y-3">
                {catatans.map(c => (
                  <div key={c.id} className="border rounded p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs text-gray-500">{c.perwalian_date}</p>
                      <button onClick={() => handleDeleteCatatan(c.id)} className="text-red-600 hover:text-red-800 text-xs">
                        Hapus
                      </button>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{c.note_content}</p>
                  </div>
                ))}
                {catatans.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    {selectedPerwalianId ? 'Belum ada catatan' : 'Pilih perwalian dulu'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB REFERENSI ===== */}
        {activeTab === 'referensi' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                📌 <strong>Data referensi statis</strong> — gunakan ID di bawah untuk assign dosen wali atau buat perwalian. Update file <code>src/data/masterReference.js</code> kalau data Master berubah.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">📚 Daftar Dosen ({lecturers.length})</h2>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">NIP</th>
                    <th className="px-3 py-2 text-left">Nama</th>
                    <th className="px-3 py-2 text-left">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {lecturers.map(l => (
                    <tr key={l.id} className="border-b">
                      <td className="px-3 py-2 font-mono text-blue-600">{l.id}</td>
                      <td className="px-3 py-2 font-mono">{l.nip}</td>
                      <td className="px-3 py-2">{l.name}</td>
                      <td className="px-3 py-2 text-gray-600">{l.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">🎓 Daftar Mahasiswa ({students.length})</h2>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">NRP</th>
                    <th className="px-3 py-2 text-left">Nama</th>
                    <th className="px-3 py-2 text-left">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className="border-b">
                      <td className="px-3 py-2 font-mono text-green-600">{s.id}</td>
                      <td className="px-3 py-2 font-mono">{s.nrp}</td>
                      <td className="px-3 py-2">{s.name}</td>
                      <td className="px-3 py-2 text-gray-600">{s.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">📅 Daftar Semester ({semesters.length})</h2>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Nama</th>
                    <th className="px-3 py-2 text-left">Tahun</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {semesters.map(s => (
                    <tr key={s.id} className="border-b">
                      <td className="px-3 py-2 font-mono text-purple-600">{s.id}</td>
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
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import * as masterApi from '../api/master';
import * as perwalianApi from '../api/perwalian';
import * as transkripApi from '../api/transkrip';
import * as penawaranApi from '../api/penawaran';
import * as prsApi from '../api/prs';

const TABS = [
  { id: 'profile', label: 'Profile Saya', icon: '👤' },
  { id: 'perwalian', label: 'Dosen Wali', icon: '👨‍🏫' },
  { id: 'prs', label: 'PRS Saya', icon: '📝' },
  { id: 'krs', label: 'KRS', icon: '📋' },
  { id: 'khs', label: 'KHS', icon: '📊' },
  { id: 'transkrip', label: 'Transkrip', icon: '📜' },
  { id: 'kelas', label: 'Kelas Tersedia', icon: '🏫' },
];

export default function MahasiswaDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState(null);
  const [dosenWali, setDosenWali] = useState(null);
  const [krs, setKrs] = useState(null);
  const [transkrip, setTranskrip] = useState(null);
  const [ips, setIps] = useState(null);
  const [ipk, setIpk] = useState(null);
  const [khsSemester, setKhsSemester] = useState({ tahun_ajaran: '2025-2026', semester: 'Ganjil' });
  const [khs, setKhs] = useState(null);
  const [kelasTersedia, setKelasTersedia] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [activeSemId, setActiveSemId] = useState('');

  // PRS state
  const [prsSemId, setPrsSemId] = useState('');
  const [prsData, setPrsData] = useState(null);
  const [prsDetail, setPrsDetail] = useState([]);
  const [formPrsDetail, setFormPrsDetail] = useState({ id_kelas: '', id_mata_kuliah: '', sks: 3, prioritas: 1 });

  const studentId = user.user_id;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profileData, semestersData] = await Promise.all([
          masterApi.getStudentById(studentId).catch(() => null),
          masterApi.getAllSemesters().catch(() => []),
        ]);
        setProfile(profileData?.data || profileData);
        setSemesters(semestersData);
        const active = semestersData.find(s => s.is_active);
        if (active) {
          setActiveSemId(active.id);
          setPrsSemId(active.id);
        }
        const dw = await perwalianApi.getLecturerByStudent(studentId).catch(() => null);
        setDosenWali(dw);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [studentId]);

  useEffect(() => {
    const loadTab = async () => {
      try {
        if (activeTab === 'krs' && !krs) {
          setKrs(await transkripApi.getKrs(studentId));
        }
        if (activeTab === 'transkrip' && !transkrip) {
          const [t, i, k] = await Promise.all([
            transkripApi.getTranskrip(studentId).catch(() => null),
            transkripApi.getIps(studentId).catch(() => null),
            transkripApi.getIpk(studentId).catch(() => null),
          ]);
          setTranskrip(t); setIps(i); setIpk(k);
        }
      } catch (e) { console.error(e); }
    };
    loadTab();
  }, [activeTab, studentId, krs, transkrip]);

  const loadPrs = async () => {
    if (!prsSemId) return;
    setLoading(true);
    try {
      const res = await prsApi.getPrs(studentId, prsSemId);
      if (res.success && res.data) {
        setPrsData(res.data);
        const idPrs = res.data.id_prs || res.data.prs?.id_prs;
        if (idPrs) {
          const det = await prsApi.getPrsDetail(idPrs).catch(() => ({ data: [] }));
          setPrsDetail(det.data || []);
        }
      } else {
        setPrsData(null);
        setPrsDetail([]);
      }
    } catch (e) {
      setPrsData(null);
      setPrsDetail([]);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'prs' && prsSemId) loadPrs();
  }, [activeTab, prsSemId]);

  const loadKelas = async () => {
    if (!activeSemId) return;
    setLoading(true);
    try {
      const k = await penawaranApi.getKelasTersedia(activeSemId).catch(() => []);
      setKelasTersedia(Array.isArray(k) ? k : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if ((activeTab === 'kelas' || activeTab === 'prs') && activeSemId && kelasTersedia.length === 0) {
      loadKelas();
    }
  }, [activeTab, activeSemId]);

  const handleCreatePrs = async () => {
    if (!prsSemId) return alert('Pilih semester dulu');
    const dosenWaliId = dosenWali?.data?.dosen_wali_id;
    if (!dosenWaliId) {
      alert('Anda belum punya dosen wali. Tab "Dosen Wali" → minta admin assign.');
      return;
    }
    try {
      const res = await prsApi.createPrs({
        id_mahasiswa: studentId,
        id_semester: parseInt(prsSemId),
        dosen_wali_id: dosenWaliId,
      });
      if (res.success) {
        alert('PRS berhasil dibuat. Sekarang tambah mata kuliah.');
        loadPrs();
      } else {
        alert('Error: ' + (res.error || 'Gagal create PRS'));
      }
    } catch (e) {
      alert('Error: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleAddDetail = async (e) => {
    e.preventDefault();
    const idPrs = prsData?.id_prs || prsData?.prs?.id_prs;
    if (!idPrs) return alert('Buat PRS dulu');
    try {
      const res = await prsApi.createPrsDetail(idPrs, {
        id_kelas: parseInt(formPrsDetail.id_kelas),
        id_mata_kuliah: parseInt(formPrsDetail.id_mata_kuliah),
        sks: parseInt(formPrsDetail.sks),
        prioritas: parseInt(formPrsDetail.prioritas),
      });
      if (res.success) {
        alert('Mata kuliah ditambahkan');
        setFormPrsDetail({ id_kelas: '', id_mata_kuliah: '', sks: 3, prioritas: 1 });
        loadPrs();
      } else {
        alert('Error: ' + (res.error || 'Gagal'));
      }
    } catch (e) {
      alert('Error: ' + (e.response?.data?.error || e.message));
    }
  };

  const loadKhs = async () => {
    if (!khsSemester.tahun_ajaran || !khsSemester.semester) return;
    setLoading(true);
    try {
      setKhs(await transkripApi.getKhs(studentId, khsSemester.semester, khsSemester.tahun_ajaran));
    } catch (e) { alert('Error: ' + (e.response?.data?.message || e.message)); }
    finally { setLoading(false); }
  };

  return (
    <Layout user={user} onLogout={onLogout} tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {loading && <p className="text-gray-500 mb-4">Loading...</p>}

      {activeTab === 'profile' && (
        <div>
          <PageHeader title="Profile Saya" description="Informasi akun mahasiswa" />
          <div className="bg-white rounded-xl shadow-sm p-6 max-w-xl">
            {profile ? (
              <dl className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <dt className="font-medium text-gray-700">User ID</dt>
                  <dd className="font-mono">{profile.id || profile.student_id || studentId}</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="font-medium text-gray-700">NRP</dt>
                  <dd className="font-mono">{profile.nrp || profile.student_nrp || '-'}</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="font-medium text-gray-700">Nama</dt>
                  <dd>{profile.name || profile.student_name || profile.nama || '-'}</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="font-medium text-gray-700">Email</dt>
                  <dd>{profile.email || profile.student_email || '-'}</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="font-medium text-gray-700">Status</dt>
                  <dd>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      {profile.status || profile.student_status || 'active'}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-700">Unit ID</dt>
                  <dd>{profile.unit_id || profile.id_unit || '-'}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-gray-500">Profile tidak ditemukan (user_id: {studentId})</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'perwalian' && (
        <div>
          <PageHeader title="Dosen Wali Saya" description="Informasi dosen pembimbing akademik" />
          <div className="bg-white rounded-xl shadow-sm p-6 max-w-xl">
            {dosenWali?.status === 'success' && dosenWali.data ? (
              <dl className="space-y-3">
                <div className="flex justify-between border-b pb-2"><dt className="font-medium text-gray-700">Dosen Wali ID</dt><dd className="font-mono">#{dosenWali.data.dosen_wali_id}</dd></div>
                <div className="flex justify-between border-b pb-2"><dt className="font-medium text-gray-700">Lecturer ID</dt><dd className="font-mono">{dosenWali.data.lecturer_id}</dd></div>
                {dosenWali.data.lecturer_data && (
                  <>
                    <div className="flex justify-between border-b pb-2"><dt className="font-medium text-gray-700">NIP</dt><dd className="font-mono">{dosenWali.data.lecturer_data.nip}</dd></div>
                    <div className="flex justify-between border-b pb-2"><dt className="font-medium text-gray-700">Nama</dt><dd>{dosenWali.data.lecturer_data.name}</dd></div>
                    <div className="flex justify-between"><dt className="font-medium text-gray-700">Email</dt><dd>{dosenWali.data.lecturer_data.email}</dd></div>
                  </>
                )}
              </dl>
            ) : <p className="text-gray-500">Belum punya dosen wali</p>}
          </div>
        </div>
      )}

      {activeTab === 'prs' && (
        <div>
          <PageHeader title="PRS Saya" description="Perubahan Rencana Studi - Pilih mata kuliah untuk semester ini" />

          <div className="bg-white rounded-xl shadow-sm p-6 mb-4 max-w-xl">
            <label className="block text-sm font-medium mb-1">Semester</label>
            <select value={prsSemId} onChange={(e) => setPrsSemId(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="">-- Pilih Semester --</option>
              {semesters.map(s => (
                <option key={s.id} value={s.id}>{s.is_active ? '🟢 ' : ''}{s.name} {s.year}</option>
              ))}
            </select>
          </div>

          {!prsData ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
              <p className="text-yellow-800 mb-3">⏳ Belum punya PRS untuk semester ini.</p>
              <button onClick={handleCreatePrs} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Buat PRS Sekarang
              </button>
              <p className="text-xs text-gray-600 mt-2">
                ⚠️ Pastikan dosen wali sudah validasi PRS Anda di sistem perwalian.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
                <h3 className="font-semibold text-lg">PRS #{prsData.id_prs || prsData.prs?.id_prs}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Status:{' '}
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    prsData.status === 'validated' ? 'bg-green-100 text-green-700' :
                    prsData.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {prsData.status || 'draft'}
                  </span>
                </p>
                <p className="text-sm text-gray-600"> Total SKS: {prsDetail
                    .filter(d => d.prioritas === 1 || d.status_validasi === 'approved')
                    .reduce((sum, d) => sum + (d.sks || 0), 0)}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold mb-4">Tambah Mata Kuliah</h3>
                  <form onSubmit={handleAddDetail} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Kelas Tersedia</label>
                      <select
                        value={formPrsDetail.id_kelas}
                        onChange={(e) => {
                          const kelas = kelasTersedia.find(k => (k.id || k.kelas_id) == e.target.value);
                          setFormPrsDetail({
                            ...formPrsDetail,
                            id_kelas: e.target.value,
                            id_mata_kuliah: kelas?.course_id || kelas?.id_mata_kuliah || formPrsDetail.id_mata_kuliah,
                            sks: kelas?.sks || formPrsDetail.sks,
                          });
                        }}
                        className="w-full px-3 py-2 border rounded"
                        required
                      >
                        <option value="">-- Pilih Kelas --</option>
                        {kelasTersedia.map(k => (
                          <option key={k.id || k.kelas_id} value={k.id || k.kelas_id}>
                            {k.kode_kelas || `#${k.kelas_id}`} - Course #{k.course_id} (sisa {k.sisa ?? '-'})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">ID Mata Kuliah</label>
                      <input type="number" value={formPrsDetail.id_mata_kuliah}
                        onChange={(e) => setFormPrsDetail({ ...formPrsDetail, id_mata_kuliah: e.target.value })}
                        required className="w-full px-3 py-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">SKS</label>
                      <input type="number" value={formPrsDetail.sks}
                        onChange={(e) => setFormPrsDetail({ ...formPrsDetail, sks: e.target.value })}
                        min="1" max="6" required className="w-full px-3 py-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Prioritas (1=tinggi)</label>
                      <input type="number" value={formPrsDetail.prioritas}
                        onChange={(e) => setFormPrsDetail({ ...formPrsDetail, prioritas: e.target.value })}
                        min="1" max="10" className="w-full px-3 py-2 border rounded" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                      Tambah
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold mb-4">Mata Kuliah Diambil ({prsDetail.length})</h3>
                  {prsDetail.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                        <tr>
                          <th className="px-3 py-2 text-left">ID</th>
                          <th className="px-3 py-2 text-left">Kelas</th>
                          <th className="px-3 py-2 text-left">Matkul</th>
                          <th className="px-3 py-2 text-left">SKS</th>
                          <th className="px-3 py-2 text-left">Prio</th>
                          <th className="px-3 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prsDetail.map(d => (
                          <tr key={d.id_detail_prs || d.id} className="border-b">
                            <td className="px-3 py-2 font-mono">#{d.id_detail_prs || d.id}</td>
                            <td className="px-3 py-2 font-mono">#{d.id_kelas}</td>
                            <td className="px-3 py-2">{d.nama_matkul || `Matkul #${d.id_mata_kuliah}`}</td>
                            <td className="px-3 py-2">{d.sks}</td>
                            <td className="px-3 py-2">{d.prioritas || '-'}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                (d.status_validasi || d.status) === 'approved' ? 'bg-green-100 text-green-700' :
                                (d.status_validasi || d.status) === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {d.status_validasi || d.status || 'pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Belum ada mata kuliah. Tambah di kiri.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'krs' && (
        <div>
          <PageHeader title="Kartu Rencana Studi" description="Mata kuliah yang diambil per semester" />
          <div className="bg-white rounded-xl shadow-sm p-6">
            {krs && Array.isArray(krs) && krs.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">Semester</th><th className="px-3 py-2 text-left">Tahun</th><th className="px-3 py-2 text-left">Status</th></tr></thead>
                <tbody>
                  {krs.map(item => (
                    <tr key={item.id_krs || item.id} className="border-b">
                      <td className="px-3 py-2 font-mono">{item.id_krs || item.id}</td>
                      <td className="px-3 py-2">{item.semester}</td>
                      <td className="px-3 py-2">{item.tahun_ajaran}</td>
                      <td className="px-3 py-2"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{item.status_nilai || '-'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-gray-500">Belum ada KRS</p>}
          </div>
        </div>
      )}

      {activeTab === 'khs' && (
        <div>
          <PageHeader title="Kartu Hasil Studi" description="Nilai per semester" />
          <div className="bg-white rounded-xl shadow-sm p-6 mb-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1">Tahun Ajaran</label>
                <input type="text" value={khsSemester.tahun_ajaran} onChange={(e) => setKhsSemester({ ...khsSemester, tahun_ajaran: e.target.value })} placeholder="2025-2026" className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Semester</label>
                <select value={khsSemester.semester} onChange={(e) => setKhsSemester({ ...khsSemester, semester: e.target.value })} className="w-full px-3 py-2 border rounded">
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                  <option value="Pendek">Pendek</option>
                </select>
              </div>
            </div>
            <button onClick={loadKhs} className="w-full bg-blue-600 text-white py-2 rounded">Tampilkan KHS</button>
          </div>
          {khs && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              {Array.isArray(khs.matkul) && khs.matkul.length > 0 ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-gray-600">{khs.semester} {khs.tahun_ajaran}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">IPS: {Number(khs.ips || 0).toFixed(2)}</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr><th className="px-3 py-2 text-left">Matkul</th><th className="px-3 py-2 text-left">SKS</th><th className="px-3 py-2 text-left">UTS</th><th className="px-3 py-2 text-left">UAS</th><th className="px-3 py-2 text-left">Akhir</th><th className="px-3 py-2 text-left">Huruf</th></tr></thead>
                    <tbody>{khs.matkul.map(m => (<tr key={m.id_nilai} className="border-b"><td className="px-3 py-2">{m.nama_matkul || `#${m.id_matkul}`}</td><td className="px-3 py-2">{m.sks}</td><td className="px-3 py-2">{m.nilai_uts ?? '-'}</td><td className="px-3 py-2">{m.nilai_uas ?? '-'}</td><td className="px-3 py-2 font-medium">{m.nilai_akhir ?? '-'}</td><td className="px-3 py-2 font-medium">{m.nilai_huruf ?? '-'}</td></tr>))}</tbody>
                  </table>
                </>
              ) : <p className="text-gray-500">Tidak ada data KHS untuk semester ini</p>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'transkrip' && (
        <div>
          <PageHeader title="Transkrip Akademik" description="Rekap nilai keseluruhan" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-700 to-blue-500 text-white rounded-xl shadow-sm p-6">
              <p className="text-sm opacity-80">IPK</p>
              <p className="text-4xl font-bold mt-2">{ipk?.ipk?.toFixed?.(2) || ipk?.ipk || '-'}</p>
            </div>
            <div className="bg-gradient-to-br from-sky-600 to-sky-400 text-white rounded-xl shadow-sm p-6">
              <p className="text-sm opacity-80">IPS Terakhir</p>
              <p className="text-4xl font-bold mt-2">{Array.isArray(ips) && ips.length ? Number(ips[ips.length - 1].ips).toFixed(2) : '-'}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-400 text-white rounded-xl shadow-sm p-6">
              <p className="text-sm opacity-80">Total SKS</p>
              <p className="text-4xl font-bold mt-2">{transkrip?.total_sks || '-'}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-3">Detail Transkrip</h3>
            {transkrip && Array.isArray(transkrip.riwayat) && transkrip.riwayat.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr><th className="px-3 py-2 text-left">Semester</th><th className="px-3 py-2 text-left">Mata Kuliah</th><th className="px-3 py-2 text-left">SKS</th><th className="px-3 py-2 text-left">Huruf</th><th className="px-3 py-2 text-left">Akhir</th></tr></thead>
                <tbody>{transkrip.riwayat.flatMap((sem, si) => (sem.matkul || []).map((item, idx) => (
                  <tr key={`${si}-${idx}`} className="border-b">
                    <td className="px-3 py-2 text-gray-600">{sem.semester} {sem.tahun_ajaran}</td>
                    <td className="px-3 py-2">{item.nama_matkul || `Matkul #${item.id_matkul}`}</td>
                    <td className="px-3 py-2">{item.sks}</td>
                    <td className="px-3 py-2 font-medium">{item.nilai_huruf}</td>
                    <td className="px-3 py-2">{item.nilai_akhir}</td>
                  </tr>
                )))}</tbody>
              </table>
            ) : <p className="text-gray-500">Belum ada data transkrip</p>}
          </div>
        </div>
      )}

      {activeTab === 'kelas' && (
        <div>
          <PageHeader title="Kelas Tersedia" description="Pilihan mata kuliah semester aktif" />
          <div className="bg-white rounded-xl shadow-sm p-6 mb-4 max-w-xl">
            <label className="block text-sm font-medium mb-1">Semester</label>
            <select value={activeSemId} onChange={(e) => setActiveSemId(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="">-- Pilih Semester --</option>
              {semesters.map(s => (<option key={s.id} value={s.id}>{s.is_active ? '🟢 ' : ''}{s.name} {s.year}</option>))}
            </select>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            {kelasTersedia.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr><th className="px-3 py-2 text-left">Kode Kelas</th><th className="px-3 py-2 text-left">Mata Kuliah</th><th className="px-3 py-2 text-left">Kuota</th><th className="px-3 py-2 text-left">Sisa</th></tr></thead>
                <tbody>{kelasTersedia.map(k => (<tr key={k.id || k.kelas_id} className="border-b"><td className="px-3 py-2 font-mono">{k.kode_kelas || `#${k.kelas_id}`}</td><td className="px-3 py-2">Course #{k.course_id}</td><td className="px-3 py-2">{k.kuota ?? '-'}</td><td className="px-3 py-2">{k.sisa ?? '-'}</td></tr>))}</tbody>
              </table>
            ) : <p className="text-gray-500">Tidak ada kelas tersedia</p>}
          </div>
        </div>
      )}
    </Layout>
  );
}
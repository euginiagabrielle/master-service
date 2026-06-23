import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import * as masterApi from '../api/master';
import * as perwalianApi from '../api/perwalian';
import * as transkripApi from '../api/transkrip';

const TABS = [
  { id: 'profile', label: 'Profile Saya', icon: '👤' },
  { id: 'perwalian', label: 'Dosen Wali', icon: '👨‍🏫' },
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

  const studentId = user.user_id;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profileData, semestersData] = await Promise.all([
          masterApi.getStudentById(studentId).catch(() => null),
          masterApi.getAllSemesters().catch(() => []),
        ]);
        setProfile(profileData);
        setSemesters(semestersData);
        const active = semestersData.find(s => s.is_active);
        if (active) setActiveSemId(active.id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  // Load tab content on demand
  useEffect(() => {
    const loadTabData = async () => {
      try {
        if (activeTab === 'perwalian' && !dosenWali) {
          const data = await perwalianApi.getLecturerByStudent(studentId);
          setDosenWali(data);
        }
        if (activeTab === 'krs' && !krs) {
          const data = await transkripApi.getKrs(studentId);
          setKrs(data);
        }
        if (activeTab === 'transkrip' && !transkrip) {
          const [t, i, k] = await Promise.all([
            transkripApi.getTranskrip(studentId).catch(() => null),
            transkripApi.getIps(studentId).catch(() => null),
            transkripApi.getIpk(studentId).catch(() => null),
          ]);
          setTranskrip(t);
          setIps(i);
          setIpk(k);
        }
      } catch (e) {
        console.error(`Error loading ${activeTab}:`, e);
      }
    };
    loadTabData();
  }, [activeTab, studentId, dosenWali, krs, transkrip]);

  const loadKhs = async () => {
    if (!khsSemester.tahun_ajaran || !khsSemester.semester) return;
    setLoading(true);
    try {
      const data = await transkripApi.getKhs(studentId, khsSemester.semester, khsSemester.tahun_ajaran);
      setKhs(data);
    } catch (e) {
      alert('Error: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const loadKelas = async () => {
    if (!activeSemId) return;
    setLoading(true);
    try {
      const data = await perwalianApi.getKelasTersedia
        ? await perwalianApi.getKelasTersedia(activeSemId).catch(() => [])
        : [];
      // fallback langsung ke penawaran API
      if (data.length === 0) {
        const { getKelasTersedia } = await import('../api/penawaran');
        const k = await getKelasTersedia(activeSemId).catch(() => []);
        setKelasTersedia(k);
      } else {
        setKelasTersedia(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'kelas' && activeSemId) loadKelas();
  }, [activeTab, activeSemId]);

  return (
    <Layout user={user} onLogout={onLogout} tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {loading && <p className="text-gray-500 mb-4">Loading...</p>}

      {/* PROFILE */}
      {activeTab === 'profile' && (
        <div>
          <PageHeader title="Profile Saya" description="Informasi akun mahasiswa" />
          <div className="bg-white rounded-lg shadow p-6 max-w-xl">
            {profile ? (
              <dl className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <dt className="font-medium text-gray-700">NRP</dt>
                  <dd className="font-mono">{profile.nrp}</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="font-medium text-gray-700">Nama</dt>
                  <dd>{profile.name || profile.student_name}</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="font-medium text-gray-700">Email</dt>
                  <dd>{profile.email || profile.student_email}</dd>
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
                  <dd>{profile.unit_id || '-'}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-gray-500">Profile tidak ditemukan</p>
            )}
          </div>
        </div>
      )}

      {/* DOSEN WALI */}
      {activeTab === 'perwalian' && (
        <div>
          <PageHeader title="Dosen Wali Saya" description="Informasi dosen pembimbing akademik" />
          <div className="bg-white rounded-lg shadow p-6 max-w-xl">
            {dosenWali?.status === 'success' && dosenWali.data ? (
              <dl className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <dt className="font-medium text-gray-700">Dosen Wali ID</dt>
                  <dd className="font-mono">#{dosenWali.data.dosen_wali_id}</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="font-medium text-gray-700">Lecturer ID</dt>
                  <dd className="font-mono">{dosenWali.data.lecturer_id}</dd>
                </div>
                {dosenWali.data.lecturer_data && (
                  <>
                    <div className="flex justify-between border-b pb-2">
                      <dt className="font-medium text-gray-700">NIP</dt>
                      <dd className="font-mono">{dosenWali.data.lecturer_data.nip}</dd>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <dt className="font-medium text-gray-700">Nama</dt>
                      <dd>{dosenWali.data.lecturer_data.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium text-gray-700">Email</dt>
                      <dd>{dosenWali.data.lecturer_data.email}</dd>
                    </div>
                  </>
                )}
              </dl>
            ) : (
              <p className="text-gray-500">Belum punya dosen wali</p>
            )}
          </div>
        </div>
      )}

      {/* KRS */}
      {activeTab === 'krs' && (
        <div>
          <PageHeader title="Kartu Rencana Studi" description="Mata kuliah yang diambil per semester" />
          <div className="bg-white rounded-lg shadow p-6">
            {krs && Array.isArray(krs) && krs.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Semester</th>
                    <th className="px-3 py-2 text-left">Tahun Ajaran</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {krs.map(item => (
                    <tr key={item.id_krs || item.id} className="border-b">
                      <td className="px-3 py-2 font-mono">{item.id_krs || item.id}</td>
                      <td className="px-3 py-2">{item.semester}</td>
                      <td className="px-3 py-2">{item.tahun_ajaran}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {item.status_nilai || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">Belum ada KRS</p>
            )}
          </div>
        </div>
      )}

      {/* KHS */}
      {activeTab === 'khs' && (
        <div>
          <PageHeader title="Kartu Hasil Studi" description="Nilai per semester" />

          <div className="bg-white rounded-lg shadow p-6 mb-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1">Tahun Ajaran</label>
                <input
                  type="text"
                  value={khsSemester.tahun_ajaran}
                  onChange={(e) => setKhsSemester({ ...khsSemester, tahun_ajaran: e.target.value })}
                  placeholder="2025-2026"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Semester</label>
                <select
                  value={khsSemester.semester}
                  onChange={(e) => setKhsSemester({ ...khsSemester, semester: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                  <option value="Pendek">Pendek</option>
                </select>
              </div>
            </div>
            <button onClick={loadKhs} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Tampilkan KHS
            </button>
          </div>

          {khs && (
            <div className="bg-white rounded-lg shadow p-6">
              {Array.isArray(khs) && khs.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">ID KHS</th>
                      <th className="px-3 py-2 text-left">Semester</th>
                      <th className="px-3 py-2 text-left">Tahun</th>
                    </tr>
                  </thead>
                  <tbody>
                    {khs.map(item => (
                      <tr key={item.id_khs} className="border-b">
                        <td className="px-3 py-2 font-mono">{item.id_khs}</td>
                        <td className="px-3 py-2">{item.semester}</td>
                        <td className="px-3 py-2">{item.tahun_ajaran}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">Tidak ada data KHS untuk semester ini</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* TRANSKRIP */}
      {activeTab === 'transkrip' && (
        <div>
          <PageHeader title="Transkrip Akademik" description="Rekap nilai keseluruhan" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow p-6">
              <p className="text-sm opacity-80">IPK</p>
              <p className="text-4xl font-bold mt-2">{ipk?.ipk?.toFixed(2) || ipk?.ipk || '-'}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg shadow p-6">
              <p className="text-sm opacity-80">IPS Terakhir</p>
              <p className="text-4xl font-bold mt-2">{ips?.ips?.toFixed(2) || ips?.ips || '-'}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow p-6">
              <p className="text-sm opacity-80">Total SKS</p>
              <p className="text-4xl font-bold mt-2">{transkrip?.total_sks || '-'}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-3">Detail Transkrip</h3>
            {transkrip && Array.isArray(transkrip.detail) && transkrip.detail.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Mata Kuliah</th>
                    <th className="px-3 py-2 text-left">SKS</th>
                    <th className="px-3 py-2 text-left">Nilai Huruf</th>
                    <th className="px-3 py-2 text-left">Nilai Akhir</th>
                  </tr>
                </thead>
                <tbody>
                  {transkrip.detail.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-3 py-2">{item.nama_matkul || `Matkul #${item.id_matkul}`}</td>
                      <td className="px-3 py-2">{item.sks}</td>
                      <td className="px-3 py-2 font-medium">{item.nilai_huruf}</td>
                      <td className="px-3 py-2">{item.nilai_akhir}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">Belum ada data transkrip</p>
            )}
          </div>
        </div>
      )}

      {/* KELAS TERSEDIA */}
      {activeTab === 'kelas' && (
        <div>
          <PageHeader title="Kelas Tersedia" description="Pilihan mata kuliah semester aktif" />

          <div className="bg-white rounded-lg shadow p-6 mb-4 max-w-xl">
            <label className="block text-sm font-medium mb-1">Semester</label>
            <select
              value={activeSemId}
              onChange={(e) => setActiveSemId(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">-- Pilih Semester --</option>
              {semesters.map(s => (
                <option key={s.id} value={s.id}>
                  {s.is_active ? '🟢 ' : ''}{s.name} {s.year}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            {kelasTersedia.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Kelas</th>
                    <th className="px-3 py-2 text-left">Mata Kuliah</th>
                    <th className="px-3 py-2 text-left">SKS</th>
                    <th className="px-3 py-2 text-left">Kapasitas</th>
                  </tr>
                </thead>
                <tbody>
                  {kelasTersedia.map(k => (
                    <tr key={k.id || k.kelas_id} className="border-b">
                      <td className="px-3 py-2 font-mono">#{k.id || k.kelas_id}</td>
                      <td className="px-3 py-2">{k.course_name || k.nama_matkul || `Course #${k.course_id}`}</td>
                      <td className="px-3 py-2">{k.sks || '-'}</td>
                      <td className="px-3 py-2">{k.kapasitas || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">Tidak ada kelas tersedia</p>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

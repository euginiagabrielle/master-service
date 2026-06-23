# SIA Petra UI

Unified frontend untuk SIA Petra (microservice-based academic information system). Mendukung 3 role: **Mahasiswa**, **Dosen**, dan **Admin/Kaprodi**.

## Stack

- **React 18** + **Vite 5**
- **Tailwind CSS 3**
- **Axios** (HTTP client dengan JWT interceptor)
- **Vite Proxy** (bypass CORS, hit backend langsung)

## Backend Requirements

UI ini connect ke 1 gateway yang merge 4 service:
- Master Service (units, lecturers, students, courses, semesters)
- Penawaran Kelas Service (ruang, kelas, jadwal)
- Perwalian Service (dosen-wali, perwalian, catatan)
- Transkrip Service (KRS, KHS, transkrip, IPS, IPK, nilai)

Gateway default running di `http://localhost:8003` (atau ganti di `vite.config.js`).

## Setup

```bash
npm install
npm run dev
```

Buka http://localhost:5173

## Konfigurasi Backend URL

Edit `vite.config.js`:

```javascript
// Lokal
const BACKEND_URL = 'http://localhost:8003';

// AWS EC2
// const BACKEND_URL = 'http://13.220.219.2:8003';
```

## Role & Demo Credentials

| Role | Username | Password | Dashboard |
|---|---|---|---|
| Admin/Kaprodi | `990001` | `password123` | AdminDashboard |
| Dosen | `990002` | `password123` | DosenDashboard |
| Mahasiswa | `C14230138` | `password123` | MahasiswaDashboard |

## Struktur Folder

```
src/
├── api/
│   ├── client.js          # Axios base + JWT interceptor
│   ├── master.js          # Master service endpoints
│   ├── penawaran.js       # Penawaran kelas endpoints
│   ├── perwalian.js       # Perwalian endpoints
│   └── transkrip.js       # Transkrip & nilai endpoints
├── components/
│   ├── Layout.jsx         # Header + sidebar role-colored
│   └── PageHeader.jsx
├── pages/
│   ├── Login.jsx
│   ├── MahasiswaDashboard.jsx
│   ├── DosenDashboard.jsx
│   └── AdminDashboard.jsx
├── App.jsx                # Role routing
└── main.jsx
```

## Fitur per Role

### Mahasiswa
- Profile akun
- Lihat dosen wali
- Lihat KRS, KHS, Transkrip
- Lihat IPS & IPK
- Lihat kelas tersedia semester aktif

### Dosen
- Lihat mahasiswa wali
- Assign mahasiswa wali baru
- Buat & validasi perwalian (PRS)
- CRUD catatan bimbingan
- Input nilai per kelas (UTS/UAS/Tugas)

### Admin/Kaprodi
- CRUD Unit Akademik (Fakultas, Prodi)
- CRUD Dosen
- CRUD Mahasiswa
- CRUD Mata Kuliah
- CRUD Semester
- CRUD Ruang
- CRUD Kelas
- Monitoring Perwalian
- Push Semester ke KRS

## Catatan

- Auth: pakai JWT dari `POST /login`, di-store di localStorage
- CORS: bypass via Vite proxy (semua request ke `/api/*`)
- 401 response → auto-logout
- Backend tidak diutak-atik, UI adaptive terhadap response format

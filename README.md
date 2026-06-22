# Master Service - Sistem Informasi Akademik

**Master Service** adalah core microservice dalam arsitektur Sistem Informasi Akademik (SIAKAD).
Layanan ini berfungsi sebagai **Single Source of Truth (SSOT)** yang mengelola seluruh data induk untuk ekosistem layanan Sistem Informasi Akademik.

---

## Fitur Utama

Master Service bertanggung jawab atas pengelolaan data dasar yang menjadi fondasi bagi layanan lain:

* **Manajemen Unit Akademik**
  Mengelola hierarki Fakultas dan Program Studi.

* **Manajemen Pengguna**
  Mengelola data Dosen, Mahasiswa, serta Role-Based Access Control (RBAC).

* **Kurikulum & Semester**
  Mengatur data kurikulum dan siklus akademik (semester aktif/non-aktif).

* **Mata Kuliah**
  Menyediakan katalog mata kuliah dan aturan SKS.

* **Aturan Akademik**
  Mengelola prasyarat pengambilan mata kuliah.

---

## 🛠 Tech Stack

* **Language**: Python 3.10+
* **Framework**: Nameko (Microservices RPC Framework)
* **Database**: PostgreSQL
* **ORM**: SQLAlchemy
* **Containerization**: Docker & Docker Compose
* **Communication**: RabbitMQ (Message Broker)

---

## Konfigurasi

Layanan ini menggunakan environment variables untuk konfigurasi:

| Variable         | Deskripsi                        |
| ---------------- | -------------------------------- |
| `DB_HOST`        | Host database                    |
| `DB_USER`        | Username database                |
| `DB_PASS`        | Password database                |
| `DB_NAME`        | Nama database                    |
| `JWT_SECRET_KEY` | Secret key untuk autentikasi JWT |
| `NAMEKO_CONFIG`  | Path ke file `config.yml`        |

---

## Cara Menjalankan

Pastikan Docker sudah terinstall, lalu jalankan:

```bash
docker compose up -d --build
```

---

## Arsitektur & Interaksi Layanan

Master Service menerapkan prinsip **Loose Coupling**:

* **Zero Outbound Dependency**
  Tidak bergantung pada service lain.

* **Inbound Interaction**
  Service lain (seperti Penawaran dan Perwalian) memanggil Master Service melalui **Nameko RPC** untuk validasi data.

Contoh:

* Validasi NIP dosen
* Validasi NRP mahasiswa

---

## API Documentation

Akses melalui **API Gateway**.

### Endpoint contoh:

```http
GET /master/lecturers
POST /master/students
PUT /master/courses/<course_id>
```

---

## Authentication

Gunakan JWT Token pada setiap request:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## Contoh Penggunaan

### Request

```http
GET /master/students
```

Header:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

### Response

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Budi Santoso",
      "nrp": "12345678"
    }
  ]
}
```

---

## Tips

* Gunakan **YARC** atau **Postman** untuk testing endpoint
* Pastikan token JWT masih valid
* Pastikan service dan database sudah running

---

## Catatan

* Master Service adalah pusat data utama dalam sistem
* Perubahan data di service lain harus mengacu ke Master Service
* Database menggunakan pendekatan **service-per-database**

---
## Related Services (Microservices)

Sistem SIAKAD ini dibangun menggunakan arsitektur **microservices**, di mana setiap layanan memiliki tanggung jawab spesifik dan berjalan secara independen.

Berikut adalah repository untuk masing-masing service:

* **Master Service (SSOT)**
  [https://github.com/euginiagabrielle/master-service](https://github.com/euginiagabrielle/master-service)

* **Penawaran Kelas Service**
  [https://github.com/<username>/penawaran-kelas-service](https://github.com/RichardEfrem/penawaran_kelas_service.git)

* **Perwalian Service**
  [https://github.com/<username>/perwalian-service](https://github.com/ValentinoEzinkyJoelianto/perwalian-service.git)

* **PRS Service**
  [https://github.com/<username>/nilai-service](https://github.com/TimDarrel/PRS-Docker-Nameko.git)

* **Transkrip Service**
  [https://github.com/<username>/transkrip-service](https://github.com/mariovggithub/Transkrip_Service.git)

* **API Gateway**
  [https://github.com/<username>/gateway-service](https://github.com/euginiagabrielle/master-service)

---

## Arsitektur Sistem

Setiap service:

* Berjalan dalam container terpisah (Docker)
* Memiliki database masing-masing (service-per-database)
* Berkomunikasi menggunakan **Nameko RPC via RabbitMQ**
* Diakses melalui **API Gateway**

```text
Client → API Gateway → RabbitMQ → Services → Database
```

---

## Catatan Integrasi

* Semua service dijalankan dalam satu environment menggunakan **Docker Compose**
* Menggunakan **network yang sama** agar bisa saling berkomunikasi
* Gateway berfungsi sebagai **single entry point**

---

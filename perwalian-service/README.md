\# Perwalian Service



Microservice untuk mengelola proses bimbingan akademik (perwalian) antara mahasiswa dan dosen wali. Bagian dari sistem SIA UK Petra (microservice architecture).



\## Stack



\- \*\*Framework:\*\* Nameko (RPC over RabbitMQ)

\- \*\*Database:\*\* PostgreSQL 15

\- \*\*Message Broker:\*\* RabbitMQ 3 (management)

\- \*\*HTTP Gateway:\*\* Nameko HTTP handlers

\- \*\*Deployment:\*\* Docker Compose



\## Struktur



```

perwalian-service-main/

├── Dockerfile

├── config.yml

├── database.py

├── docker-compose.yml

├── models.py

├── requirements.txt

├── service.py

└── gateway/

&#x20;   ├── Dockerfile

&#x20;   ├── config.yml

&#x20;   ├── requirements.txt

&#x20;   └── service.py

```



\## Entitas



1\. \*\*dosen\_wali\*\* — assignment dosen wali ke mahasiswa

2\. \*\*perwalian\*\* — status proses perwalian per semester (`is\_prs\_allowed`)

3\. \*\*catatan\_perwalian\*\* — notulensi bimbingan



\## Cross-Service Reference



Service ini berkomunikasi dengan \*\*Master Service\*\* via Nameko RPC untuk fetch:

\- `lecturers` (Dosen)

\- `students` (Mahasiswa)

\- `semesters` (Semester)



\## Setup \& Run



\### Prasyarat

\- Docker Desktop installed

\- Network `sia\_network` exists (atau akan dibuat otomatis)



\### Cara Run



```bash

\# 1. Clone repo

git clone https://github.com/USERNAME/perwalian-service.git

cd perwalian-service



\# 2. Buat network (kalau belum ada)

docker network create sia\_network



\# 3. Build \& jalankan

docker compose up -d --build



\# 4. Cek status

docker ps

```



\### Port



\- \*\*Gateway HTTP:\*\* http://localhost:8004

\- \*\*PostgreSQL:\*\* localhost:5433

\- \*\*RabbitMQ:\*\* localhost:5672 (AMQP), localhost:15672 (UI)



\## API Endpoints



\### Dosen Wali

| Method | Endpoint | Deskripsi |

|---|---|---|

| POST | `/perwalian/dosen-wali` | Assign dosen wali |

| GET | `/perwalian/dosen-wali` | List semua |

| GET | `/perwalian/dosen-wali/{id}` | Get by ID |

| GET | `/perwalian/lecturers/{lecturer\_id}/students` | Daftar mahasiswa per dosen |

| GET | `/perwalian/students/{student\_id}/lecturer` | Dosen wali per mahasiswa |

| GET | `/perwalian/laporan/jumlah-mahasiswa-per-dosen` | Laporan |

| PUT | `/perwalian/dosen-wali/{id}` | Update |

| DELETE | `/perwalian/dosen-wali/{id}` | Hapus |



\### Perwalian

| Method | Endpoint | Deskripsi |

|---|---|---|

| POST | `/perwalian/perwalians` | Buat perwalian |

| GET | `/perwalian/perwalians` | List semua |

| GET | `/perwalian/perwalians/{id}` | Get by ID |

| GET | `/perwalian/students/{student\_id}/perwalians` | By mahasiswa |

| POST | `/perwalian/perwalians/{id}/validate` | Validasi (boleh PRS) |

| POST | `/perwalian/perwalians/{id}/unvalidate` | Unvalidasi |

| GET | `/perwalian/laporan/rekap/{semester\_id}` | Rekap per semester |

| DELETE | `/perwalian/perwalians/{id}` | Hapus |



\### Catatan Perwalian

| Method | Endpoint | Deskripsi |

|---|---|---|

| POST | `/perwalian/catatan` | Buat catatan |

| GET | `/perwalian/perwalians/{id}/catatan` | By perwalian |

| GET | `/perwalian/catatan/{id}` | Get by ID |

| PUT | `/perwalian/catatan/{id}` | Update |

| DELETE | `/perwalian/catatan/{id}` | Hapus |



\## Contoh Request



\### Assign Dosen Wali

```bash

curl -X POST http://localhost:8004/perwalian/dosen-wali \\

&#x20; -H "Content-Type: application/json" \\

&#x20; -d '{"lecturer\_id": 1, "student\_id": 1}'

```



\### Catat Notulensi

```bash

curl -X POST http://localhost:8004/perwalian/catatan \\

&#x20; -H "Content-Type: application/json" \\

&#x20; -d '{"perwalian\_id": 1, "note\_content": "Bimbingan semester ini..."}'

```


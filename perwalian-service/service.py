from datetime import datetime
from nameko.rpc import rpc, RpcProxy
from database import SessionLocal

from models import DosenWali, Perwalian, CatatanPerwalian


class PerwalianService:
    name = "perwalian_service"

    # Handle untuk panggil function di Master Service via RabbitMQ
    master_service = RpcProxy("master_service")

    # ===================================================================
    # DOSEN WALI
    # ===================================================================

    # Assign Dosen Wali ke Mahasiswa
    @rpc
    def assign_dosen_wali(self, lecturer_id, student_id):
        db = SessionLocal()
        try:
            # Validasi: cek apakah lecturer_id valid via Master Service
            lecturer = self.master_service.get_lecturer_by_id(lecturer_id)
            if lecturer.get("status") == "error":
                return {"status": "error", "message": "Dosen tidak ditemukan di Master Service"}

            # Validasi: cek apakah student_id valid via Master Service
            student = self.master_service.get_student_by_id(student_id)
            if student.get("status") == "error":
                return {"status": "error", "message": "Mahasiswa tidak ditemukan di Master Service"}

            # Cek apakah mahasiswa sudah punya dosen wali aktif
            existing = db.query(DosenWali).filter(
                DosenWali.student_id == student_id,
                DosenWali.is_active == True
            ).first()
            if existing:
                return {"status": "error", "message": "Mahasiswa sudah memiliki dosen wali aktif"}

            dosen_wali = DosenWali(
                lecturer_id=lecturer_id,
                student_id=student_id,
                assigned_at=datetime.utcnow().date(),
                is_active=True
            )
            db.add(dosen_wali)
            db.commit()
            db.refresh(dosen_wali)

            return {
                "status": "success",
                "id": dosen_wali.dosen_wali_id,
                "message": "Dosen Wali berhasil di-assign"
            }
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @rpc
    def get_all_dosen_wali(self):
        db = SessionLocal()
        try:
            dosen_walis = db.query(DosenWali).all()
            return [
                {
                    "id": dw.dosen_wali_id,
                    "lecturer_id": dw.lecturer_id,
                    "student_id": dw.student_id,
                    "assigned_at": str(dw.assigned_at) if dw.assigned_at else None,
                    "is_active": dw.is_active
                }
                for dw in dosen_walis
            ]
        finally:
            db.close()

    @rpc
    def get_dosen_wali_by_id(self, dosen_wali_id):
        db = SessionLocal()
        try:
            dw = db.query(DosenWali).filter(DosenWali.dosen_wali_id == dosen_wali_id).first()
            if not dw:
                return {"status": "error", "message": "Dosen Wali tidak ditemukan"}
            return {
                "status": "success",
                "data": {
                    "id": dw.dosen_wali_id,
                    "lecturer_id": dw.lecturer_id,
                    "student_id": dw.student_id,
                    "assigned_at": str(dw.assigned_at) if dw.assigned_at else None,
                    "is_active": dw.is_active
                }
            }
        finally:
            db.close()

    # Lihat Daftar Mahasiswa per Dosen Wali
    @rpc
    def get_students_by_lecturer(self, lecturer_id):
        db = SessionLocal()
        try:
            dosen_walis = db.query(DosenWali).filter(
                DosenWali.lecturer_id == lecturer_id,
                DosenWali.is_active == True
            ).all()

            result = []
            for dw in dosen_walis:
                # Enrich dengan data mahasiswa dari Master Service
                student = self.master_service.get_student_by_id(dw.student_id)
                if student.get("status") == "success":
                    result.append({
                        "dosen_wali_id": dw.dosen_wali_id,
                        "student_id": dw.student_id,
                        "student_data": student.get("data")
                    })
            return result
        finally:
            db.close()

    # Lihat Dosen Wali per Mahasiswa
    @rpc
    def get_lecturer_by_student(self, student_id):
        db = SessionLocal()
        try:
            dw = db.query(DosenWali).filter(
                DosenWali.student_id == student_id,
                DosenWali.is_active == True
            ).first()
            if not dw:
                return {"status": "error", "message": "Mahasiswa belum memiliki dosen wali"}

            # Enrich dengan data dosen dari Master Service
            lecturer = self.master_service.get_lecturer_by_id(dw.lecturer_id)
            return {
                "status": "success",
                "data": {
                    "dosen_wali_id": dw.dosen_wali_id,
                    "lecturer_id": dw.lecturer_id,
                    "lecturer_data": lecturer.get("data") if lecturer.get("status") == "success" else None
                }
            }
        finally:
            db.close()

    # Lihat Jumlah Mahasiswa Wali per Dosen (Laporan)
    @rpc
    def get_count_students_per_lecturer(self):
        db = SessionLocal()
        try:
            dosen_walis = db.query(DosenWali).filter(DosenWali.is_active == True).all()

            # Hitung jumlah mahasiswa per dosen
            count_map = {}
            for dw in dosen_walis:
                count_map[dw.lecturer_id] = count_map.get(dw.lecturer_id, 0) + 1

            # Enrich dengan data dosen
            result = []
            for lecturer_id, count in count_map.items():
                lecturer = self.master_service.get_lecturer_by_id(lecturer_id)
                result.append({
                    "lecturer_id": lecturer_id,
                    "lecturer_data": lecturer.get("data") if lecturer.get("status") == "success" else None,
                    "total_students": count
                })
            return result
        finally:
            db.close()

    @rpc
    def update_dosen_wali(self, dosen_wali_id, lecturer_id=None, student_id=None, is_active=None):
        db = SessionLocal()
        try:
            dw = db.query(DosenWali).filter(DosenWali.dosen_wali_id == dosen_wali_id).first()
            if not dw:
                return {"status": "error", "message": "Dosen Wali tidak ditemukan"}

            if lecturer_id is not None: dw.lecturer_id = lecturer_id
            if student_id is not None: dw.student_id = student_id
            if is_active is not None: dw.is_active = is_active

            db.commit()
            return {"status": "success", "message": "Data Dosen Wali berhasil diupdate"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @rpc
    def delete_dosen_wali(self, dosen_wali_id):
        db = SessionLocal()
        try:
            dw = db.query(DosenWali).filter(DosenWali.dosen_wali_id == dosen_wali_id).first()
            if not dw:
                return {"status": "error", "message": "Dosen Wali tidak ditemukan"}

            db.delete(dw)
            db.commit()
            return {"status": "success", "message": "Dosen Wali berhasil dihapus"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": "Gagal menghapus Dosen Wali. " + str(e)}
        finally:
            db.close()

    # ===================================================================
    # PERWALIAN (status proses per semester)
    # ===================================================================

    @rpc
    def create_perwalian(self, dosen_wali_id, semester_id):
        db = SessionLocal()
        try:
            # Validasi: dosen_wali_id harus ada
            dw = db.query(DosenWali).filter(DosenWali.dosen_wali_id == dosen_wali_id).first()
            if not dw:
                return {"status": "error", "message": "Dosen Wali tidak ditemukan"}

            # Validasi: semester_id harus valid via Master Service
            semester = self.master_service.get_semester_by_id(semester_id)
            if semester.get("status") == "error":
                return {"status": "error", "message": "Semester tidak ditemukan di Master Service"}

            # Cek apakah perwalian untuk dosen_wali + semester ini sudah ada
            existing = db.query(Perwalian).filter(
                Perwalian.dosen_wali_id == dosen_wali_id,
                Perwalian.semester_id == semester_id
            ).first()
            if existing:
                return {"status": "error", "message": "Perwalian untuk semester ini sudah ada"}

            perwalian = Perwalian(
                dosen_wali_id=dosen_wali_id,
                semester_id=semester_id,
                is_prs_allowed=False
            )
            db.add(perwalian)
            db.commit()
            db.refresh(perwalian)

            return {
                "status": "success",
                "id": perwalian.perwalian_id,
                "message": "Perwalian berhasil dibuat"
            }
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @rpc
    def get_all_perwalian(self):
        db = SessionLocal()
        try:
            perwalians = db.query(Perwalian).all()
            return [
                {
                    "id": p.perwalian_id,
                    "dosen_wali_id": p.dosen_wali_id,
                    "semester_id": p.semester_id,
                    "is_prs_allowed": p.is_prs_allowed,
                    "validated_at": str(p.validated_at) if p.validated_at else None,
                    "unvalidated_at": str(p.unvalidated_at) if p.unvalidated_at else None
                }
                for p in perwalians
            ]
        finally:
            db.close()

    @rpc
    def get_perwalian_by_id(self, perwalian_id):
        db = SessionLocal()
        try:
            p = db.query(Perwalian).filter(Perwalian.perwalian_id == perwalian_id).first()
            if not p:
                return {"status": "error", "message": "Perwalian tidak ditemukan"}
            return {
                "status": "success",
                "data": {
                    "id": p.perwalian_id,
                    "dosen_wali_id": p.dosen_wali_id,
                    "semester_id": p.semester_id,
                    "is_prs_allowed": p.is_prs_allowed,
                    "validated_at": str(p.validated_at) if p.validated_at else None,
                    "unvalidated_at": str(p.unvalidated_at) if p.unvalidated_at else None
                }
            }
        finally:
            db.close()

    @rpc
    def get_perwalian_by_student(self, student_id, semester_id=None):
        db = SessionLocal()
        try:
            # Cari dosen_wali aktif milik student
            dw = db.query(DosenWali).filter(
                DosenWali.student_id == student_id,
                DosenWali.is_active == True
            ).first()
            if not dw:
                return {"status": "error", "message": "Mahasiswa belum memiliki dosen wali"}

            # Query perwalian dari dosen_wali tersebut
            query = db.query(Perwalian).filter(Perwalian.dosen_wali_id == dw.dosen_wali_id)
            if semester_id is not None:
                query = query.filter(Perwalian.semester_id == semester_id)

            perwalians = query.all()
            return [
                {
                    "id": p.perwalian_id,
                    "dosen_wali_id": p.dosen_wali_id,
                    "semester_id": p.semester_id,
                    "is_prs_allowed": p.is_prs_allowed,
                    "validated_at": str(p.validated_at) if p.validated_at else None,
                    "unvalidated_at": str(p.unvalidated_at) if p.unvalidated_at else None
                }
                for p in perwalians
            ]
        finally:
            db.close()

    # Validasi Mahasiswa (set is_prs_allowed = True)
    @rpc
    def validate_perwalian(self, perwalian_id):
        db = SessionLocal()
        try:
            p = db.query(Perwalian).filter(Perwalian.perwalian_id == perwalian_id).first()
            if not p:
                return {"status": "error", "message": "Perwalian tidak ditemukan"}

            p.is_prs_allowed = True
            p.validated_at = datetime.utcnow()
            p.unvalidated_at = None

            db.commit()
            return {"status": "success", "message": "Mahasiswa berhasil divalidasi (boleh PRS)"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    # Unvalidasi Mahasiswa (set is_prs_allowed = False)
    @rpc
    def unvalidate_perwalian(self, perwalian_id):
        db = SessionLocal()
        try:
            p = db.query(Perwalian).filter(Perwalian.perwalian_id == perwalian_id).first()
            if not p:
                return {"status": "error", "message": "Perwalian tidak ditemukan"}

            p.is_prs_allowed = False
            p.unvalidated_at = datetime.utcnow()

            db.commit()
            return {"status": "success", "message": "Status validasi mahasiswa dibatalkan"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    # Rekap Status Perwalian per semester
    @rpc
    def get_rekap_perwalian(self, semester_id):
        db = SessionLocal()
        try:
            perwalians = db.query(Perwalian).filter(Perwalian.semester_id == semester_id).all()
            total = len(perwalians)
            validated = sum(1 for p in perwalians if p.is_prs_allowed)
            not_validated = total - validated

            return {
                "status": "success",
                "data": {
                    "semester_id": semester_id,
                    "total_perwalian": total,
                    "tervalidasi": validated,
                    "belum_tervalidasi": not_validated
                }
            }
        finally:
            db.close()

    @rpc
    def delete_perwalian(self, perwalian_id):
        db = SessionLocal()
        try:
            p = db.query(Perwalian).filter(Perwalian.perwalian_id == perwalian_id).first()
            if not p:
                return {"status": "error", "message": "Perwalian tidak ditemukan"}

            db.delete(p)
            db.commit()
            return {"status": "success", "message": "Perwalian berhasil dihapus"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": "Gagal menghapus Perwalian. " + str(e)}
        finally:
            db.close()

    # ===================================================================
    # CATATAN PERWALIAN (notulensi bimbingan)
    # ===================================================================

    @rpc
    def create_catatan_perwalian(self, perwalian_id, note_content, perwalian_date=None):
        db = SessionLocal()
        try:
            # Validasi: perwalian_id harus ada
            p = db.query(Perwalian).filter(Perwalian.perwalian_id == perwalian_id).first()
            if not p:
                return {"status": "error", "message": "Perwalian tidak ditemukan"}

            catatan = CatatanPerwalian(
                perwalian_id=perwalian_id,
                note_content=note_content,
                perwalian_date=datetime.fromisoformat(perwalian_date) if perwalian_date else datetime.utcnow()
            )
            db.add(catatan)
            db.commit()
            db.refresh(catatan)

            return {
                "status": "success",
                "id": catatan.catatan_perwalian_id,
                "message": "Catatan Perwalian berhasil dibuat"
            }
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @rpc
    def get_catatan_by_perwalian(self, perwalian_id):
        db = SessionLocal()
        try:
            catatans = db.query(CatatanPerwalian).filter(
                CatatanPerwalian.perwalian_id == perwalian_id
            ).order_by(CatatanPerwalian.perwalian_date.desc()).all()

            return [
                {
                    "id": c.catatan_perwalian_id,
                    "perwalian_id": c.perwalian_id,
                    "perwalian_date": str(c.perwalian_date) if c.perwalian_date else None,
                    "note_content": c.note_content,
                    "created_at": str(c.created_at) if c.created_at else None,
                    "updated_at": str(c.updated_at) if c.updated_at else None
                }
                for c in catatans
            ]
        finally:
            db.close()

    @rpc
    def get_catatan_by_id(self, catatan_perwalian_id):
        db = SessionLocal()
        try:
            c = db.query(CatatanPerwalian).filter(
                CatatanPerwalian.catatan_perwalian_id == catatan_perwalian_id
            ).first()
            if not c:
                return {"status": "error", "message": "Catatan Perwalian tidak ditemukan"}
            return {
                "status": "success",
                "data": {
                    "id": c.catatan_perwalian_id,
                    "perwalian_id": c.perwalian_id,
                    "perwalian_date": str(c.perwalian_date) if c.perwalian_date else None,
                    "note_content": c.note_content,
                    "created_at": str(c.created_at) if c.created_at else None,
                    "updated_at": str(c.updated_at) if c.updated_at else None
                }
            }
        finally:
            db.close()

    @rpc
    def update_catatan_perwalian(self, catatan_perwalian_id, note_content=None, perwalian_date=None):
        db = SessionLocal()
        try:
            c = db.query(CatatanPerwalian).filter(
                CatatanPerwalian.catatan_perwalian_id == catatan_perwalian_id
            ).first()
            if not c:
                return {"status": "error", "message": "Catatan Perwalian tidak ditemukan"}

            if note_content is not None: c.note_content = note_content
            if perwalian_date is not None: c.perwalian_date = datetime.fromisoformat(perwalian_date)

            db.commit()
            return {"status": "success", "message": "Catatan Perwalian berhasil diupdate"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @rpc
    def delete_catatan_perwalian(self, catatan_perwalian_id):
        db = SessionLocal()
        try:
            c = db.query(CatatanPerwalian).filter(
                CatatanPerwalian.catatan_perwalian_id == catatan_perwalian_id
            ).first()
            if not c:
                return {"status": "error", "message": "Catatan Perwalian tidak ditemukan"}

            db.delete(c)
            db.commit()
            return {"status": "success", "message": "Catatan Perwalian berhasil dihapus"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()
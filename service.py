from nameko.rpc import rpc
from database import SessionLocal

from models import UnitAkademik, Dosen

class MasterService:
    name = "master_service"

    # UNIT AKADEMIK
    @rpc
    def create_unit(self, name, type, parent_id=None):
        db = SessionLocal()
        try:
            unit = UnitAkademik(
                unit_name = name,
                unit_type = type,
                parent_id = parent_id
            )
            db.add(unit)
            db.commit()
            db.refresh(unit)

            return {
                "id": unit.unit_id,
                "name": unit.unit_name,
                "type": unit.unit_type
            }
        finally:
            db.close()
    
    @rpc
    def get_all_units(self):
        db = SessionLocal()
        units = db.query(UnitAkademik).all()

        try:
            return [
                {
                    "id": u.unit_id,
                    "name": u.unit_name,
                    "type": u.unit_type,
                    "parent_id": u.parent_id
                }
                for u in units
            ]
        finally:
            db.close()
    
    @rpc
    def get_unit_by_id(self, unit_id):
        db = SessionLocal()
        try:
            unit = db.query(UnitAkademik).filter(UnitAkademik.unit_id == unit_id).first()
            if not unit:
                return {"status": "error", "message": "Unit Akademik tidak ditemukan"}
            return {
                "status": "success",
                "data": {"id": unit.unit_id, "name": unit.unit_name, "type": unit.unit_type, "parent_id": unit.parent_id}
            }
        finally:
            db.close()
    
    @rpc
    def update_unit(self, unit_id, name=None, type=None, parent_id=None):
        db = SessionLocal()
        try:
            unit = db.query(UnitAkademik).filter(UnitAkademik.unit_id == unit_id).first()
            if not unit:
                return {"status": "error", "message": "Unit Akademik tidak ditemukan"}
            
            if name: unit.unit_name = name
            if type: unit.unit_type = type
            if parent_id is not None: unit.parent_id = parent_id

            db.commit()
            db.refresh(unit)
            return {"status": "success", "message": "Data berhasil diupdate"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @rpc
    def delete_unit(self, unit_id):
        db = SessionLocal()
        try:
            unit = db.query(UnitAkademik).filter(UnitAkademik.unit_id == unit_id).first()
            if not unit:
                return {"status": "error", "message": "Unit Akademik tidak ditemukan"}
            
            db.delete(unit)
            db.commit()
            return {"status": "success", "message": f"Unit {unit.unit_name} berhasil dihapus"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": "Gagal menghapus, mungkin ada data turunan yang mengikat. " + str(e)}
        finally:
            db.close()

    # DOSEN
    @rpc
    def create_lecturer(self, nip, name, email, password, status, unit_id):
        db = SessionLocal()
        try:
            lecturer = Dosen(
                nip=nip,
                lecturer_name=name,
                lecturer_password=password,
                lecturer_status=status,
                unit_id=unit_id
            )
            db.add(lecturer)
            db.commit()
            db.refresh(lecturer)

            return{"status": "success", "id": lecturer.lecturer_id, "name": lecturer.lecturer_name}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()
    
    @rpc
    def get_all_lecturers(self):
        db = SessionLocal()
        try:
            lecturers = db.query(Dosen).all()
            return [
                {
                    "id": l.lecturer_id,
                    "nip": l.nip,
                    "name": l.lecturer_name,
                    "email": l.lecturer_email,
                    "status": l.lecturer_status,
                    "unit_id": l.unit_id
                }
                for l in lecturers
            ]
        finally:
            db.close()
    

    @rpc
    def get_lecturer_by_id(self, lecturer_id):
        db = SessionLocal()
        try:
            lecturer = db.query(Dosen).filter(Dosen.lecturer_id == lecturer_id).first()
            if not lecturer:
                return {"status": "error", "message": "Dosen tidak ditemukan"}
            
            return {
                "status": "success",
                "data": {
                    "id": lecturer.lecturer_id,
                    "nip": lecturer.nip,
                    "name": lecturer.lecturer_name,
                    "email": lecturer.lecturer_email,
                    "status": lecturer.lecturer_status,
                    "unit_id": lecturer.unit_id
                }
            }
        finally:
            db.close()

    @rpc
    def update_lecturer(self, lecturer_id, nip=None, name=None, email=None, password=None, status=None, unit_id=None):
        db = SessionLocal()
        try:
            lecturer = db.query(Dosen).filter(Dosen.lecturer_id == lecturer_id).first()
            if not lecturer:
                return {"status": "error", "message": "Dosen tidak ditemukan"}
            
            if nip: lecturer.nip = nip
            if name: lecturer.lecturer_name = name,
            if email: lecturer.lecturer_email = email,
            if password: lecturer.lecturer_password = password,
            if status: lecturer.lecturer_status = status
            if unit_id is not None: lecturer.unit_id = unit_id

            db.commit()
            return {"status": "success", "message": "Data dosen berhasil diupdate"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @rpc
    def delete_lecturer(self, lecturer_id):
        db = SessionLocal()
        try:
            lecturer = db.query(Dosen).filter(Dosen.lecturer_id == lecturer_id).first()
            if not lecturer:
                return {"status": "error", "message": "Dosen tidak ditemukan"}
            
            db.delete(lecturer)
            db.commit()
            return {"status": "success", "message": f"Dosen {lecturer.lecturer_name} berhasil dihapus"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": "Gagal menghapus dosen. " +str(e)}
        finally:
            db.close()
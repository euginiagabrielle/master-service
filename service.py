from nameko.rpc import rpc
from database import SessionLocal

from models import UnitAkademik

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
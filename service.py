from nameko.rpc import rpc
from database import SessionLocal

import os
import jwt
import datetime

from models import UnitAkademik, Dosen, Mahasiswa, MataKuliah, Kurikulum, Semester, Role, DetailRole, MKKurikulum, PrasyaratMKKurikulum

class MasterService:
    name = "master_service"

    # LOGIN
    @rpc
    def login(self, username, password):
        db = SessionLocal()
        SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "fallback_secret")

        try:
            dosen = db.query(Dosen).filter((Dosen.nip == username) | (Dosen.lecturer_email == username)).first()
            if dosen and dosen.lecturer_password == password:
                roles = db.query(DetailRole).filter(DetailRole.lecturer_id == dosen.lecturer_id).all()
                role_names = [r.role.role_name for r in roles] if roles else ["Dosen"]
                payload = {
                    "user_id": dosen.lecturer_id,
                    "type": "dosen",
                    "roles": role_names,
                    "exp": datetime.datetime.now() + datetime.timedelta(hours=12)
                }
                token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
                return {"status": "success", "token": token, "type": "dosen", "roles": role_names}
            
            mhs = db.query(Mahasiswa).filter((Mahasiswa.nrp == username) | (Mahasiswa.student_email == username)).first()
            if mhs and mhs.student_password == password:
                payload = {
                    "user_id": mhs.student_id,
                    "type": "mahasiswa",
                    "roles": ["Mahasiswa"],
                    "exp": datetime.datetime.now() + datetime.timedelta(hours=12)
                }
                token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
                return {"status": "success", "token": token, "type": "mahasiswa", "roles": ["Mahasiswa"]}
            
            return {"status": "error", "message": "Username atau Password salah"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

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
                lecturer_email=email,
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
    def get_lecturers_by_unit(self, unit_id):
        db = SessionLocal()
        try:
            lecturers = db.query(Dosen).filter(Dosen.unit_id == unit_id).all()
            return[
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

    # ROLE DOSEN
    @rpc
    def create_role(self, role_name):
        db = SessionLocal()
        try:
            role = Role(role_name=role_name)
            db.add(role)
            db.commit()
            db.refresh(role)
            return {"status": "success", "id": role.role_id, "name": role.role_name}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @rpc
    def get_all_roles(self):
        db = SessionLocal()
        try:
            roles = db.query(Role).all()
            return [
                {
                    "id": r.role_id,
                    "name": r.role_name
                }
                for r in roles
            ]
        finally:
            db.close()
    
    @rpc
    def update_role(self, role_id, name=None):
        db = SessionLocal()
        try:
            role = db.query(Role).filter(Role.role_id == role_id).first()
            if not role:
                return {"status": "error", "message": "Role tidak ditemukan"}
            
            if name: role.role_name = name
            
            db.commit()
            return {"status": "success", "message": "Data role berhasil diupdate"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()
    
    @rpc
    def delete_role(self, role_id):
        db = SessionLocal()
        try:
            role = db.query(Role).filter(Role.role_id == role_id).first()
            if not role:
                return {"status": "error", "message": "Role tidak ditemukan"}
            
            db.delete(role)
            db.commit()
            return {"status": "success", "message": f"Role {role.role_name} berhasil dihapus"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        
    # ASSIGN ROLE
    @rpc
    def assign_role_to_lecturer(self, lecturer_id, role_id):
        db = SessionLocal()
        try:
            lecturer = db.query(Dosen).filter(Dosen.lecturer_id == lecturer_id).first()
            role = db.query(Role).filter(Role.role_id == role_id).first()
            if not lecturer or not role:
                return {"status": "error", "message": "Dosen atau Role tidak ditemukan"}
            
            existing = db.query(DetailRole).filter(
                DetailRole.lecturer_id == lecturer_id,
                DetailRole.role_id == role_id
            ).first()
            if existing:
                return {"status": "error", "message": "Dosen sudah memiliki role ini"}
            
            detail_role = DetailRole(lecturer_id=lecturer_id, role_id=role_id)
            db.add(detail_role)
            db.commit()
            return {"status": "success", "message": f"Berhasil menambahkan role {role.role_name} ke {lecturer.lecturer_name}"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @rpc
    def get_roles_by_lecturer(self, lecturer_id):
        db = SessionLocal()
        try:
            details = db.query(DetailRole).filter(DetailRole.lecturer_id == lecturer_id).all()
            return [
                {
                    "detail_role_id": d.detail_role_id,
                    "role_id": d.role_id,
                    "role_name": d.role.role_name
                }
                for d in details
            ]
        finally:
            db.close()
    
    @rpc
    def remove_role_from_lecturer(self, detail_role_id):
        db = SessionLocal()
        try:
            detail = db.query(DetailRole).filter(DetailRole.detail_role_id == detail_role_id).first()
            if not detail: return {"status": "error", "message": "Detail Role tidak ditemukan"}

            db.delete(detail)
            db.commit()
            return {"status": "success", "message": "Role berhasil dicabut dari Dosen"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    # MAHASISWA
    @rpc
    def create_student(self, nrp, name, email, password, status, unit_id):
        db = SessionLocal()
        try:
            student = Mahasiswa(
                nrp=nrp,
                student_name=name,
                student_email=email,
                student_password=password,
                student_status=status,
                unit_id=unit_id
            )
            db.add(student)
            db.commit()
            db.refresh(student)

            return {"status": "success", "id": student.student_id, "name": student.student_name}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @rpc
    def get_all_students(self):
        db = SessionLocal()
        try:
            students = db.query(Mahasiswa).all()
            return [
                {
                    "id": s.student_id,
                    "nrp": s.nrp,
                    "name": s.student_name,
                    "email": s.student_email,
                    "password": s.student_status,
                    "unit_id": s.unit_id
                }
                for s in students
            ]
        finally:
            db.close()
    
    @rpc
    def get_student_by_id(self, student_id):
        db = SessionLocal()
        try:
            student = db.query(Mahasiswa).filter(Mahasiswa.student_id == student_id).first()
            if not student:
                return {"status": "error", "message": "Mahasiswa tidak ditemukan"}
            
            return {
                "status": "success",
                "data": {
                    "id": student.student_id,
                    "nrp": student.nrp,
                    "name": student.student_name,
                    "email": student.student_email,
                    "status": student.student_status,
                    "unit_id": student.unit_id
                }
            }
        finally:
            db.close()

    @rpc
    def get_students_by_unit(self, unit_id):
        db = SessionLocal()
        try:
            students = db.query(Mahasiswa).filter(Mahasiswa.unit_id == unit_id).all()
            return [
                {
                    "id": s.student_id,
                    "nrp": s.nrp,
                    "name": s.student_name,
                    "email": s.student_email,
                    "status": s.student_status,
                    "unit_id": s.unit_id
                }
                for s in students
            ]
        finally:
            db.close()
    
    @rpc
    def update_student(self, student_id, nrp=None, name=None, email=None, password=None, status=None, unit_id=None):
        db = SessionLocal()
        try:
            student = db.query(Mahasiswa).filter(Mahasiswa.student_id == student_id).first()
            if not student:
                return {"status": "error", "message": "Mahasiswa tidak ditemukan"}
            
            if nrp: student.nrp = nrp
            if name: student.student_name = name
            if email: student.student_email = email
            if password: student.student_password = password
            if status: student.student_status = status
            if unit_id is not None: student.unit_id = unit_id

            db.commit()
            return {"status": "success", "message": "Data mahasiswa berhasil diupdate"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @rpc
    def delete_student(self, student_id):
        db = SessionLocal()
        try:
            student = db.query(Mahasiswa).filter(Mahasiswa.student_id == student_id).first()
            if not student:
                return {"status": "error", "message": "Mahasiswa tidak ditemukan"}
            
            db.delete(student)
            db.commit()
            return {"status": "success", "message": f"Mahasiswa {student.student_name} berhasil dihapus"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": "Gagal menghapus mahasiswa. " + str(e)}
        finally:
            db.close()

    # MATA KULIAH
    @rpc
    def create_course(self, code, name, sks, unit_id):
        db = SessionLocal()
        try:
            course = MataKuliah(
                course_code=code,
                course_name=name,
                sks=sks,
                unit_id=unit_id
            )
            db.add(course)
            db.commit()
            db.refresh(course)
            return {"status": "success", "id": course.course_id, "name": course.course_name}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @rpc
    def get_all_courses(self):
        db = SessionLocal()
        try:
            courses = db.query(MataKuliah).all()
            return [
                {
                    "id": c.course_id,
                    "code": c.course_code,
                    "name": c.course_name,
                    "sks": c.sks,
                    "unit_id": c.unit_id
                }
                for c in courses
            ]
        finally:
            db.close()

    @rpc
    def get_course_by_id(self, course_id):
        db = SessionLocal()
        try:
            course = db.query(MataKuliah).filter(MataKuliah.course_id == course_id).first()
            if not course:
                return {"status": "error", "message": "Mata Kuliah tidak ditemukan"}
            return {
                "status": "success", 
                "data": {
                    "id": course.course_id, 
                    "code": course.course_code, 
                    "name": course.course_name,
                    "sks": course.sks, 
                    "unit_id": course.unit_id
                }
            }
        finally:
            db.close()
    
    @rpc
    def get_courses_by_unit(self, unit_id):
        db = SessionLocal()
        try:
            courses = db.query(MataKuliah).filter(MataKuliah.unit_id == unit_id).all()
            return [
                {
                    "id": c.course_id,
                    "code": c.course_code,
                    "name": c.course_name,
                    "sks": c.sks,
                    "unit_id": c.unit_id
                }
                for c in courses
            ]
        finally:
            db.close()
    
    @rpc
    def update_course(self, course_id, code=None, name=None, sks=None, unit_id=None):
        db = SessionLocal()
        try:
            course = db.query(MataKuliah).filter(MataKuliah.course_id == course_id).first()
            if not course:
                return {"status": "error", "message": "Mata Kuliah tidak ditemukan"}
            
            if code: course.course_code = code
            if name: course.course_name = name
            if sks: course.sks = sks
            if unit_id is not None: course.unit_id = unit_id

            db.commit()
            return {"status": "success", "message": "Data mata kuliah berhasil diupdate"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @rpc
    def delete_course(self, course_id):
        db = SessionLocal()
        try:
            course = db.query(MataKuliah).filter(MataKuliah.course_id == course_id).first()
            if not course:
                return {"status": "error", "message": "Mata Kuliah tidak ditemukan"}
            
            db.delete(course)
            db.commit()
            return {"status": "success", "message": f"Mata Kuliah {course.course_name} berhasil dihapus"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()
    
    # KURIKULUM
    @rpc
    def create_curriculum(self, name, year, unit_id):
        db = SessionLocal()
        try:
            curriculum = Kurikulum(
                curriculum_name=name,
                curriculum_year=year,
                unit_id=unit_id
            )
            db.add(curriculum)
            db.commit()
            db.refresh(curriculum)
            return {"status": "success", "id": curriculum.curriculum_id, "name": curriculum.curriculum_year}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()
        
    @rpc
    def get_all_curriculums(self):
        db = SessionLocal()
        try:
            curriculums = db.query(Kurikulum).all()
            return [
                {
                    "id": c.curriculum_id,
                    "name": c.curriculum_name,
                    "year": c.curriculum_year,
                    "unit_id": c.unit_id
                }
                for c in curriculums
            ]
        finally:
            db.close()

    @rpc
    def get_curriculums_by_unit(self, unit_id):
        db = SessionLocal()
        try:
            curriculums = db.query(Kurikulum).filter(Kurikulum.unit_id == unit_id).all()
            return [
                {
                    "id": c.curriculum_id,
                    "name": c.curriculum_name,
                    "year": c.curriculum_year,
                    "unit_id": c.unit_id
                }
                for c in curriculums
            ]
        finally:
            db.close()

    @rpc
    def update_curriculum(self, curriculum_id, name=None, year=None, unit_id=None):
        db = SessionLocal()
        try:
            curriculum = db.query(Kurikulum).filter(Kurikulum.curriculum_id == curriculum_id).first()
            if not curriculum:
                return {"status": "error", "message": "Kurikulum tidak ditemukan"}
            
            if name: curriculum.curriculum_name = name
            if year: curriculum.curriculum_year = year
            if unit_id is not None: curriculum.unit_id = unit_id

            db.commit()
            return {"status": "success", "message": "Data kurikulum berhasil diupdate"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()
    
    # SEMESTER
    @rpc
    def create_semester(self, name, year, is_active, curriculum_id):
        db = SessionLocal()
        try:
            semester = Semester(
                semester_name=name,
                semester_year=year,
                is_active=is_active,
                curriculum_id=curriculum_id
            )
            db.add(semester)
            db.commit()
            db.refresh(semester)
            return {"status": "success", "id": semester.semester_id, "name": semester.semester_name}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()
    
    @rpc
    def get_all_semesters(self):
        db = SessionLocal()
        try:
            semesters = db.query(Semester).all()
            return [
                {
                    "id": s.semester_id,
                    "name": s.semester_name,
                    "year": s.semester_year,
                    "is_active": s.is_active,
                    "curriculum_id": s.curriculum_id
                }
                for s in semesters
            ]
        finally:
            db.close()

    @rpc
    def get_semester_by_id(self, semester_id):
        db = SessionLocal()
        try:
            semester = db.query(Semester).filter(Semester.semester_id == semester_id).first()
            if not semester:
                return {"status": "error", "message": "Mata Kuliah tidak ditemukan"}
            return {
                "status": "success", 
                "data": {
                    "id": semester.semester_id,
                    "name": semester.semester_name,
                    "year": semester.semester_year,
                    "is_active": semester.is_active,
                    "curriculum_id": semester.curriculum_id
                }
            }
        finally:
            db.close()
    
    @rpc
    def get_active_semester(self):
        db = SessionLocal()
        try:
            semester = db.query(Semester).filter(Semester.is_active == True).first()
            
            if not semester:
                return {"status": "error", "message": "Tidak ada semester yang sedang aktif saat ini"}
            
            return {
                "status": "success",
                "data": {
                    "id": semester.semester_id,
                    "name": semester.semester_name,
                    "year": semester.semester_year,
                    "is_active": semester.is_active,
                    "curriculum_id": semester.curriculum_id
                }
            }
        finally:
            db.close()
    
    @rpc
    def update_semester(self, semester_id, name=None, year=None, is_active=None, curriculum_id=None):
        db = SessionLocal()
        try:
            semester = db.query(Semester).filter(Semester.semester_id == semester_id).first()
            if not semester:
                return {"status": "error", "message": "Semester tidak ditemukan"}
            
            if name: semester.semester_name = name
            if year: semester.semester_year = year
            if is_active is not None: semester.is_active = is_active
            if curriculum_id is not None: semester.curriculum_id = curriculum_id

            db.commit()
            return {"status": "success", "message": "Data Semester berhasil diupdate"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    # DETAIL MK KURIKULUM
    @rpc
    def assign_course_to_curriculum(self, curriculum_id, course_id, semester):
        db = SessionLocal()
        try:
            existing = db.query(MKKurikulum).filter(
                MKKurikulum.curriculum_id == curriculum_id,
                MKKurikulum.course_id == course_id
            ).first()
            if existing:
                return {"status": "error", "message": "Mata Kuliah sudah ada di Kurikulum"}
            
            mk_kurikulum = MKKurikulum(
                curriculum_id=curriculum_id,
                course_id=course_id,
                semester=semester
            )

            db.add(mk_kurikulum)
            db.commit()
            return {"status": "success", "message": "Mata Kuliah berhasil ditambahakan ke Kurikulum"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @rpc
    def get_all_curriculum_courses(self):
        db = SessionLocal()
        try:
            details = db.query(MKKurikulum).all()
            return [
                {
                    "id": d.curriculum_course_id,
                    "curriculum_id": d.curriculum_id,
                    "course_id": d.course_id,
                    "course_name": d.course.course_name if d.course else None,
                    "semester": d.semester
                } for d in details
            ]
        finally:
            db.close()

    @rpc
    def update_curriculum_course(self, curriculum_course_id, semester):
        db =  SessionLocal()
        try:
            detail = db.query(MKKurikulum).filter(MKKurikulum.curriculum_course_id == curriculum_course_id).first()
            if not detail: 
                return {"status": "error", "message": "Detail MK Kurikulum tidak ditemukan"}
            
            detail.semester = semester
            db.commit()
            return {"status": "success", "message": "Semester Mata Kuliah berhasil diupdate"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @rpc
    def get_courses_by_curriculum(self, curriculum_id):
        db = SessionLocal()
        try:
            details = db.query(MKKurikulum).filter(MKKurikulum.curriculum_id == curriculum_id).all()
            return [
                {
                    "id": d.curriculum_course_id,
                    "course_id": d.course_id,
                    "course_name": d.course.course_name if d.course else None,
                    "sks": d.course.sks if d.course else None,
                    "semester": d.semester
                } for d in details
            ]
        finally:
            db.close()

    @rpc
    def get_courses_by_curriculum_and_semester(self, curriculum_id, semester):
        db =  SessionLocal()
        try:
            details = db.query(MKKurikulum).filter(
                MKKurikulum.curriculum_id == curriculum_id,
                MKKurikulum.semester == semester
            ).all()
            return [
                {
                    "id": d.curriculum_course_id,
                    "course_id": d.course_id,
                    "course_name": d.course.course_name if d.course else None,
                    "sks": d.course.sks if d.course else None
                } for d in details
            ]
        finally:
            db.close()
    
    @rpc
    def remove_course_from_curriculum(self, curriculum_course_id):
        db = SessionLocal()
        try:
            detail = db.query(MKKurikulum).filter(MKKurikulum.curriculum_course_id == curriculum_course_id).first()
            if not detail:
                return {"status": "error", "message": "Detail MK Kurikulum tidak ditemukan"}
            
            db.delete(detail)
            db.commit()
            return {"status": "success", "message": "Mata Kuliah berhasil dihapus dari Kurikulum"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    # PRASYARAT KURIKULUM MATA KULIAH
    @rpc
    def create_prerequisite(self, curriculum_course_id, type_prasyarat, prerequisite_course_id=None, minimum_sks=None):
        db = SessionLocal()
        try:
            prerequisite = PrasyaratMKKurikulum(
                curriculum_course_id=curriculum_course_id,
                type=type_prasyarat, # Contoh: "Wajib Lulus", "Wajib Ambil", "SKS"
                prerequisite_course_id=prerequisite_course_id,
                minimum_sks=minimum_sks
            )

            db.add(prerequisite)
            db.commit()
            db.refresh(prerequisite)
            return {"status": "success", "id": prerequisite.prerequisites_id, "message": "Prasyarat berhasil ditambahkan"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @rpc
    def get_all_prerequisites(self):
        db = SessionLocal()
        try:
            prereqs = db.query(PrasyaratMKKurikulum).all()
            return [
                {
                    "id": p.prerequisites_id,
                    "curriculum_course_id": p.curriculum_course_id,
                    "type": p.type,
                    "prerequisite_course_id": p.prerequisite_course_id,
                    "minimum_sks": p.minimum_sks
                } for p in prereqs
            ]
        finally:
            db.close()
    
    @rpc
    def update_prerequisite(self, prerequisites_id, type_prasyarat=None, prerequisite_course_id=None, minimum_sks=None):
        db = SessionLocal()
        try:
            prereq = db.query(PrasyaratMKKurikulum).filter(PrasyaratMKKurikulum.prerequisites_id == prerequisites_id).first()
            if not prereq:
                return {"status": "error", "message": "Prasyarat tidak ditemukan"}

            if type_prasyarat is not None: prereq.type = type_prasyarat
            if prerequisite_course_id is not None: prereq.prerequisite_course_id = prerequisite_course_id
            if minimum_sks is not None: prereq.minimum_sks = minimum_sks

            db.commit()
            return {"status": "success", "message": "Data prasyarat berhasil diupdate"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @rpc
    def delete_prerequisite(self, prerequisites_id):
        db = SessionLocal()
        try:
            prereq = db.query(PrasyaratMKKurikulum).filter(PrasyaratMKKurikulum.prerequisites_id == prerequisites_id).first()
            if not prereq:
                return {"status": "error", "message": "Prasyarat tidak ditemukan"}

            db.delete(prereq)
            db.commit()
            return {"status": "success", "message": "Prasyarat berhasil dihapus"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()
    
    @rpc
    def get_prerequisites_by_curriculum_course(self, curriculum_course_id):
        db = SessionLocal()
        try:
            prereqs = db.query(PrasyaratMKKurikulum).filter(PrasyaratMKKurikulum.curriculum_course_id == curriculum_course_id).all()
            return [
                {
                    "id": p.prerequisites_id,
                    "curriculum_course_id": p.curriculum_course_id,
                    "type": p.type,
                    "prerequisite_course_id": p.prerequisite_course_id,
                    "minimum_sks": p.minimum_sks
                } for p in prereqs
            ]
        finally:
            db.close()
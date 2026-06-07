from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

# Unit Akademik
class UnitAkademik(Base):
    __tablename__ = "academic_units"

    unit_id = Column(Integer, primary_key=True)
    unit_name = Column(String, nullable=False)
    unit_type = Column(String, nullable=False)
    parent_id = Column(Integer, ForeignKey("academic_units.unit_id"), nullable=True)

    parent = relationship("UnitAkademik", remote_side=[unit_id])

# Dosen
class Dosen(Base):
    __tablename__ = "lecturers"

    lecturer_id = Column(String, primary_key=True)
    nip = Column(String, unique=True, nullable=False)
    lecturer_name = Column(String, nullable=False)
    lecturer_email = Column(String, nullable=False)
    lecturer_password = Column(String, nullable=False)
    lecturer_status = Column(String, nullable=False)
    unit_id = Column(String, ForeignKey("academic_units.unit_id"))

    unit = relationship("UnitAkademik")

class Role(Base):
    __tablename__ = "roles"

    role_id = Column(Integer, primary_key=True)
    role_name = Column(String, nullable=False)

class DetailRole(Base):
    __tablename__ = "detail_roles"

    detail_role_id = Column(Integer, primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.role_id"))
    lecturer_id = Column(Integer, ForeignKey("lecturers.lecturer_id"))

    role = relationship("Role")
    lecturer = relationship("Dosen")

# Mahasiswa
class Mahasiswa(Base):
    __tablename__ = "students"

    student_id = Column(Integer, primary_key=True)
    nrp = Column(String, unique=True, nullable=False)
    student_name = Column(String, nullable=False)
    student_email = Column(String, nullable=False)
    student_password = Column(String, nullable=False)
    student_status = Column(String, nullable=False)
    unit_id = Column(Integer, ForeignKey("academic_unit.unit_id"))

    unit = relationship("UnitAkademik")

# Mata Kuliah & Kurikulum
class MataKuliah(Base):
    __tablename__ = "courses"

    course_id = Column(Integer, primary_key=True)
    course_code = Column(String, unique=True, nullable=False)
    course_name = Column(String, nullable=False)
    sks = Column(Integer, nullable=False)
    unit_id = Column(Integer, ForeignKey("academic_units.unit_id"))

    unit = relationship("UnitAkademik")

class Kurikulum(Base):
    __tablename__ = "curriculums"

    curriculum_id = Column(Integer, primary_key=True)
    curriculum_name = Column(String, nullable=False)
    curriculum_year = Column(String, nullable=False)
    unit_id = Column(Integer, ForeignKey("academic_units.unit_id"))

    unit = relationship("UnitAkademik")

class Semester(Base):
    __tablename__ = "semesters"

    semester_id = Column(Integer, primary_key=True)
    semester_name = Column(String, nullable=False)
    semester_year = Column(String, nullable=False)
    is_active = Column(Boolean, default=False)
    curriculum_id = Column(Integer, ForeignKey("curriculums.curriculum_id"))

    curriculum = relationship("Kurikulum")

# Relasi Kurikulum & Mata Kuliah (Prasyarat)
class MKKurikulum(Base):
    __tablename__ = "curriculum_courses"

    curriculum_course_id = Column(Integer, primary_key=True)
    curriculum_id = Column(Integer, ForeignKey("curriculums.curriculum_id"))
    course_id = Column(Integer, ForeignKey("courses.course_id"))
    semester = Column(Integer, nullable=False)

    curriculum = relationship("Kurikulum")
    course = relationship("MataKuliah")

class PrasyaratMKKurikulum(Base):
    __tablename__ = "curriculum_course_prerequisites"

    prerequisites_id = Column(Integer, primary_key=True)
    curriculum_course_id = Column(Integer, ForeignKey("curriculum_courses.curriculum_course_id"))
    type = Column(String, nullable=False)
    prerequisite_course_id = Column(Integer, ForeignKey("courses.course_id"), nullable=True)
    minimum_sks = Column(Integer, nullable=True)

    curriculum_course = relationship("MKKurikulum")
    prerequisite_course = relationship("MataKuliah")
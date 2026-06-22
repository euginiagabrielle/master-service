from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, Date, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()


# Dosen Wali (assignment dosen wali ke mahasiswa)
# Catatan: lecturer_id & student_id adalah virtual FK ke Master Service (tidak ada constraint DB)
class DosenWali(Base):
    __tablename__ = "dosen_wali"

    dosen_wali_id = Column(Integer, primary_key=True)
    lecturer_id = Column(Integer, nullable=False)  # virtual FK ke lecturers (Master Service)
    student_id = Column(Integer, nullable=False)   # virtual FK ke students (Master Service)
    assigned_at = Column(Date, nullable=False, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relasi 1-to-many ke Perwalian
    perwalians = relationship("Perwalian", back_populates="dosen_wali")


# Perwalian (status proses perwalian per semester)
# Catatan: semester_id adalah virtual FK ke Master Service
class Perwalian(Base):
    __tablename__ = "perwalian"

    perwalian_id = Column(Integer, primary_key=True)
    dosen_wali_id = Column(Integer, ForeignKey("dosen_wali.dosen_wali_id"), nullable=False)
    semester_id = Column(Integer, nullable=False)  # virtual FK ke semesters (Master Service)
    is_prs_allowed = Column(Boolean, default=False)
    validated_at = Column(DateTime, nullable=True)
    unvalidated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relasi back ke DosenWali
    dosen_wali = relationship("DosenWali", back_populates="perwalians")
    # Relasi 1-to-many ke CatatanPerwalian; cascade hapus catatan kalau perwalian dihapus
    catatan_perwalians = relationship(
        "CatatanPerwalian",
        back_populates="perwalian",
        cascade="all, delete-orphan"
    )


# Catatan Perwalian (notulensi & catatan bimbingan)
class CatatanPerwalian(Base):
    __tablename__ = "catatan_perwalian"

    catatan_perwalian_id = Column(Integer, primary_key=True)
    perwalian_id = Column(Integer, ForeignKey("perwalian.perwalian_id"), nullable=False)
    perwalian_date = Column(DateTime, default=datetime.utcnow)
    note_content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relasi back ke Perwalian
    perwalian = relationship("Perwalian", back_populates="catatan_perwalians")
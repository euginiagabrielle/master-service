import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import *

DATABASE_URL = "postgresql://postgres:password@perwalian-db:5432/perwalian_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# Retry loop: DB container kadang butuh waktu ready
for i in range(5):
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully!")
        break
    except Exception as e:
        print(f"Database belum siap, mencoba lagi dalam 3 detik...({i+1}/5)")
        time.sleep(3)
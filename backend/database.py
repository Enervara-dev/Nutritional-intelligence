from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import socket
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL") or "sqlite:///./enervara.db"

from sqlalchemy.sql import text

def is_db_reachable(url: str) -> bool:
    try:
        parsed = urlparse(url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 5432
        with socket.create_connection((host, port), timeout=4.0):
            return True
    except Exception:
        return False

import time

def init_engine(url: str):
    if not url or url.startswith("sqlite"):
        return create_engine("sqlite:///./enervara.db", connect_args={"check_same_thread": False})
    
    # Try connecting with retries for cloud/container startup
    max_retries = 3
    for attempt in range(max_retries):
        if is_db_reachable(url):
            try:
                eng = create_engine(
                    url,
                    pool_pre_ping=True,
                    pool_recycle=300
                )
                with eng.connect() as conn:
                    conn.execute(text("SELECT 1"))
                parsed = urlparse(url)
                print(f"[ENERVARA] Connected successfully to PostgreSQL database at {parsed.hostname}")
                return eng
            except Exception as e:
                print(f"[ENERVARA] Connection attempt {attempt + 1} failed: {e}")
        if attempt < max_retries - 1:
            time.sleep(1)

    print(f"[ENERVARA] Warning: Could not connect to {url}. Falling back to SQLite.")
    return create_engine("sqlite:///./enervara.db", connect_args={"check_same_thread": False})

engine = init_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

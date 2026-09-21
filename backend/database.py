from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import socket
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL") or "sqlite:///./enervara.db"

def is_db_reachable(url: str) -> bool:
    try:
        parsed = urlparse(url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 5432
        with socket.create_connection((host, port), timeout=0.5):
            return True
    except Exception:
        return False

def init_engine(url: str):
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False})
    if ("postgres" in url) and not is_db_reachable(url):
        print(f"[ENERVARA] PostgreSQL at {url} is not reachable. Using SQLite fallback (enervara.db).")
        return create_engine("sqlite:///./enervara.db", connect_args={"check_same_thread": False})
    try:
        eng = create_engine(url)
        with eng.connect():
            pass
        return eng
    except Exception as e:
        print(f"[ENERVARA] Warning: Could not connect to {url} ({e}). Falling back to SQLite.")
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

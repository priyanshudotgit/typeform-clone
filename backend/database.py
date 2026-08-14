import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

database_url = os.getenv("DATABASE_URL", "sqlite:///./typeform_clone.db")

auth_token = os.getenv("LIBSQL_AUTH_TOKEN")
if auth_token and database_url.startswith("sqlite+libsql://"):
    separator = "&" if "?" in database_url else "?"
    database_url = f"{database_url}{separator}authToken={auth_token}"

SQLALCHEMY_DATABASE_URL = database_url

connect_args = (
    {"check_same_thread": False} 
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite:///") 
    else {}
)

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
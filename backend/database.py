import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

database_url = os.getenv("DATABASE_URL", "sqlite:///./typeform_clone.db")

auth_token = os.getenv("LIBSQL_AUTH_TOKEN")

SQLALCHEMY_DATABASE_URL = database_url

is_libsql = database_url.startswith("sqlite+libsql://")
is_local_sqlite = database_url.startswith("sqlite:///")

connect_args = {}
if is_local_sqlite:
    connect_args["check_same_thread"] = False
elif is_libsql and auth_token:
    connect_args["auth_token"] = auth_token
    connect_args["secure"] = True

print("DATABASE_URL =", database_url)
print("LIBSQL_AUTH_TOKEN exists:", bool(auth_token))

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
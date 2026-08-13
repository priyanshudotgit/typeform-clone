from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import forms_router, auth_router

# Create database tables (if they don't exist yet, though alembic will manage this later)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Typeform Clone API", version="1.0.0")

# Configure CORS
origins = [
    "http://localhost:3000",  # Next.js frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api")
app.include_router(forms_router, prefix="/api")

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "API is running smoothly"}
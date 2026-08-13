# Typeform Clone - Assignment
A full-stack Typeform-inspired form builder. Create dynamic forms, collect responses, and share them via public links — all with a smooth, modern UI.

Supports three authentication modes: Google OAuth, Email/Password, and Guest access.

---

## Tech Stack

### Frontend
- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **NextAuth.js** — Google OAuth + credentials + guest sessions
- **TanStack Query** — server state & data fetching
- **Zustand** — client state management
- **Framer Motion** — animations
- **dnd-kit** — drag-and-drop form builder
- **React Hook Form + Zod** — form validation

### Backend
- **Python FastAPI**
- **SQLAlchemy ORM** with **SQLite** (via `database.db` / `typeform_clone.db`)
- **Alembic** — schema migrations
- **passlib[bcrypt]** — password hashing
- **python-jose[cryptography]** — JWT signing
- **Pydantic v2** — request/response validation
- **python-dotenv** — environment variable loading

---

## Project Structure

```
typeform-clone-scaler/
├── backend/
│   ├── main.py              # FastAPI app entrypoint, CORS config
│   ├── database.py          # SQLAlchemy engine & session (SQLite)
│   ├── models/              # SQLAlchemy ORM models
│   ├── routers/             # API route handlers (auth, forms)
│   ├── schemas/             # Pydantic request/response schemas
│   ├── services/            # Business logic (auth, forms)
│   ├── seed/                # Database seed scripts
│   ├── alembic/             # Migration scripts
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env.sample          # Copy to .env and fill in values
│
├── frontend/
│   ├── src/                 # Next.js app source
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   └── .env.sample          # Copy to .env and fill in values
```

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- npm

---

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd typeform-clone-scaler
```

---

### 2. Backend Setup

```bash
cd backend
```

Create and activate a virtual environment:

```bash
# Create
python -m venv .venv

# Activate (Linux/macOS)
source .venv/bin/activate

# Activate (Windows)
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Set up environment variables:

```bash
cp .env.sample .env
```

Edit `backend/.env`:

```env
# SQLite database path (default, no changes needed)
DATABASE_URL=sqlite:///./typeform_clone.db

# JWT secret — generate with: openssl rand -hex 32
SECRET_KEY=your-secret-key-here
```

Run database migrations:

```bash
alembic upgrade head
```

Start the development server:

```bash
fastapi dev main.py
```

Backend runs at `http://localhost:8000`.  
API docs available at `http://localhost:8000/docs`.

---

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Set up environment variables:

```bash
cp .env.sample .env
```

Edit `frontend/.env`:

```env
# FastAPI backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Google OAuth credentials (from https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth secret — generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-nextauth-secret-here

# Must match local dev URL
NEXTAUTH_URL=http://localhost:3000
```

Start the dev server:

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`.

---

## Authentication Modes

| Mode | Description |
|------|-------------|
| **Google OAuth** | Sign in with Google account. Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. |
| **Email/Password** | Register and log in with credentials. Passwords hashed via bcrypt. |
| **Guest** | Access public forms without creating an account. |

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Log in, receive JWT |
| `GET` | `/api/forms` | List user's forms |
| `POST` | `/api/forms` | Create new form |
| `GET` | `/api/forms/{id}` | Get form by ID |
| `PUT` | `/api/forms/{id}` | Update form |
| `DELETE` | `/api/forms/{id}` | Delete form |
| `POST` | `/api/forms/{id}/responses` | Submit a response |
| `GET` | `/api/forms/{id}/responses` | Get all responses |

Full interactive docs at `http://localhost:8000/docs` when running locally.

---

## Generating Secrets

```bash
# JWT / BACKEND_SECRET_KEY
openssl rand -hex 32

# NEXTAUTH_SECRET
openssl rand -base64 32
```

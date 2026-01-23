# Reuse Vandy

Reuse Vandy is a marketplace for Vanderbilt students to buy and sell items safely.

## Project Structure

- `frontend/`: Next.js application (TypeScript)
- `backend/`: FastAPI application (Python)
- `docker-compose.yml`: Local database (MongoDB)

## Prerequisites

- Node.js (v18+ recommended)
- Python 3.11+
- Docker & Docker Compose

## Quick Start

### 1. Start the Database
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`.
Docs: `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The app will be available at `http://localhost:3000`.

## Architecture
- **Frontend**: Next.js App Router, CSS Modules.
- **Backend**: FastAPI, Motor (Async MongoDB), Beanie (ODM - To be configured).
- **Database**: MongoDB.
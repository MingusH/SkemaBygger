# SkemaBygger - Docker Setup

Skemalægningssystem for folkeskoler bygget med React frontend og FastAPI backend med PostgreSQL database.

## Quick Start med Docker

1. **Installer Docker og Docker Compose**

2. **Start hele systemet:**
```bash
docker-compose up --build
```

Dette starter:
- PostgreSQL database på port 5432
- FastAPI backend på port 8000 
- React frontend på port 3000

3. **Tilgå applikationer:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Database

Databaseen starter med sample data:
- 3 lærere (Jens, Mette, Søren)
- 3 klasser (3.A, 3.B, 5.A) 
- 4 fag (Matematik, Dansk, Engelsk, Natur/Teknik)
- 5 elever

## Projektstruktur

```
SkemaBygger/
├── backend/           # FastAPI backend
│   ├── main.py       # Main application
│   ├── models.py     # SQLAlchemy models
│   ├── schemas.py    # Pydantic schemas
│   ├── database.py   # Database connection
│   └── Dockerfile    # Backend Docker config
├── frontend/         # React frontend
│   ├── src/          # React source code
│   └── Dockerfile    # Frontend Docker config
├── docker-compose.yml # Docker orchestration
├── init.sql          # Initial database data
└── README.md
```

## API Endpoints

### Students
- GET `/students/` - Hent alle elever
- POST `/students/` - Opret ny elev
- GET `/students/{id}` - Hent specifik elev

### Teachers  
- GET `/teachers/` - Hent alle lærere
- POST `/teachers/` - Opret ny lærer
- GET `/teachers/{id}` - Hent specifik lærer

### Classrooms
- GET `/classrooms/` - Hent alle klasser
- POST `/classrooms/` - Opret ny klasse
- GET `/classrooms/{id}` - Hent specifik klasse

### Subjects
- GET `/subjects/` - Hent alle fag
- POST `/subjects/` - Opret nyt fag

## Udvikling uden Docker

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Database
Installer PostgreSQL og opret database:
```sql
CREATE DATABASE skema_db;
CREATE USER skema_user WITH PASSWORD 'skema_password';
GRANT ALL PRIVILEGES ON DATABASE skema_db TO skema_user;
```

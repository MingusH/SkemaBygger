# SkemaBygger Backend

FastAPI backend med PostgreSQL til skemalægning for folkeskoler.

## Installation

1. Installer PostgreSQL og opret database:
```sql
CREATE DATABASE skema_db;
```

2. Installer Python dependencies:
```bash
pip install -r requirements.txt
```

3. Opdater .env fil med din database connection:
```
DATABASE_URL=postgresql://dit_brugernavn:dit_password@localhost/skema_db
```

4. Kør database migrations:
```bash
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

5. Start server:
```bash
uvicorn main:app --reload
```

## API Endpoints

### Students
- GET /students/ - Hent alle elever
- POST /students/ - Opret ny elev
- GET /students/{id} - Hent specifik elev

### Teachers  
- GET /teachers/ - Hent alle lærere
- POST /teachers/ - Opret ny lærer
- GET /teachers/{id} - Hent specifik lærer

### Classrooms
- GET /classrooms/ - Hent alle klasser
- POST /classrooms/ - Opret ny klasse
- GET /classrooms/{id} - Hent specifik klasse

### Subjects
- GET /subjects/ - Hent alle fag
- POST /subjects/ - Opret nyt fag

## Database Schema

### Students
- id, fornavn, efternavn, email, foedselsdato, elevnummer, klasse_id, aktiv

### Teachers  
- id, fornavn, efternavn, email, initialer, telefon, ansat_dato, stilling, aktiv

### Classrooms
- id, navn, aargang, skoleaar, laerer_id, kapacitet, lokale, aktiv

### Subjects
- id, navn, kort_navn, laerer_id, farve, aktiv

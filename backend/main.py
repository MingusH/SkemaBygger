from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import models
import schemas
import database
from database import engine, SessionLocal

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SkemaBygger API", description="API til folkeskole skemalægning")

# Exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"Validation error: {exc}")
    print(f"Error details: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tillad alle origins midlertidigt for debugging
    allow_credentials=False,
    allow_methods=["*"],  # Tillad alle methods
    allow_headers=["*"],  # Tillad alle headers
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "SkemaBygger API - SQlite version"}

# Students endpoints
@app.get("/students/", response_model=List[schemas.Student])
def get_students(db: Session = Depends(get_db)):
    students = db.query(models.Student).all()
    # Konverter datetime til string for response
    result = []
    for student in students:
        student_dict = {
            'id': student.id,
            'fornavn': student.fornavn,
            'efternavn': student.efternavn,
            'email': student.email,
            'foedselsdato': student.foedselsdato.isoformat() if student.foedselsdato else None,
            'elevnummer': student.elevnummer,
            'klasse_id': student.klasse_id,
            'aktiv': student.aktiv,
            'oprettet_dato': student.oprettet_dato.isoformat() if student.oprettet_dato else None
        }
        result.append(schemas.Student(**student_dict))
    return result

@app.post("/students/", response_model=schemas.Student)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    # Debug: Print hvad vi modtager
    print(f"Modtaget student data: {student}")
    print(f"foedselsdato type: {type(student.foedselsdato)}")
    print(f"foedselsdato value: {student.foedselsdato}")
    
    # Konverter string til datetime manuelt
    student_data = student.model_dump()
    if student_data.get('foedselsdato'):
        student_data['foedselsdato'] = datetime.fromisoformat(student_data['foedselsdato'].replace('Z', '+00:00'))
    
    db_student = models.Student(**student_data)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    
    # Konverter tilbage til string for response
    response_dict = {
        'id': db_student.id,
        'fornavn': db_student.fornavn,
        'efternavn': db_student.efternavn,
        'email': db_student.email,
        'foedselsdato': db_student.foedselsdato.isoformat() if db_student.foedselsdato else None,
        'elevnummer': db_student.elevnummer,
        'klasse_id': db_student.klasse_id,
        'aktiv': db_student.aktiv,
        'oprettet_dato': db_student.oprettet_dato.isoformat() if db_student.oprettet_dato else None
    }
    return schemas.Student(**response_dict)

@app.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db.delete(student)
    db.commit()
    return {"message": "Student deleted successfully"}

@app.get("/students/{student_id}", response_model=schemas.Student)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Konverter datetime til string for response
    response_dict = {
        'id': student.id,
        'fornavn': student.fornavn,
        'efternavn': student.efternavn,
        'email': student.email,
        'foedselsdato': student.foedselsdato.isoformat() if student.foedselsdato else None,
        'elevnummer': student.elevnummer,
        'klasse_id': student.klasse_id,
        'aktiv': student.aktiv,
        'oprettet_dato': student.oprettet_dato.isoformat() if student.oprettet_dato else None
    }
    return schemas.Student(**response_dict)

# Teachers endpoints
@app.get("/teachers/", response_model=List[schemas.Teacher])
def get_teachers(db: Session = Depends(get_db)):
    teachers = db.query(models.Teacher).all()
    # Konverter datetime til string for response
    result = []
    for teacher in teachers:
        teacher_dict = {
            'id': teacher.id,
            'fornavn': teacher.fornavn,
            'efternavn': teacher.efternavn,
            'email': teacher.email,
            'initialer': teacher.initialer,
            'telefon': teacher.telefon,
            'ansat_dato': teacher.ansat_dato.isoformat() if teacher.ansat_dato else None,
            'stilling': teacher.stilling,
            'aktiv': teacher.aktiv,
            'oprettet_dato': teacher.oprettet_dato.isoformat() if teacher.oprettet_dato else None
        }
        result.append(schemas.Teacher(**teacher_dict))
    return result

@app.post("/teachers/", response_model=schemas.Teacher)
def create_teacher(teacher: schemas.TeacherCreate, db: Session = Depends(get_db)):
    # Debug: Print hvad vi modtager
    print(f"Modtaget teacher data: {teacher}")
    print(f"ansat_dato type: {type(teacher.ansat_dato)}")
    print(f"ansat_dato value: {teacher.ansat_dato}")
    
    # Konverter string til datetime manuelt
    teacher_data = teacher.model_dump()
    if teacher_data.get('ansat_dato'):
        teacher_data['ansat_dato'] = datetime.fromisoformat(teacher_data['ansat_dato'].replace('Z', '+00:00'))
    
    db_teacher = models.Teacher(**teacher_data)
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    
    # Konverter tilbage til string for response
    response_dict = {
        'id': db_teacher.id,
        'fornavn': db_teacher.fornavn,
        'efternavn': db_teacher.efternavn,
        'email': db_teacher.email,
        'initialer': db_teacher.initialer,
        'telefon': db_teacher.telefon,
        'ansat_dato': db_teacher.ansat_dato.isoformat() if db_teacher.ansat_dato else None,
        'stilling': db_teacher.stilling,
        'aktiv': db_teacher.aktiv,
        'oprettet_dato': db_teacher.oprettet_dato.isoformat() if db_teacher.oprettet_dato else None
    }
    return schemas.Teacher(**response_dict)

@app.delete("/teachers/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    db.delete(teacher)
    db.commit()
    return {"message": "Teacher deleted successfully"}

@app.get("/teachers/{teacher_id}", response_model=schemas.Teacher)
def get_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Konverter datetime til string for response
    response_dict = {
        'id': teacher.id,
        'fornavn': teacher.fornavn,
        'efternavn': teacher.efternavn,
        'email': teacher.email,
        'initialer': teacher.initialer,
        'telefon': teacher.telefon,
        'ansat_dato': teacher.ansat_dato.isoformat() if teacher.ansat_dato else None,
        'stilling': teacher.stilling,
        'aktiv': teacher.aktiv,
        'oprettet_dato': teacher.oprettet_dato.isoformat() if teacher.oprettet_dato else None
    }
    return schemas.Teacher(**response_dict)

# Classrooms endpoints
@app.get("/classrooms/", response_model=List[schemas.Classroom])
def get_classrooms(db: Session = Depends(get_db)):
    classrooms = db.query(models.Classroom).all()
    return classrooms

@app.post("/classrooms/", response_model=schemas.Classroom)
def create_classroom(classroom: schemas.ClassroomCreate, db: Session = Depends(get_db)):
    db_classroom = models.Classroom(**classroom.model_dump())
    db.add(db_classroom)
    db.commit()
    db.refresh(db_classroom)
    return db_classroom

@app.get("/classrooms/{classroom_id}", response_model=schemas.Classroom)
def get_classroom(classroom_id: int, db: Session = Depends(get_db)):
    classroom = db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()
    if classroom is None:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return classroom

# Subjects endpoints
@app.get("/subjects/", response_model=List[schemas.Subject])
def get_subjects(db: Session = Depends(get_db)):
    subjects = db.query(models.Subject).all()
    return subjects

@app.post("/subjects/", response_model=schemas.Subject)
def create_subject(subject: schemas.SubjectCreate, db: Session = Depends(get_db)):
    db_subject = models.Subject(**subject.model_dump())
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

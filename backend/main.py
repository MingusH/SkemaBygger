from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.orm import joinedload, Session
from sqlalchemy import and_, or_
from datetime import datetime, date, time
from typing import List, Optional, Dict

import models
import schemas
import database
from database import engine, SessionLocal

app = FastAPI(title="SkemaBygger API", description="API til folkeskole skemalægning")

# Exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"Validation error: {exc}")
    print(f"Error details: {exc.errors()}")
    
    # Simple error response uden time objects
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation error - check your input data"},
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

# Subjects endpoints
@app.get("/subjects/", response_model=List[schemas.Subject])
def get_subjects(db: Session = Depends(get_db)):
    subjects = db.query(models.Subject).all()
    result = []
    for subject in subjects:
        teacher_ids = [teacher.id for teacher in subject.teachers]
        subject_dict = {
            'id': subject.id,
            'navn': subject.navn,
            'kort_navn': subject.kort_navn,
            'farve': subject.farve,
            'aktiv': subject.aktiv,
            'teacher_ids': teacher_ids,
            'room_id': subject.room_id,
            'created_at': subject.created_at,
            'room': subject.room
        }
        result.append(schemas.Subject(**subject_dict))
    return result

@app.post("/subjects/", response_model=schemas.Subject)
def create_subject(subject: schemas.SubjectCreate, db: Session = Depends(get_db)):
    # Create subject without teacher_ids first
    subject_data = subject.model_dump(exclude={'teacher_ids'})
    db_subject = models.Subject(**subject_data)
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    
    # Add teachers to subject
    if subject.teacher_ids:
        teachers = db.query(models.Teacher).filter(models.Teacher.id.in_(subject.teacher_ids)).all()
        db_subject.teachers.extend(teachers)
        db.commit()
        db.refresh(db_subject)
    
    # Prepare response with room info
    response_dict = {
        'id': db_subject.id,
        'navn': db_subject.navn,
        'kort_navn': db_subject.kort_navn,
        'farve': db_subject.farve,
        'aktiv': db_subject.aktiv,
        'teacher_ids': subject.teacher_ids,
        'room_id': db_subject.room_id,
        'created_at': db_subject.created_at,
        'room': db_subject.room
    }
    return schemas.Subject(**response_dict)

@app.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    db.delete(subject)
    db.commit()
    return {"message": "Subject deleted successfully"}

# TimeSlot endpoints
@app.get("/timeslots/", response_model=List[schemas.TimeSlot])
def get_timeslots(db: Session = Depends(get_db)):
    timeslots = db.query(models.TimeSlot).filter(models.TimeSlot.active == True).order_by(
        models.TimeSlot.day_of_week, models.TimeSlot.slot_number
    ).all()
    
    # Konverter time objects til strings for response
    result = []
    for timeslot in timeslots:
        timeslot_dict = {
            'id': timeslot.id,
            'start_time': timeslot.start_time.strftime('%H:%M'),
            'end_time': timeslot.end_time.strftime('%H:%M'),
            'day_of_week': timeslot.day_of_week,
            'slot_number': timeslot.slot_number,
            'is_break': timeslot.is_break,
            'break_type': timeslot.break_type,
            'active': timeslot.active
        }
        result.append(schemas.TimeSlot(**timeslot_dict))
    return result

@app.post("/timeslots/", response_model=schemas.TimeSlot)
def create_timeslot(timeslot: schemas.TimeSlotCreate, db: Session = Depends(get_db)):
    # Konverter strings til time objects for SQLAlchemy
    timeslot_data = timeslot.model_dump()
    timeslot_data['start_time'] = datetime.strptime(timeslot.start_time, '%H:%M').time()
    timeslot_data['end_time'] = datetime.strptime(timeslot.end_time, '%H:%M').time()
    
    db_timeslot = models.TimeSlot(**timeslot_data)
    db.add(db_timeslot)
    db.commit()
    db.refresh(db_timeslot)
    
    # Konverter time objects til strings for response
    response_dict = {
        'id': db_timeslot.id,
        'start_time': db_timeslot.start_time.strftime('%H:%M'),
        'end_time': db_timeslot.end_time.strftime('%H:%M'),
        'day_of_week': db_timeslot.day_of_week,
        'slot_number': db_timeslot.slot_number,
        'is_break': db_timeslot.is_break,
        'break_type': db_timeslot.break_type,
        'active': db_timeslot.active
    }
    return schemas.TimeSlot(**response_dict)

@app.delete("/timeslots/{timeslot_id}")
def delete_timeslot(timeslot_id: int, db: Session = Depends(get_db)):
    timeslot = db.query(models.TimeSlot).filter(models.TimeSlot.id == timeslot_id).first()
    if timeslot is None:
        raise HTTPException(status_code=404, detail="TimeSlot not found")
    
    db.delete(timeslot)
    db.commit()
    return {"message": "TimeSlot deleted successfully"}

# Classroom endpoints
@app.get("/classrooms/", response_model=List[schemas.Classroom])
def get_classrooms(db: Session = Depends(get_db)):
    classrooms = db.query(models.Classroom).all()
    result = []
    for classroom in classrooms:
        subject_ids = [subject.id for subject in classroom.subjects]
        classroom_dict = {
            'id': classroom.id,
            'name': classroom.name,
            'start_year': classroom.start_year,
            'class_teacher_id': classroom.class_teacher_id,
            'room': classroom.room,
            'active': classroom.active,
            'subject_ids': subject_ids,
            'created_at': classroom.created_at.isoformat() if classroom.created_at else None
        }
        result.append(schemas.Classroom(**classroom_dict))
    return result

@app.post("/classrooms/", response_model=schemas.Classroom)
def create_classroom(classroom: schemas.ClassroomCreate, db: Session = Depends(get_db)):
    # Fjern subject_ids fra classroom data (mange-til-mange håndteres separat)
    classroom_data = classroom.model_dump()
    subject_ids = classroom_data.pop('subject_ids', [])
    
    db_classroom = models.Classroom(**classroom_data)
    db.add(db_classroom)
    db.commit()
    db.refresh(db_classroom)
    
    # Tilføj subjects til classroom
    if subject_ids:
        subjects = db.query(models.Subject).filter(models.Subject.id.in_(subject_ids)).all()
        db_classroom.subjects.extend(subjects)
        db.commit()
        db.refresh(db_classroom)
    
    # Konverter tilbage til string for response
    response_dict = {
        'id': db_classroom.id,
        'name': db_classroom.name,
        'start_year': db_classroom.start_year,
        'class_teacher_id': db_classroom.class_teacher_id,
        'room': db_classroom.room,
        'active': db_classroom.active,
        'subject_ids': subject_ids,
        'created_at': db_classroom.created_at.isoformat() if db_classroom.created_at else None
    }
    return schemas.Classroom(**response_dict)

@app.delete("/classrooms/{classroom_id}")
def delete_classroom(classroom_id: int, db: Session = Depends(get_db)):
    classroom = db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()
    if classroom is None:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Delete classroom subjects first
    #db.query(models.ClassroomSubject).filter(models.ClassroomSubject.class_id == classroom_id).delete()
    db.delete(classroom)
    
    db.commit()
    return {"message": "Classroom deleted successfully"}

# Teacher Availability endpoints
@app.get("/teachers/availability/{teacher_id}", response_model=List[schemas.TeacherAvailability])
def get_teacher_availability(teacher_id: int, db: Session = Depends(get_db)):
    availability = db.query(models.TeacherAvailability).filter(
        models.TeacherAvailability.teacher_id == teacher_id
    ).options(
        joinedload(models.TeacherAvailability.teacher),
        joinedload(models.TeacherAvailability.timeslot)
    ).all()
    return availability

@app.post("/teachers/availability/", response_model=schemas.TeacherAvailability)
def create_teacher_availability(availability: schemas.TeacherAvailabilityCreate, db: Session = Depends(get_db)):
    from datetime import datetime
    
    # Konverter date string til date objekt hvis nødvendigt
    data = availability.model_dump()
    if data.get('date') and isinstance(data['date'], str):
        data['date'] = datetime.strptime(data['date'], '%Y-%m-%d').date()
    
    db_availability = models.TeacherAvailability(**data)
    db.add(db_availability)
    db.commit()
    db.refresh(db_availability)
    return db_availability

@app.put("/teachers/availability/{availability_id}", response_model=schemas.TeacherAvailability)
def update_teacher_availability(availability_id: int, availability: schemas.TeacherAvailabilityCreate, db: Session = Depends(get_db)):
    db_availability = db.query(models.TeacherAvailability).filter(
        models.TeacherAvailability.id == availability_id
    ).first()
    if db_availability is None:
        raise HTTPException(status_code=404, detail="Teacher availability not found")
    
    for key, value in availability.model_dump().items():
        setattr(db_availability, key, value)
    
    db.commit()
    db.refresh(db_availability)
    return db_availability

@app.delete("/teachers/availability/{availability_id}")
def delete_teacher_availability(availability_id: int, db: Session = Depends(get_db)):
    availability = db.query(models.TeacherAvailability).filter(
        models.TeacherAvailability.id == availability_id
    ).first()
    if availability is None:
        raise HTTPException(status_code=404, detail="Teacher availability not found")
    
    db.delete(availability)
    db.commit()
    return {"message": "Teacher availability deleted successfully"}

# Special Days endpoints
@app.get("/special-days/", response_model=List[schemas.SpecialDay])
def get_special_days(db: Session = Depends(get_db)):
    special_days = db.query(models.SpecialDay).filter(
        models.SpecialDay.active == True
    ).options(
        joinedload(models.SpecialDay.teachers)
    ).all()
    return special_days

@app.post("/special-days/", response_model=schemas.SpecialDay)
def create_special_day(special_day: schemas.SpecialDayCreate, db: Session = Depends(get_db)):
    from datetime import datetime, time
    
    # Konverter string til date/time objekter
    data = special_day.model_dump()
    if data.get('date') and isinstance(data['date'], str):
        data['date'] = datetime.strptime(data['date'], '%Y-%m-%d').date()
    if data.get('start_time') and isinstance(data['start_time'], str):
        # Håndter både "HH:MM" og "HH:MM:SS" formater
        try:
            data['start_time'] = datetime.strptime(data['start_time'], '%H:%M:%S').time()
        except ValueError:
            data['start_time'] = datetime.strptime(data['start_time'], '%H:%M').time()
    if data.get('end_time') and isinstance(data['end_time'], str):
        # Håndter både "HH:MM" og "HH:MM:SS" formater
        try:
            data['end_time'] = datetime.strptime(data['end_time'], '%H:%M:%S').time()
        except ValueError:
            data['end_time'] = datetime.strptime(data['end_time'], '%H:%M').time()
    
    db_special_day = models.SpecialDay(**data)
    db.add(db_special_day)
    db.commit()
    db.refresh(db_special_day)
    return db_special_day

@app.get("/special-days/{day_id}", response_model=schemas.SpecialDay)
def get_special_day(day_id: int, db: Session = Depends(get_db)):
    special_day = db.query(models.SpecialDay).filter(
        models.SpecialDay.id == day_id
    ).options(
        joinedload(models.SpecialDay.teachers)
    ).first()
    if special_day is None:
        raise HTTPException(status_code=404, detail="Special day not found")
    return special_day

@app.put("/special-days/{day_id}", response_model=schemas.SpecialDay)
def update_special_day(day_id: int, special_day: schemas.SpecialDayCreate, db: Session = Depends(get_db)):
    from datetime import datetime, time
    
    db_special_day = db.query(models.SpecialDay).filter(
        models.SpecialDay.id == day_id
    ).first()
    if db_special_day is None:
        raise HTTPException(status_code=404, detail="Special day not found")
    
    # Konverter string til date/time objekter
    data = special_day.model_dump()
    if data.get('date') and isinstance(data['date'], str):
        data['date'] = datetime.strptime(data['date'], '%Y-%m-%d').date()
    if data.get('start_time') and isinstance(data['start_time'], str):
        # Håndter både "HH:MM" og "HH:MM:SS" formater
        try:
            data['start_time'] = datetime.strptime(data['start_time'], '%H:%M:%S').time()
        except ValueError:
            data['start_time'] = datetime.strptime(data['start_time'], '%H:%M').time()
    if data.get('end_time') and isinstance(data['end_time'], str):
        # Håndter både "HH:MM" og "HH:MM:SS" formater
        try:
            data['end_time'] = datetime.strptime(data['end_time'], '%H:%M:%S').time()
        except ValueError:
            data['end_time'] = datetime.strptime(data['end_time'], '%H:%M').time()
    
    for key, value in data.items():
        setattr(db_special_day, key, value)
    
    db.commit()
    db.refresh(db_special_day)
    return db_special_day

@app.delete("/special-days/{day_id}")
def delete_special_day(day_id: int, db: Session = Depends(get_db)):
    special_day = db.query(models.SpecialDay).filter(
        models.SpecialDay.id == day_id
    ).first()
    if special_day is None:
        raise HTTPException(status_code=404, detail="Special day not found")
    
    db.delete(special_day)
    db.commit()
    return {"message": "Special day deleted successfully"}

# Teacher-Special Day management endpoints
@app.get("/special-days/{day_id}/teachers", response_model=List[schemas.Teacher])
def get_teachers_for_special_day(day_id: int, db: Session = Depends(get_db)):
    special_day = db.query(models.SpecialDay).filter(
        models.SpecialDay.id == day_id
    ).first()
    if special_day is None:
        raise HTTPException(status_code=404, detail="Special day not found")
    
    return special_day.teachers

@app.post("/special-days/{day_id}/teachers/{teacher_id}")
def add_teacher_to_special_day(day_id: int, teacher_id: int, db: Session = Depends(get_db)):
    special_day = db.query(models.SpecialDay).filter(
        models.SpecialDay.id == day_id
    ).first()
    if special_day is None:
        raise HTTPException(status_code=404, detail="Special day not found")
    
    teacher = db.query(models.Teacher).filter(
        models.Teacher.id == teacher_id
    ).first()
    if teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Check if relationship already exists
    if teacher in special_day.teachers:
        raise HTTPException(status_code=400, detail="Teacher already added to special day")
    
    special_day.teachers.append(teacher)
    db.commit()
    return {"message": "Teacher added to special day successfully"}

@app.delete("/special-days/{day_id}/teachers/{teacher_id}")
def remove_teacher_from_special_day(day_id: int, teacher_id: int, db: Session = Depends(get_db)):
    special_day = db.query(models.SpecialDay).filter(
        models.SpecialDay.id == day_id
    ).first()
    if special_day is None:
        raise HTTPException(status_code=404, detail="Special day not found")
    
    teacher = db.query(models.Teacher).filter(
        models.Teacher.id == teacher_id
    ).first()
    if teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    if teacher not in special_day.teachers:
        raise HTTPException(status_code=404, detail="Teacher not found in special day")
    
    special_day.teachers.remove(teacher)
    db.commit()
    return {"message": "Teacher removed from special day successfully"}

@app.get("/teachers/{teacher_id}/special-days", response_model=List[schemas.SpecialDay])
def get_special_days_for_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(models.Teacher).filter(
        models.Teacher.id == teacher_id
    ).first()
    if teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    return teacher.special_days
    
    # Convert date string to date object
    try:
        date_obj = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Check for unavailability records (available = false)
    unavailability = db.query(models.TeacherAvailability).filter(
        models.TeacherAvailability.teacher_id == teacher_id,
        models.TeacherAvailability.available == False  # Only check unavailability
    ).all()
    
    # Check specific date unavailability
    specific_unavailable = any(
        u for u in unavailability 
        if u.date == date_obj and u.timeslot_id == timeslot_id
    )
    
    if specific_unavailable:
        reason = next(u.reason for u in unavailability if u.date == date_obj and u.timeslot_id == timeslot_id)
        return {"available": False, "reason": reason}
    
    # Check recurring unavailability
    day_of_week = date_obj.weekday()  # 0 = Monday
    recurring_unavailable = any(
        u for u in unavailability 
        if u.day_of_week == day_of_week and u.timeslot_id == timeslot_id and u.date is None
    )
    
    if recurring_unavailable:
        reason = next(u.reason for u in unavailability if u.day_of_week == day_of_week and u.timeslot_id == timeslot_id and u.date is None)
        return {"available": False, "reason": reason}
    
    # Default to available if no unavailability found
    return {"available": True, "reason": None}
@app.get("/rooms/", response_model=List[schemas.Room])
def get_rooms(db: Session = Depends(get_db)):
    rooms = db.query(models.Room).all()
    return rooms

@app.post("/rooms/", response_model=schemas.Room)
def create_room(room: schemas.RoomCreate, db: Session = Depends(get_db)):
    db_room = models.Room(**room.model_dump())
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

@app.delete("/rooms/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    
    db.delete(room)
    db.commit()
    return {"message": "Room deleted successfully"}

# Room Assignment endpoints
@app.get("/room-assignments/", response_model=List[schemas.RoomAssignment])
def get_room_assignments(db: Session = Depends(get_db)):
    assignments = db.query(models.RoomAssignment).all()
    return assignments

@app.post("/room-assignments/", response_model=schemas.RoomAssignment)
def create_room_assignment(assignment: schemas.RoomAssignmentCreate, db: Session = Depends(get_db)):
    db_assignment = models.RoomAssignment(**assignment.model_dump())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@app.get("/rooms/available/{date}/{timeslot_id}")
def get_available_rooms(date: str, timeslot_id: int, db: Session = Depends(get_db)):
    # Find rooms that are not booked at the given date and timeslot
    booked_room_ids = db.query(models.RoomAssignment.room_id).filter(
        models.RoomAssignment.date == date,
        models.RoomAssignment.timeslot_id == timeslot_id
    ).all()
    
    booked_ids = [room_id[0] for room_id in booked_room_ids]
    
    available_rooms = db.query(models.Room).filter(
        models.Room.id.notin_(booked_ids),
        models.Room.active == True
    ).all()
    
    return available_rooms

@app.get("/schedule/generate/")
def generate_schedule(db: Session = Depends(get_db)):
    """Generate and return schedule from schedule_solver"""
    try:
        from schedule_solver import Schedule
        
        # Create and solve schedule
        schedule = Schedule(db)
        schedule.solve()
        
        # Convert lessons to JSON-serializable format
        lessons_data = []
        for lesson in schedule.lessons:
            # Handle room - it could be a string (room name) or a Room object
            room_data = None
            if lesson.room:
                if isinstance(lesson.room, str):
                    # room is a string (room name from classroom.room)
                    room_data = {"id": None, "name": lesson.room}
                else:
                    # room is a Room object
                    room_data = {"id": lesson.room.id, "name": lesson.room.name}
            
            lesson_data = {
                "id": getattr(lesson, 'id', None) or len(lessons_data) + 1,
                "subject": {
                    "id": lesson.subject.id if lesson.subject else None,
                    "navn": lesson.subject.navn if lesson.subject else None,
                    "farve": lesson.subject.farve if lesson.subject else "#e3f2fd"
                } if lesson.subject else None,
                "teacher": {
                    "id": lesson.teacher.id if lesson.teacher else None,
                    "fornavn": lesson.teacher.fornavn if lesson.teacher else None,
                    "efternavn": lesson.teacher.efternavn if lesson.teacher else None
                } if lesson.teacher else None,
                "room": room_data,
                "classroom": {
                    "id": lesson.classroom.id if lesson.classroom else None,
                    "name": lesson.classroom.name if lesson.classroom else None
                } if lesson.classroom else None,
                "timeslot": {
                    "id": lesson.timeslot.id if lesson.timeslot else None,
                    "start_time": str(lesson.timeslot.start_time) if lesson.timeslot else None,
                    "end_time": str(lesson.timeslot.end_time) if lesson.timeslot else None,
                    "day_of_week": lesson.timeslot.day_of_week if lesson.timeslot else None
                } if lesson.timeslot else None
            }
            lessons_data.append(lesson_data)
        
        # Get classrooms and timeslots
        classrooms_data = [{"id": c.id, "name": c.name} for c in schedule.classrooms]
        timeslots_data = [
            {
                "id": t.id, 
                "start_time": str(t.start_time), 
                "end_time": str(t.end_time), 
                "day_of_week": t.day_of_week
            } for t in schedule.timeslots
        ]
        
        return {
            "lessons": lessons_data,
            "classrooms": classrooms_data,
            "timeslots": timeslots_data,
            "total_lessons": len(lessons_data),
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error generating schedule: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating schedule: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "SkemaBygger API is running!"}

if __name__ == "__main__":
    import uvicorn
    print("Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False, log_level="info")

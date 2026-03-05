from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, time

class StudentBase(BaseModel):
    fornavn: str
    efternavn: str
    email: str
    foedselsdato: str  # Modtag som string fra frontend
    elevnummer: str
    klasse_id: int
    aktiv: bool = True

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: int
    oprettet_dato: str  # Returner som string
    
    # Fjern field_validator - vi modtager kun strings her
    
    class Config:
        from_attributes = True

class TeacherBase(BaseModel):
    fornavn: str
    efternavn: str
    email: str
    initialer: str
    telefon: Optional[str] = None
    ansat_dato: str  # Modtag som string fra frontend
    stilling: str
    aktiv: bool = True

class TeacherCreate(TeacherBase):
    pass

class Teacher(TeacherBase):
    id: int
    oprettet_dato: str  # Returner som string
    
    # Fjern field_validator - vi modtager kun strings her
    
    class Config:
        from_attributes = True

class ClassroomBase(BaseModel):
    name: str
    start_year: int
    class_teacher_id: Optional[int] = None
    room: Optional[str] = None
    active: bool = True

class ClassroomCreate(ClassroomBase):
    subject_ids: List[int] = []  # List of subject IDs for many-to-many

class Classroom(ClassroomBase):
    id: int
    subject_ids: List[int] = []  # List of subject IDs
    created_at: str  # Returner som string
    
    class Config:
        from_attributes = True

class SubjectBase(BaseModel):
    navn: str
    kort_navn: str
    farve: str = "#007bff"
    aktiv: bool = True

class SubjectCreate(SubjectBase):
    teacher_ids: List[int] = []  # List of teacher IDs for many-to-many
    class_ids: List[int] = []   # List of classroom IDs for many-to-many

class Subject(SubjectBase):
    id: int
    teacher_ids: List[int] = []  # List of teacher IDs
    class_ids: List[int] = []   # List of classroom IDs
    
    class Config:
        from_attributes = True

# TimeSlot schemas
class TimeSlotBase(BaseModel):
    start_time: str  # "08:00" - modtag som string fra frontend
    end_time: str    # "08:45" - modtag som string fra frontend
    day_of_week: int  # 0-6 (Mandag-Søndag)
    slot_number: int  # 1, 2, 3...
    is_break: bool = False
    break_type: Optional[str] = None  # "frokost", "lille_pause"
    active: bool = True

class TimeSlotCreate(TimeSlotBase):
    pass

class TimeSlot(TimeSlotBase):
    id: int
    start_time: str  # Returner som string til frontend
    end_time: str    # Returner som string til frontend
    
    class Config:
        from_attributes = True

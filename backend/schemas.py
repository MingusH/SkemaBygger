from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime

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
    pass

class Classroom(ClassroomBase):
    id: int
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

class Subject(SubjectBase):
    id: int
    teacher_ids: List[int] = []  # List of teacher IDs
    
    class Config:
        from_attributes = True

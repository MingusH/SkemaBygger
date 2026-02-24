from pydantic import BaseModel, field_validator
from typing import Optional
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
    navn: str
    aargang: str
    skoleaar: str
    laerer_id: int
    kapacitet: int = 30
    lokale: Optional[str] = None
    aktiv: bool = True

class ClassroomCreate(ClassroomBase):
    pass

class Classroom(ClassroomBase):
    id: int
    oprettet_dato: datetime
    
    class Config:
        from_attributes = True

class SubjectBase(BaseModel):
    navn: str
    kort_navn: str
    laerer_id: int
    farve: str = "#007bff"
    aktiv: bool = True

class SubjectCreate(SubjectBase):
    pass

class Subject(SubjectBase):
    id: int
    
    class Config:
        from_attributes = True

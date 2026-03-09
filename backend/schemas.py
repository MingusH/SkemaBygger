from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime, time, date

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
    model_config = ConfigDict(from_attributes=True)
    id: int
    oprettet_dato: str  # Returner som string
    
    @field_validator('oprettet_dato', mode='before')
    @classmethod
    def convert_datetime_to_str(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
    @field_validator('ansat_dato', mode='before')
    @classmethod
    def convert_date_to_str(cls, v):
        if isinstance(v, (date, datetime)):
            return v.isoformat()
        return v

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
    farve: str
    aktiv: bool
    teacher_ids: List[int] = []  # List of teacher IDs
    room_id: Optional[int] = None  # Required room for this subject

class SubjectCreate(SubjectBase):
    pass

class Subject(SubjectBase):
    id: int
    created_at: datetime
    room: Optional['Room'] = None  # Forward reference
    
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
    model_config = ConfigDict(from_attributes=True)
    id: int
    start_time: str  # Returner som string til frontend
    end_time: str    # Returner som string til frontend
    
    @field_validator('start_time', 'end_time', mode='before')
    @classmethod
    def convert_time_to_str(cls, v):
        if isinstance(v, time):
            return v.isoformat()
        return v

# Teacher Availability schemas
class TeacherAvailabilityBase(BaseModel):
    teacher_id: int
    timeslot_id: Optional[int] = None  # Gør optional
    date: Optional[date] = None
    day_of_week: Optional[int] = None
    available: bool = True
    reason: Optional[str] = None

class TeacherAvailabilityCreate(TeacherAvailabilityBase):
    pass

class TeacherAvailability(TeacherAvailabilityBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: str  # Returner som string
    teacher: Teacher
    timeslot: Optional[TimeSlot]  # Gør optional hvis timeslot kan være None
    
    @field_validator('created_at', mode='before')
    @classmethod
    def convert_datetime_to_str(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v

# Room Schemas
class RoomBase(BaseModel):
    name: str
    room_type: str  # 'homeroom' eller 'special'
    capacity: int
    equipment: Optional[str] = None
    active: bool = True

class RoomCreate(RoomBase):
    pass

class Room(RoomBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Room Assignment Schemas
class RoomAssignmentBase(BaseModel):
    room_id: int
    subject_id: int
    classroom_id: int
    timeslot_id: int
    date: date

class RoomAssignmentCreate(RoomAssignmentBase):
    pass

class RoomAssignment(RoomAssignmentBase):
    id: int
    created_at: datetime
    room: Room
    subject: Subject
    classroom: Classroom
    timeslot: TimeSlot
    
    class Config:
        from_attributes = True

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text, Table, Time, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

# Association table for many-to-many relationship between teachers and subjects
teacher_subjects = Table(
    'teacher_subjects',
    Base.metadata,
    Column('teacher_id', Integer, ForeignKey('teachers.id'), primary_key=True),
    Column('subject_id', Integer, ForeignKey('subjects.id'), primary_key=True)
)

# Association table for many-to-many relationship between classrooms and subjects
class_subjects = Table(
    'class_subjects',
    Base.metadata,
    Column('class_id', Integer, ForeignKey('classrooms.id'), primary_key=True),
    Column('subject_id', Integer, ForeignKey('subjects.id'), primary_key=True)
)

class TimeSlot(Base):
    __tablename__ = "timeslots"
    
    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(Time, nullable=False)      # "08:00"
    end_time = Column(Time, nullable=False)        # "08:45"
    day_of_week = Column(Integer, nullable=False)  # 0-6 (Mandag-Søndag)
    slot_number = Column(Integer, nullable=False)  # 1, 2, 3...
    is_break = Column(Boolean, default=False)      # True for pauser
    break_type = Column(String, nullable=True)     # "frokost", "lille_pause"
    active = Column(Boolean, default=True)

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    fornavn = Column(String, index=True)
    efternavn = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    foedselsdato = Column(DateTime)
    elevnummer = Column(String, unique=True, index=True)
    klasse_id = Column(Integer, ForeignKey("classrooms.id"))
    aktiv = Column(Boolean, default=True)
    oprettet_dato = Column(DateTime, default=datetime.utcnow)
    
    klasse = relationship("Classroom", back_populates="students")

class Teacher(Base):
    __tablename__ = "teachers"
    
    id = Column(Integer, primary_key=True, index=True)
    fornavn = Column(String, index=True)
    efternavn = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    initialer = Column(String, unique=True, index=True)
    telefon = Column(String, nullable=True)
    ansat_dato = Column(DateTime)
    stilling = Column(String)  # f.eks. "Lærer", "Viceinspektør", "Inspektør"
    aktiv = Column(Boolean, default=True)
    oprettet_dato = Column(DateTime, default=datetime.utcnow)
    
    classrooms = relationship("Classroom", back_populates="class_teacher")
    subjects = relationship("Subject", secondary=teacher_subjects, back_populates="teachers")

class Classroom(Base):
    __tablename__ = "classrooms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # f.eks. "3.A", "5.B"
    start_year = Column(Integer)  # f.eks. 2020 (år de startede i skole)
    class_teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    room = Column(String, nullable=True)  # f.eks. "Rum 101"
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    class_teacher = relationship("Teacher", back_populates="classrooms")
    students = relationship("Student", back_populates="klasse")
    subjects = relationship("Subject", secondary=class_subjects, back_populates="classrooms")

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    navn = Column(String, unique=True, index=True)  # f.eks. "Matematik", "Dansk"
    kort_navn = Column(String)  # f.eks. "Mat", "Da"
    farve = Column(String, default="#007bff")  # Til UI farvekodning
    aktiv = Column(Boolean, default=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)  # Required room for this subject
    created_at = Column(DateTime, default=datetime.utcnow)  # Tilføj created_at
    
    teachers = relationship("Teacher", secondary=teacher_subjects, back_populates="subjects")
    classrooms = relationship("Classroom", secondary=class_subjects, back_populates="subjects")
    room = relationship("Room", backref="subjects")

class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # f.eks. "Kemilab", "Fysikrum", "Musiklokale"
    room_type = Column(String, index=True)  # 'homeroom' eller 'special'
    capacity = Column(Integer)  # Antal elever der kan være i lokalet
    equipment = Column(Text, nullable=True)  # f.eks. "Laboratorieudstyr, projektor"
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class RoomAssignment(Base):
    __tablename__ = "room_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    timeslot_id = Column(Integer, ForeignKey("timeslots.id"))
    date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    room = relationship("Room")
    subject = relationship("Subject")
    classroom = relationship("Classroom")
    timeslot = relationship("TimeSlot")

# Association table for many-to-many relationship between teachers and special days
teacher_special_days = Table(
    'teacher_special_days',
    Base.metadata,
    Column('teacher_id', Integer, ForeignKey('teachers.id'), primary_key=True),
    Column('special_day_id', Integer, ForeignKey('special_days.id'), primary_key=True)
)

class SpecialDay(Base):
    __tablename__ = "special_days"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    name = Column(String, nullable=False)  # e.g., "Forældremøde", "Workshop", "Eksamensdag"
    start_time = Column(Time, nullable=True)  # optional start time
    end_time = Column(Time, nullable=True)    # optional end time
    description = Column(Text, nullable=True)  # optional description
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    teachers = relationship("Teacher", secondary=teacher_special_days, backref="special_days")

class TeacherAvailability(Base):
    __tablename__ = "teacher_availability"
 
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    timeslot_id = Column(Integer, ForeignKey("timeslots.id"))
    date = Column(Date, nullable=True)  # For specific dates
    day_of_week = Column(Integer, nullable=True)  # 0-6 for recurring (Mandag-Søndag)
    available = Column(Boolean, default=True)
    reason = Column(String, nullable=True)  # f.eks. "Syg", "Ferie", "Kursus"
    created_at = Column(DateTime, default=datetime.utcnow)
 
    # Relationships
    teacher = relationship("Teacher", backref="availability")
    timeslot = relationship("TimeSlot", backref="teacher_availability")
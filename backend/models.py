from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

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
    
    klasse = relationship("Classroom", back_populates="elever")

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
    
    klasser = relationship("Classroom", back_populates="laerer")
    fag = relationship("Subject", back_populates="laerer")

class Classroom(Base):
    __tablename__ = "classrooms"
    
    id = Column(Integer, primary_key=True, index=True)
    navn = Column(String, unique=True, index=True)  # f.eks. "3.A", "5.B"
    aargang = Column(String)  # f.eks. "3. klasse", "5. klasse"
    skoleaar = Column(String)  # f.eks. "2023/2024"
    laerer_id = Column(Integer, ForeignKey("teachers.id"))
    kapacitet = Column(Integer, default=30)
    lokale = Column(String, nullable=True)
    aktiv = Column(Boolean, default=True)
    oprettet_dato = Column(DateTime, default=datetime.utcnow)
    
    laerer = relationship("Teacher", back_populates="klasser")
    elever = relationship("Student", back_populates="klasse")

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    navn = Column(String, unique=True, index=True)  # f.eks. "Matematik", "Dansk"
    kort_navn = Column(String)  # f.eks. "Mat", "Da"
    laerer_id = Column(Integer, ForeignKey("teachers.id"))
    farve = Column(String, default="#007bff")  # Til UI farvekodning
    aktiv = Column(Boolean, default=True)
    
    laerer = relationship("Teacher", back_populates="fag")

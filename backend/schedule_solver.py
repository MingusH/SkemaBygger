from database import get_db, SessionLocal, engine
from fastapi import Depends
from sqlalchemy.orm import Session
import models
import random


class Schedule:
    def __init__(self, db: Session = Depends(get_db)):
        self.teachers = db.query(models.Teacher).all()
        self.teacher_availability = db.query(models.TeacherAvailability).all()
        self.classrooms = db.query(models.Classroom).all()
        self.rooms = db.query(models.Room).all()
        self.subjects = db.query(models.Subject).all()
        self.timeslots = db.query(models.TimeSlot).all()
        self.class_subjects = db.query(models.class_subjects).all()
        self.teacher_subjects = db.query(models.teacher_subjects).all()
        self.teacher_special_days = db.query(models.teacher_special_days).all()
        self.lessons = []

    def __repr__(self):
        return f"Schedule(teachers={len(self.teachers)}, classrooms={len(self.classrooms)}, rooms={len(self.rooms)}, subjects={len(self.subjects)}, timeslots={len(self.timeslots)})"

    def get_lessons_for_timeslot(self, timeslot):
        return [lesson for lesson in self.lessons if lesson.timeslot == timeslot]

    def get_available_teachers(self, timeslot):
        available_teachers = [teacher for teacher in self.teachers if teacher.id not in [availability.teacher_id for availability in self.teacher_availability if availability.timeslot_id == timeslot.id]]
        lessons = self.get_lessons_for_timeslot(timeslot)
        for lesson in lessons:
            if lesson.teacher in available_teachers:
                available_teachers.remove(lesson.teacher)
        return available_teachers

    def get_classroom_subjects(self, classroom):
        return [self.subjects[class_subject.subject_id - 1] for class_subject in self.class_subjects if class_subject.class_id == classroom.id]

    def get_days_lessons_sorted(self, timeslot, classroom):
        lessons = [lesson for lesson in self.lessons if lesson.timeslot.day_of_week == timeslot.day_of_week and lesson.classroom == classroom]
        lessons.sort(key=lambda x: x.timeslot.start_time)
        return lessons

    def get_available_lessons(self, timeslot, classroom):
        # get available teachers and subjects for the given timeslot and classroom
        available_teachers = self.get_available_teachers(timeslot)
        available_subjects = self.get_classroom_subjects(classroom)
        
        # find matching teacher-subject pairs
        teacher_subjects_matches = {}
        for teacher in available_teachers:
            teacher_subjects_matches[teacher] = [subject for subject in available_subjects if subject.id in [teacher_subject.subject_id for teacher_subject in self.teacher_subjects if teacher_subject.teacher_id == teacher.id]]
        
        # create lessons from matching teacher-subject pairs
        available_lessons = []
        for teacher, subjects in teacher_subjects_matches.items():
            for subject in subjects:
                available_lessons.append(Lesson(subject, teacher, classroom.room, classroom, timeslot))
        
        # remove lessons that have already been scheduled in the same day
        earlier_lessons = self.get_days_lessons_sorted(timeslot, classroom)

        for lesson in available_lessons:
            # get names of earlier subjects in that day 
            earlier_lesson_names = [earlier_lesson.subject.navn for earlier_lesson in earlier_lessons]

            # if the subject is not scheduled at all dont remove it
            if sum(1 for earlier_lesson_name in earlier_lesson_names if lesson.subject.navn in earlier_lesson_name) == 0:
                continue

            # if the subject is scheduled twice remove it from available lessons
            if sum(1 for earlier_lesson_name in earlier_lesson_names if lesson.subject.navn in earlier_lesson_name) == 2:
                available_lessons.remove(lesson)
                continue

            # if the subject is not scheduled right after or before the previous occurrence remove it
            if lesson.subject.navn not in [earlier_lesson.subject.navn for earlier_lesson in earlier_lessons if earlier_lesson.timeslot.start_time == lesson.timeslot.end_time or lesson.timeslot.start_time == earlier_lesson.timeslot.end_time]:
                available_lessons.remove(lesson)
                
        return available_lessons

    def solve(self):
        #self.get_available_lessons(self.timeslots[0], self.classrooms[0])
        for timeslot in self.timeslots:
            if timeslot.is_break:
                continue
            for classroom in self.classrooms:
                try:
                    self.lessons.append(random.choice(self.get_available_lessons(timeslot, classroom)))
                except IndexError:
                    #print(f"No available lessons for {timeslot} and {classroom}")
                    break
        #print(self.lessons)

class Lesson:
    def __init__(self, subject: object, teacher: object, room: object, classroom: object, timeslot: object):
        self.subject = subject
        self.teacher = teacher
        self.room = room
        self.classroom = classroom
        self.timeslot = timeslot

    def __repr__(self):
        return f"Lesson(subject='{self.subject.navn}', teacher='{self.teacher.fornavn}', room='{self.room}', classroom='{self.classroom.name}', timeslot={self.timeslot.start_time})"

    def is_conflict(self, other):
        if self.timeslot == other.timeslot and self.room == other.room:
            return True
        elif self.timeslot == other.timeslot and self.teacher == other.teacher:
            return True
        elif self.timeslot == other.timeslot and self.classroom == other.classroom:
            return True
        return False


def main():
    db = SessionLocal()
    schedule = Schedule(db)
    schedule.solve()
    #print(schedule)

if __name__ == "__main__":
    main()
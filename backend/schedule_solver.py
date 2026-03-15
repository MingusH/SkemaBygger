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

    def get_lessons_in_day_and_classroom(self, timeslot, classroom):
        lessons_in_day_and_classroom = []
        for lesson in self.lessons:
            if lesson.timeslot.day_of_week == timeslot.day_of_week:
                if lesson.classroom == classroom:
                    lessons_in_day_and_classroom.append(lesson)
        return lessons_in_day_and_classroom

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
        earlier_lessons = self.get_lessons_in_day_and_classroom(timeslot, classroom)
        earlier_lesson_names = [earlier_lesson.subject.navn for earlier_lesson in earlier_lessons]

        # to remove lessons after checking constraints
        lessons_to_remove = []

        # check constraints for each lesson
        for lesson in available_lessons:
            
            count = earlier_lesson_names.count(lesson.subject.navn)

            # if the subject is scheduled twice remove it from available lessons
            if  count == 2:
                lessons_to_remove.append(lesson)

            # if the subject is scheduled once check if the lesson is adjecent to it otherwise remove it from available lessons
            elif count == 1:
                  other_lesson = [earlier_lesson for earlier_lesson in earlier_lessons if earlier_lesson.subject.navn == lesson.subject.navn][0]
                  if other_lesson.timeslot.start_time != lesson.timeslot.end_time and other_lesson.timeslot.end_time != lesson.timeslot.start_time:
                        lessons_to_remove.append(lesson)

        # remove lessons that didn't pass the constraints
        for lesson in lessons_to_remove:
            available_lessons.remove(lesson)

        return available_lessons

    def solve(self):
        #self.get_available_lessons(self.timeslots[0], self.classrooms[0])
        for timeslot in self.timeslots:
            if timeslot.is_break:
                continue
            for classroom in self.classrooms:
                try:                    
                    lesson = random.choice(self.get_available_lessons(timeslot, classroom))
                    self.lessons.append(lesson)
                except IndexError:
                    break


class Lesson:
    def __init__(self, subject: object, teacher: object, room: object, classroom: object, timeslot: object):
        self.subject = subject
        self.teacher = teacher
        self.room = room
        self.classroom = classroom
        self.timeslot = timeslot

    def __repr__(self):
        return f"Lesson(subject='{self.subject.navn}', teacher='{self.teacher.fornavn}', room='{self.room}', classroom='{self.classroom.name}', timeslot={self.timeslot.start_time}, {self.timeslot.day_of_week})"

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

if __name__ == "__main__":
    main()
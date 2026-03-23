from database import get_db, SessionLocal, engine
from fastapi import Depends
from sqlalchemy.orm import Session
import models
import random
from pdf_parser import MinistryPDFParser


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
        self.db_dict = {
            "teachers": self.teachers,
            "teacher_availability": self.teacher_availability,
            "classrooms": self.classrooms,
            "rooms": self.rooms,
            "subjects": self.subjects,
            "timeslots": self.timeslots,
            "class_subjects": self.class_subjects,
            "teacher_subjects": self.teacher_subjects,
            "teacher_special_days": self.teacher_special_days
        }
        self.ministry_recommendations = self.get_ministry_recommendations()
        self.map_ministry_recommendations()
        self.current_classroom = 0
        self.schedule_nodes = []
        self.schedule_nodes.append(ScheduleTreeNode(self.classrooms[self.current_classroom], self.db_dict, self.ministry_recommendations, self.schedule_nodes))
        self.is_solved = False

    def __repr__(self):
        return f"Schedule(teachers={len(self.teachers)}, classrooms={len(self.classrooms)}, rooms={len(self.rooms)}, subjects={len(self.subjects)}, timeslots={len(self.timeslots)})"

    def get_ministry_recommendations(self):
        parser = MinistryPDFParser()
        url = "https://uvm.dk/media/dfnbhhem/241218-timetalsoversigt-for-skoleaaret-2026-2027-pdf.pdf"
        return parser.parse_ministry_pdf(url)

    def map_ministry_recommendations(self):
        for subject in self.subjects:
            if subject.navn not in self.ministry_recommendations['grade_requirements']:
                print(f"Subject {subject.navn} not found in ministry recommendations creating valgfag")
                subject.recommendations = self.ministry_recommendations["grade_requirements"]["Lokalt valgfag"]
            else:
                subject.recommendations = self.ministry_recommendations["grade_requirements"][subject.navn]

    def is_solution(self):
        if len(self.schedule_nodes) == len(self.classrooms):
            for schedule in self.schedule_nodes:
                if not schedule.meets_ministry_standards():
                    return False
            return True
        return False

    def solve(self):
        while not self.is_solved:
            self.schedule_nodes[-1].generate_solution()
            if self.schedule_nodes[-1].has_no_solution:
                # backtrack
                self.schedule_nodes.pop()
                self.current_classroom -= 1
                continue
            else:
                # move to next node
                self.current_classroom += 1
                self.schedule_nodes.append(ScheduleTreeNode(self.classrooms[self.current_classroom], self.db_dict, self.ministry_recommendations, self.schedule_nodes))
            
            print(len(self.schedule_nodes))

            if self.is_solution():
                self.is_solved = True
                lessons = []
                for node in self.schedule_nodes:
                    for lesson_node in node.lessons_tree:
                        lessons.append(lesson_node.lesson)
                return lessons


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


class ScheduleTreeNode():
    def __init__(self, classroom: object, db_dict, ministry_recommendations, schedule_nodes):
        self.classroom = classroom
        self.schedule_nodes = schedule_nodes
        self.db_dict = db_dict
        self.ministry_recommendations = ministry_recommendations
        self.has_no_solution = False
        self.partial_solution = False
        self.lessons_tree = []
        for timeslot in self.db_dict['timeslots']:
            self.lessons_tree.append(LessonTreeNode(timeslot, self.classroom, self.db_dict, self.ministry_recommendations, self.schedule_nodes, self.lessons_tree))
            self.lessons_tree[-1].generate_possible_lessons()
    
    def get_lessons_list(self):
        lessons = []
        for node in self.schedule_nodes:
            for lesson_node in node.lessons_tree:
                if lesson_node.lesson is not None:
                    lessons.append(lesson_node.lesson)
        return lessons

    def get_classroom_hours(self, classroom):
        hours = {}
        for row in self.db_dict['class_subjects']:
            if row.class_id == classroom.id:
                hours[self.db_dict['subjects'][row.subject_id - 1].navn] = 0

        for lesson in self.get_lessons_list():
            if lesson.classroom.id == classroom.id:
                hours[lesson.subject.navn] += 1
        return hours

    def meets_ministry_standards(self):
        hours = self.get_classroom_hours(self.classroom)
        grade_requirements = self.ministry_recommendations["grade_requirements"]

        for subject in hours:
            if grade_requirements[subject][2026 - self.classroom.start_year] > hours[subject]:
                return False
        return True
    

    def generate_solution(self):
        if self.partial_solution:
            self.lessons_tree[-1].generate_possible_lessons()

        while not self.meets_ministry_standards():
            self.lessons_tree[-1].generate_possible_lessons()
            
            while self.lessons_tree[-1].has_no_lessons:
                self.lessons_tree.pop()
                
                if len(self.lessons_tree) == 0:
                    self.has_no_solution = True
                    return
                
                self.lessons_tree[-1].generate_possible_lessons()
                
            while len(self.lessons_tree) < len(self.db_dict['timeslots']):
                self.lessons_tree.append(LessonTreeNode(self.db_dict['timeslots'][len(self.lessons_tree)], self.classroom, self.db_dict, self.ministry_recommendations, self.schedule_nodes, self.lessons_tree))
                self.lessons_tree[-1].generate_possible_lessons()

        self.partial_solution = True

class LessonTreeNode():
    def __init__(self, timeslot: object, classroom, db_dict, ministry_recommendations, schedule_nodes, lessons_tree):
        self.db_dict = db_dict
        self.lessons_tree = lessons_tree
        self.schedule_nodes = schedule_nodes
        self.ministry_recommendations = ministry_recommendations
        self.timeslot = timeslot
        self.classroom = classroom
        self.possible_lessons = []
        self.is_generated = False
        self.has_no_lessons = False
        self.lesson = None

    def get_lessons_list(self):
        lessons = []
        for node in self.schedule_nodes:
            for lesson_node in node.lessons_tree:
                if lesson_node.lesson is not None:
                    lessons.append(lesson_node.lesson)
        return lessons + [node.lesson for node in self.lessons_tree if node.lesson is not None]

    def get_lessons_for_timeslot(self, timeslot):
        return [lesson for lesson in self.get_lessons_list() if lesson.timeslot == timeslot]


    def get_available_teachers(self, timeslot):
        available_teachers = [teacher for teacher in self.db_dict['teachers'] if teacher.id not in [availability.teacher_id for availability in self.db_dict['teacher_availability'] if availability.timeslot_id == timeslot.id]]
        lessons = self.get_lessons_for_timeslot(timeslot)
        for lesson in lessons:
            if lesson.teacher in available_teachers:
                available_teachers.remove(lesson.teacher)
        return available_teachers


    def get_classroom_subjects(self, classroom):
        return [self.db_dict['subjects'][class_subject.subject_id - 1] for class_subject in self.db_dict['class_subjects'] if class_subject.class_id == classroom.id]


    def get_lessons_from_teacher_subject(self, teachers, subjects, classroom, timeslot):
        # find matching teacher-subject pairs
        teacher_subjects_matches = {}
        for teacher in teachers:
            teacher_subjects_matches[teacher] = [subject for subject in subjects if subject.id in [teacher_subject.subject_id for teacher_subject in self.db_dict['teacher_subjects'] if teacher_subject.teacher_id == teacher.id]]

        # create lessons from matching teacher-subject pairs
        available_lessons = []
        for teacher, subjects in teacher_subjects_matches.items():
            for subject in subjects:
                available_lessons.append(Lesson(subject, teacher, classroom.room, classroom, timeslot))
        
        return available_lessons


    def get_lessons_in_day_and_classroom(self, timeslot, classroom):
        lessons_in_day_and_classroom = []
        for lesson in self.get_lessons_list():
            if lesson.timeslot.day_of_week == timeslot.day_of_week:
                if lesson.classroom == classroom:
                    lessons_in_day_and_classroom.append(lesson)
        return lessons_in_day_and_classroom


    def placement_constraints(self, lessons: list, timeslot: object, classroom: object):
        # remove lessons that have already been scheduled in the same day
        earlier_lessons = self.get_lessons_in_day_and_classroom(timeslot, classroom)
        earlier_lesson_names = [earlier_lesson.subject.navn for earlier_lesson in earlier_lessons]

        # to remove lessons after checking constraints
        lessons_to_remove = []

        # check constraints for each lesson
        for lesson in lessons:
            
            count = earlier_lesson_names.count(lesson.subject.navn)

            # if the subject is scheduled twice remove it from available lessons
            if  count == 2 and lesson.subject.recommendations[2026 - classroom.start_year] <= 10:
                lessons_to_remove.append(lesson)

            # if the subject is scheduled once check if the lesson is adjecent to it otherwise remove it from available lessons
            elif count == 1:
                  other_lesson = [earlier_lesson for earlier_lesson in earlier_lessons if earlier_lesson.subject.navn == lesson.subject.navn][0]
                  if other_lesson.timeslot.start_time != lesson.timeslot.end_time and other_lesson.timeslot.end_time != lesson.timeslot.start_time:
                        lessons_to_remove.append(lesson)

        # remove lessons that didn't pass the constraints
        for lesson in lessons_to_remove:
            lessons.remove(lesson)

        return lessons


    def get_classroom_hours(self, classroom):
        hours = {}
        for row in self.db_dict['class_subjects']:
            if row.class_id == classroom.id:
                hours[self.db_dict['subjects'][row.subject_id - 1].navn] = 0

        for lesson in self.get_lessons_list():
            if lesson.classroom.id == classroom.id:
                hours[lesson.subject.navn] += 1
        return hours


    def follow_recommendations(self, lessons, classroom):
        # get the curren amount of hours for each subject in the classroom
        current_hours = self.get_classroom_hours(classroom)

        to_remove = []

        # follow recommendations for each lesson
        for lesson in lessons:
            # if the subject is scheduled more than the recommendation remove it from available lessons
            if lesson.subject.recommendations[2026 - classroom.start_year] <= current_hours[lesson.subject.navn]:
                to_remove.append(lesson)

        for lesson in to_remove:
            lessons.remove(lesson)

        return lessons
                

    def get_available_lessons(self, timeslot, classroom):
        # get available teachers and subjects for the given timeslot and classroom
        available_teachers = self.get_available_teachers(timeslot)
        available_subjects = self.get_classroom_subjects(classroom)
        
        # find matching teacher-subject pairs
        available_lessons = self.get_lessons_from_teacher_subject(available_teachers, available_subjects, classroom, timeslot)
        
        # apply placement constraints
        available_lessons = self.placement_constraints(available_lessons, timeslot, classroom)

        # apply ministry recommendations
        available_lessons = self.follow_recommendations(available_lessons, classroom)

        return available_lessons

    def generate_possible_lessons(self):
        if not self.is_generated:
            self.possible_lessons = self.get_available_lessons(self.timeslot, self.classroom)
            self.is_generated = True

            if len(self.possible_lessons) == 0:
                self.has_no_lessons = True
                self.lesson = None

            else:
                self.lesson = self.possible_lessons[0]
                self.possible_lessons.pop(0)

        else:
            if len(self.possible_lessons) == 0:
                self.has_no_lessons = True
                self.lesson = None

            else:
                self.lesson = self.possible_lessons[0]
                self.possible_lessons.pop(0)


def main():
    db = SessionLocal()
    schedule = Schedule(db)
    schedule.solve()

if __name__ == "__main__":
    main()

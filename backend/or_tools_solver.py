from ortools.sat.python import cp_model
from pdf_parser import MinistryPDFParser
from database import SessionLocal
import models

class Lesson:
    def __init__(self, subject: object, teacher: object, room: object, classroom: object, timeslot: object):
        self.subject = subject
        self.teacher = teacher
        self.room = room
        self.classroom = classroom
        self.timeslot = timeslot

    def __repr__(self):
        return f"Lesson(subject='{self.subject.navn}', teacher='{self.teacher.fornavn}', room='{self.room}', classroom='{self.classroom.name}', timeslot={self.timeslot.start_time}, {self.timeslot.day_of_week})"

def main():
    model = cp_model.CpModel()

    db = SessionLocal()

    teachers = db.query(models.Teacher).all()
    teacher_availability = db.query(models.TeacherAvailability).all()
    classrooms = db.query(models.Classroom).all()
    rooms = db.query(models.Room).all()
    subjects = db.query(models.Subject).all()
    timeslots = db.query(models.TimeSlot).all()
    class_subjects = db.query(models.class_subjects).all()
    teacher_subjects = db.query(models.teacher_subjects).all()
    teacher_special_days = db.query(models.teacher_special_days).all()

    db.close()

    parser = MinistryPDFParser()
    url = "https://uvm.dk/media/dfnbhhem/241218-timetalsoversigt-for-skoleaaret-2026-2027-pdf.pdf"
    ministry_requirements = parser.parse_ministry_pdf(url)["grade_requirements"]


    for subject in subjects:
        if subject.navn not in ministry_requirements:
            print(f"Subject {subject.navn} not found in ministry recommendations creating valgfag")
            subject.recommendations = ministry_requirements["Lokalt valgfag"]
        else:
            subject.recommendations = ministry_requirements[subject.navn]


    # setup schedule representation with bools
    schedule = {}
    for c in classrooms:
        for t in timeslots:
            for l in teachers:
                for s in subjects:
                    schedule[(c.id, t.id, l.id, s.id)] = model.NewBoolVar(f"schedule_{c.id}_{t.id}_{l.id}_{s.id}")

    # Constraint: Each timeslot can only have one lesson
    for t in timeslots:
        for c in classrooms:
            model.Add(sum(schedule[(c.id, t.id, l.id, s.id)] for l in teachers for s in subjects) <= 1)

    # Constraint: Each timeslot can only have one lesson if it's not a break
    for t in timeslots:
        if t.is_break:
            for c in classrooms:
                model.Add(sum(schedule[(c.id, t.id, l.id, s.id)] for l in teachers for s in subjects) == 0)

    # Constraints from ministry requirements
    for s in subjects:
        for c in classrooms:
            model.Add(sum(schedule[(c.id, t.id, l.id, s.id)] for t in timeslots for l in teachers) >= int(s.recommendations[2026 - c.start_year]))


    # Constraint: Each teacher can only teach one subject at a time
    for t in timeslots:
        for l in teachers:
            model.Add(sum(schedule[(c.id, t.id, l.id, s.id)] for c in classrooms for s in subjects) <= 1)

    # Constraint: Each classroom can only have one lesson at a time
    for t in timeslots:
        for c in classrooms:
            model.Add(sum(schedule[(c.id, t.id, l.id, s.id)] for l in teachers for s in subjects) <= 1)

    # Constraint: Teachers can only teach in their available timeslots
    for t_a in teacher_availability:
        model.Add(sum(schedule[(c.id, t.id, l.id, s.id)] for c in classrooms for s in subjects for t in timeslots if t.id == t_a.timeslot_id for l in teachers if l.id == t_a.teacher_id) == 0)

    # Solve the model
    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    lessons = []
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        print("Solution found!")
        for c in classrooms:
            for t in timeslots:
                for l in teachers:
                    for s in subjects:
                        if solver.Value(schedule[(c.id, t.id, l.id, s.id)]):
                            lessons.append(Lesson(s, l, c.room, c, t))
    else:
        print("No solution found")

    return lessons

if __name__ == "__main__":
    main()

